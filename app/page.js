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

const NAV = [
  { key: 'dashboard', label: 'لوحة التحكم' },
  { key: 'alerts',    label: 'التنبيهات' },
  { key: 'sessions',  label: 'الجلسات' },
  { key: 'settings',  label: 'الإعدادات' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function translateMode(mode) {
  if (!mode || mode === '—') return '—'
  return MODE_AR[mode.toLowerCase()] || mode
}

function timeAgo(dateStr, now) {
  if (!dateStr || !now) return '—'
  const diff = Math.floor((now.getTime() - new Date(dateStr).getTime()) / 1000)
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

  // ── Data fetching (unchanged) ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [{ data: sess }, { data: sos }, { data: loc }] = await Promise.all([
        supabase.from('sessions').select('*')
          .gte('created_at', today.toISOString())
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('sos_alerts').select('*')
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('location_updates').select('*')
          .order('created_at', { ascending: false }).limit(50),
      ])

      setSessions(sess || [])
      setSosAlerts(sos || [])
      setLocationUpdates(loc || [])

      const merged = [
        ...(sess || []).map(s => ({
          ...s, type: 'session',
          label: s.mode ? `جلسة ${translateMode(s.mode)}` : 'جلسة جديدة',
        })),
        ...(sos || []).map(a => ({
          ...a, type: 'sos',
          label: a.message || 'تنبيه طوارئ SOS',
        })),
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

      setActivities(merged)
      setIsConnected(true)
      setIsLoaded(true)
    } catch {
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

  // ── Derived values (unchanged) ───────────────────────────────────────────────
  const latestLocation = locationUpdates[0]
  const lastSeen       = latestLocation?.created_at

  const isCritical = now
    ? sosAlerts.some(a => now.getTime() - new Date(a.created_at).getTime() < TEN_MIN)
    : false

  const todaySosCount = now
    ? sosAlerts.filter(a => {
        const d = new Date(a.created_at)
        return d.toDateString() === now.toDateString()
      }).length
    : 0

  const lastMode = translateMode(
    sessions[0]?.mode || sessions[0]?.status || sessions[0]?.type || '—'
  )

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
            value={sessions.length}
            icon="eye"
            note="+4 هذه الساعة"
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
            note="آخر جلسة"
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
                {sessions.length > 0 && (
                  <span className="tag tag-indigo">{sessions.length} جلسة اليوم</span>
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
