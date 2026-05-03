'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import Topbar from '../components/Topbar'
import Sidebar from '../components/Sidebar'
import StatCard from '../components/StatCard'
import ActivityList from '../components/ActivityList'
import MapPanel from '../components/MapPanel'

// ─── Constants ────────────────────────────────────────────────────────────────

const TEN_MIN = 10 * 60 * 1000

const MODE_AR = {
  explore:  'استكشاف',
  read:     'قراءة',
  describe: 'وصف',
  find:     'بحث',
  currency: 'عملة',
}

// map common Arabic mode labels back to canonical keys
const AR_TO_KEY = {
  'استكشاف': 'explore',
  'قراءة': 'read',
  'وصف': 'describe',
  'بحث': 'find',
  'عملة': 'currency',
}

const NAV = [
  { key: 'dashboard', label: 'لوحة التحكم' },
  { key: 'alerts',    label: 'التنبيهات' },
  { key: 'sessions',  label: 'الجلسات' },
  { key: 'settings',  label: 'الإعدادات' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Supabase may return timestamps without timezone info — always treat as UTC
function parseDate(s) {
  if (!s) return null
  if (typeof s === 'string' && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z')
  }
  return new Date(s)
}

function translateMode(mode) {
  if (!mode || mode === '—') return '—'
  const normalized = String(mode).trim()
  if (AR_TO_KEY[mode]) return MODE_AR[AR_TO_KEY[mode]] || mode
  return MODE_AR[normalized.toLowerCase()] || mode
}

function timeAgo(dateStr, now) {
  if (!dateStr || !now) return '—'
  const diff = Math.floor((now.getTime() - parseDate(dateStr).getTime()) / 1000)
  if (diff < 5)  return 'الآن'
  if (diff < 60) return `منذ ${diff} ثانية`
  const m = Math.floor(diff / 60)
  if (m < 60)    return `منذ ${m} دقيقة`
  const h = Math.floor(m / 60)
  if (h < 24)    return `منذ ${h} ساعة`
  return `منذ ${Math.floor(h / 24)} يوم`
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  // ── State (unchanged) ───────────────────────────────────────────────────────
  const [sessions,        setSessions]        = useState([])
  const [sosAlerts,       setSosAlerts]       = useState([])
  const [locationUpdates, setLocationUpdates] = useState([])
  const [activities,      setActivities]      = useState([])
  const [isConnected,     setIsConnected]     = useState(false)
  const [isLoaded,        setIsLoaded]        = useState(false)
  const [activeNav,       setActiveNav]       = useState('dashboard')
  const [now,             setNow]             = useState(null)
  const [todaySessionCount, setTodaySessionCount] = useState(0)
  const [todaySosCount,     setTodaySosCount]     = useState(0)
  const [lastSessionInfo,   setLastSessionInfo]   = useState(null)
  const [isCritical,        setIsCritical]        = useState(false)

  // ── Data fetching ────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const dayStart = new Date()
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayEnd.getDate() + 1)

      const criticalSince = new Date(Date.now() - TEN_MIN)

      const [
        { data: sess },
        { data: sos },
        { data: loc },
        { count: sessionCount },
        { count: sosCount },
        { data: latestSessionWithMode },
        { count: criticalSosCount },
      ] = await Promise.all([
        supabase.from('sessions').select('*')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('sos_alerts').select('*')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('location_updates').select('*')
          .order('created_at', { ascending: false }).limit(1),
        supabase.from('sessions')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase.from('sos_alerts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase.from('sessions')
          .select('mode, created_at')
          .not('mode', 'is', null)
          .neq('mode', '')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('sos_alerts')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', criticalSince.toISOString()),
      ])

      setSessions(sess || [])
      setSosAlerts(sos || [])
      setLocationUpdates(loc || [])
      setTodaySessionCount(sessionCount || 0)
      setTodaySosCount(sosCount || 0)
      setLastSessionInfo(latestSessionWithMode || null)
      setIsCritical((criticalSosCount || 0) > 0)

      // Debug: log raw mode values to help trace mismatches
      try {
        console.debug('[AIEyes][adapted] latestSessionWithMode:', latestSessionWithMode)
        console.debug('[AIEyes][adapted] sample session modes:', (sess || []).slice(0, 20).map(s => s.mode))
      } catch (e) {
        // ignore
      }

      const merged = [
        ...(sess || []).map(s => ({
          ...s, type: 'session',
          label: s.mode ? `جلسة ${translateMode(s.mode)}` : 'جلسة جديدة',
        })),
        ...(sos || []).map(a => ({
          ...a, type: 'sos',
          label: a.message || 'تنبيه طوارئ SOS',
        })),
      ].sort((a, b) => (parseDate(b.created_at)?.getTime() ?? 0) - (parseDate(a.created_at)?.getTime() ?? 0))

      setActivities(merged)
      setIsConnected(true)
      setIsLoaded(true)
    } catch (err) {
      console.error('[AIEyes] fetch error:', err)
      setIsConnected(false)
      setIsLoaded(true)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const iv = setInterval(fetchData, 10000)
    return () => clearInterval(iv)
  }, [fetchData])

  useEffect(() => {
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // ── Derived values ───────────────────────────────────────────────────────────
  const latestLocation = locationUpdates[0]
  const lastSeen       = latestLocation?.created_at

  const lastMode           = translateMode(lastSessionInfo?.mode || '—')
  const lastSessionTimeStr = lastSessionInfo?.created_at && now ? timeAgo(lastSessionInfo.created_at, now) : ''

  const lastSeenStr = lastSeen && now ? timeAgo(lastSeen, now) : '—'
  const coordStr    = latestLocation
    ? `${Number(latestLocation.latitude).toFixed(4)}, ${Number(latestLocation.longitude).toFixed(4)}`
    : 'لا يوجد موقع'

  // ── JSX ─────────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      {/* Topbar spans both columns */}
      <Topbar isConnected={isConnected} sosCount={todaySosCount} />

      {/* Sidebar */}
      <Sidebar active={activeNav} onChange={setActiveNav} isConnected={isConnected} />

      {/* Main content */}
      <main className="main-area">

        {/* ── Row 1: 4 stat cards + hero card ── */}
        <div className="row-stats-hero">

          <StatCard
            label="جلسات اليوم"
            value={todaySessionCount}
            icon="eye"
            note={todaySessionCount > 0 ? 'تحديث كل 10 ث' : 'لا جلسات اليوم'}
            col="green"
          />

          <StatCard
            label="تنبيهات اليوم"
            value={todaySosCount}
            danger={todaySosCount > 0}
            icon="bell"
            note={todaySosCount > 0 ? 'يوجد حرج' : 'لا تنبيهات'}
          />

          <StatCard
            label="آخر وضع"
            value={lastMode || '—'}
            icon="mode"
            note={lastSessionTimeStr || 'لا جلسات'}
            col="indigo"
          />

          <StatCard
            label="آخر ظهور"
            value={lastSeenStr}
            icon="clock"
            note="منذ آخر تحديث"
            col="muted"
          />

          {/* Hero safety card */}
          <div className="hero-card">
            <div style={{ flex: 1 }}>
              <div className="hero-eyebrow">SAFETY STATUS</div>
              <div className={`hero-status ${isCritical ? 'critical' : ''}`}>
                {isCritical ? 'تنبيه حرج!' : 'الحالة مستقرة'}
              </div>
              <div className="hero-sub">
                {isCritical
                  ? 'يوجد تنبيه SOS نشط — تحقق فوراً'
                  : 'لا توجد تنبيهات نشطة الآن'}
              </div>
              <div className="hero-tags">
                {lastMode !== '—' && (
                  <span className="tag tag-indigo">آخر وضع: {lastMode}</span>
                )}
                <span className={`tag ${isCritical ? 'tag-red' : 'tag-green'}`}>
                  {isCritical ? '⚠ SOS نشط' : 'داخل المنطقة ✓'}
                </span>
                {todaySessionCount > 0 && (
                  <span className="tag tag-indigo">{todaySessionCount} جلسة اليوم</span>
                )}
              </div>
            </div>

            {/* Animated status ring */}
            <div className="ring-wrap">
              <div className="ring-outer"/>
              <div className="ring-middle"/>
              <div className="ring-inner"/>
              <div className="ring-dot">
                <div className={`ring-dot-inner ${isCritical ? 'critical' : ''}`}/>
              </div>
            </div>
          </div>
        </div>

        {/* ── Row 2: Map + Activity timeline ── */}
        <div className="row-map-timeline">

          {/* Map panel */}
          <div className="panel">
            <div className="panel-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: isConnected ? 'var(--g)' : 'var(--muted)',
                  boxShadow: isConnected ? '0 0 9px var(--g)' : undefined,
                  animation: isConnected ? 'blink 1.8s infinite' : undefined,
                }}/>
                <span className="panel-header-title">الموقع المباشر</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'Space Grotesk' }}>
                  تحديث كل 10 ث
                </span>
                <span style={{ fontSize: 10, color: 'var(--g)', padding: '2px 9px', borderRadius: 10,
                  background: 'var(--gb)', border: '1px solid var(--gbr)' }}>
                  {coordStr}
                </span>
              </div>
            </div>

            <div className="panel-body">
              <MapPanel latestLocation={latestLocation} sosAlerts={sosAlerts} />
            </div>

            <div className="panel-footer">
              <span style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ color: 'var(--g)' }}>✓</span> دقة GPS: ±5م
              </span>
              <span>الحديقة الشمالية، المدينة</span>
            </div>
          </div>

          {/* Activity timeline */}
          <div className="panel">
            <div className="panel-header">
              <span className="panel-header-title">سجل النشاط</span>
              <span style={{
                fontSize: 11, fontFamily: 'Space Grotesk', fontWeight: 600,
                padding: '2px 10px', borderRadius: 10,
                background: 'var(--gb)', color: 'var(--g)', border: '1px solid var(--gbr)',
              }}>
                {activities.length}
              </span>
            </div>
            <div className="panel-body">
              <ActivityList activities={activities} now={now} />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
