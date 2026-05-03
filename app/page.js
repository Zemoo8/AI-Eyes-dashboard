'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { ensureFamilyProfile, acceptInvite, loadLinkedUsers, unlinkUser } from '../lib/authHelpers'
import Topbar       from '../components/Topbar'
import Sidebar      from '../components/Sidebar'
import StatCard     from '../components/StatCard'
import ActivityList from '../components/ActivityList'
import MapPanel     from '../components/MapPanel'
import AuthScreen   from '../components/AuthScreen'
import PairingScreen from '../components/PairingScreen'

// ─── Constants ────────────────────────────────────────────────────────────────

const TEN_MIN = 10 * 60 * 1000

const MODE_AR = {
  explore:  'استكشاف',
  read:     'قراءة',
  describe: 'وصف',
  find:     'بحث',
  currency: 'عملة',
}

const AR_TO_KEY = {
  'استكشاف': 'explore',
  'قراءة':   'read',
  'وصف':     'describe',
  'بحث':     'find',
  'عملة':    'currency',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseDate(s) {
  if (!s) return null
  if (typeof s === 'string' && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z')
  }
  return new Date(s)
}

function translateMode(mode) {
  if (!mode || mode === '—') return '—'
  let m = String(mode).trim()
  if (m.startsWith('جلسة ')) m = m.slice(5).trim()
  if (AR_TO_KEY[m]) return MODE_AR[AR_TO_KEY[m]] || m
  return MODE_AR[m.toLowerCase()] || m
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

  // ── Screen routing ───────────────────────────────────────────────────────────
  const [screen,      setScreen]      = useState('loading')  // 'loading'|'auth'|'pairing'|'dashboard'
  const [authLoading, setAuthLoading] = useState(true)

  // ── Auth / user state ────────────────────────────────────────────────────────
  const [authUser,          setAuthUser]          = useState(null)
  const [parentProfile,     setParentProfile]     = useState(null)
  const [linkedUsers,       setLinkedUsers]       = useState([])
  const [selectedLink,      setSelectedLink]      = useState(null)
  const [selectedAppUserId, setSelectedAppUserId] = useState(null)
  const pendingCodeRef                            = useRef(null)
  const authProcessingRef                         = useRef(false)
  const authInitTokenRef                          = useRef(null)
  const authInitStageRef                          = useRef('starting')
  const isAuthenticatedRef                        = useRef(false)
  const [inviteError,       setInviteError]       = useState(null)
  const [initError,         setInitError]         = useState(null)

  // ── Dashboard data ───────────────────────────────────────────────────────────
  const [sessions,          setSessions]          = useState([]) // eslint-disable-line @typescript-eslint/no-unused-vars
  const [sosAlerts,         setSosAlerts]         = useState([])
  const [locationUpdates,   setLocationUpdates]   = useState([])
  const [activities,        setActivities]        = useState([])
  const [isConnected,       setIsConnected]       = useState(false)
  const [isLoaded,          setIsLoaded]          = useState(false)
  const [activeNav,         setActiveNav]         = useState('dashboard')
  const [now,               setNow]               = useState(null)
  const [todaySessionCount, setTodaySessionCount] = useState(0)
  const [todaySosCount,     setTodaySosCount]     = useState(0)
  const [lastSessionInfo,   setLastSessionInfo]   = useState(null)
  const [isCritical,        setIsCritical]        = useState(false)

  // ── Auth initialization ──────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true
    let resolved = false

    const finishInit = () => {
      if (!mounted || resolved) return
      resolved = true
      authInitTokenRef.current = null
      setAuthLoading(false)
      authInitStageRef.current = 'done'
      console.log('[AIEyes] auth init done')
    }

    const clearDashboardState = () => {
      isAuthenticatedRef.current = false
      setAuthUser(null)
      setParentProfile(null)
      setLinkedUsers([])
      setSelectedLink(null)
      setSelectedAppUserId(null)
      setSessions([])
      setSosAlerts([])
      setLocationUpdates([])
      setActivities([])
      setIsConnected(false)
      setIsLoaded(false)
    }

    const isCurrentInit = () => authInitTokenRef.current !== null && !resolved && mounted

    const sanitizeStoredSelection = (links) => {
      if (typeof localStorage === 'undefined') return null
      const savedId = localStorage.getItem('aieyes_selected_app_user_id')
      if (!savedId) return null
      const found = links.find(link => link.app_user_id === savedId)
      if (!found) {
        localStorage.removeItem('aieyes_selected_app_user_id')
        console.log('[AIEyes] stale selected app user cleared')
        return null
      }
      return savedId
    }

    const processAuthUser = async (user) => {
      if (authProcessingRef.current || !isCurrentInit()) return
      authProcessingRef.current = true
      authInitStageRef.current = 'session-found'
      console.log('[AIEyes] session found')

      try {
        const profile = await ensureFamilyProfile(user)
        if (!isCurrentInit()) return
        setAuthUser(user)
        setParentProfile(profile)

        const storedCode = typeof localStorage !== 'undefined'
          ? localStorage.getItem('aieyes_pending_invite_code')
          : null

        let preferredUserId = null

        if (storedCode) {
          try {
            preferredUserId = await acceptInvite(storedCode, user.id)
            if (isCurrentInit()) {
              localStorage.removeItem('aieyes_pending_invite_code')
              pendingCodeRef.current = null
            }
          } catch (err) {
            if (isCurrentInit()) {
              setInitError(err.message)
              localStorage.removeItem('aieyes_pending_invite_code')
              pendingCodeRef.current = null
            }
          }
        }

        const links = await loadLinkedUsers(user.id)
        if (!isCurrentInit()) return
        authInitStageRef.current = 'links-loaded'
        console.log('[AIEyes] linked users count', links.length)
        setLinkedUsers(links)

        if (!links.length) {
          console.log('[AIEyes] no linked user -> pairing')
          if (typeof localStorage !== 'undefined') {
            localStorage.removeItem('aieyes_selected_app_user_id')
          }
          setSelectedLink(null)
          setSelectedAppUserId(null)
          setScreen('pairing')
          return
        }

        const storedSelection = preferredUserId || sanitizeStoredSelection(links)
        let targetLink = null

        if (storedSelection) {
          targetLink = links.find(link => link.app_user_id === storedSelection)
        }
        if (!targetLink) {
          targetLink = links[0]
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('aieyes_selected_app_user_id', targetLink.app_user_id)
          }
        }

        console.log('[AIEyes] selected linked user', targetLink.app_user_id)
        setSelectedLink(targetLink)
        setSelectedAppUserId(targetLink.app_user_id)
        isAuthenticatedRef.current = true
        setScreen('dashboard')
      } catch (err) {
        console.error('[AIEyes] auth init error:', err?.message || err)
        if (!mounted || resolved) return
        setInitError(err?.message || 'خطأ غير متوقع — حاول مجدداً')
        if (authInitStageRef.current === 'links-loaded') {
          setScreen('pairing')
        } else if (authInitStageRef.current === 'session-found') {
          setScreen('pairing')
        } else {
          setScreen('auth')
        }
      } finally {
        authProcessingRef.current = false
      }
    }

    const timeoutId = setTimeout(() => {
      if (!isCurrentInit()) return
      console.warn('[AIEyes] auth init timeout')
      setInitError('Authentication is taking too long. Please try again.')
      if (authInitStageRef.current === 'session-found' || authInitStageRef.current === 'links-loaded') {
        setScreen('pairing')
      } else {
        setScreen('auth')
      }
      finishInit()
    }, 8000)

    console.log('[AIEyes] auth init start')
    authInitTokenRef.current = Symbol('aieyes-auth-init')
    authInitStageRef.current = 'starting'

    ;(async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (!mounted || resolved) return

        if (error) {
          console.error('[AIEyes] session fetch error:', error.message || error)
          setInitError(error.message || 'Unable to initialize authentication')
          setScreen('auth')
          finishInit()
          return
        }

        if (!session?.user) {
          console.log('[AIEyes] no session -> auth')
          clearDashboardState()
          setScreen('auth')
          finishInit()
          return
        }

        await processAuthUser(session.user)
        finishInit()
      } catch (err) {
        console.error('[AIEyes] auth init error:', err?.message || err)
        if (!mounted || resolved) return
        setInitError(err?.message || 'خطأ غير متوقع — حاول مجدداً')
        setScreen('auth')
        finishInit()
      }
    })()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        authProcessingRef.current = false
        clearDashboardState()
        setInitError(null)
        console.log('[AIEyes] no session -> auth')
        setScreen('auth')
        finishInit()
        return
      }

      if (event === 'SIGNED_IN' && session?.user) {
        if (isAuthenticatedRef.current || authProcessingRef.current) return
        setAuthLoading(true)
        resolved = false  // reset so isCurrentInit() passes inside processAuthUser
        authInitTokenRef.current = Symbol('aieyes-auth-init')
        authInitStageRef.current = 'starting'
        console.log('[AIEyes] session found')
        await processAuthUser(session.user)
        finishInit()
      }
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
      if (authInitTokenRef.current) {
        authInitTokenRef.current = null
      }
    }
  }, []) // deps: empty — effect runs once on mount, callbacks close over stable setters

  // ── Data fetching — filtered by selectedAppUserId ────────────────────────────
  const fetchData = useCallback(async () => {
    if (!selectedAppUserId) return

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
          .eq('user_id', selectedAppUserId)
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('sos_alerts').select('*')
          .eq('user_id', selectedAppUserId)
          .order('created_at', { ascending: false }).limit(50),
        supabase.from('location_updates').select('*')
          .eq('user_id', selectedAppUserId)
          .order('created_at', { ascending: false }).limit(1),
        supabase.from('sessions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', selectedAppUserId)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase.from('sos_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', selectedAppUserId)
          .gte('created_at', dayStart.toISOString())
          .lt('created_at', dayEnd.toISOString()),
        supabase.from('sessions')
          .select('mode, created_at')
          .eq('user_id', selectedAppUserId)
          .not('mode', 'is', null)
          .neq('mode', '')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('sos_alerts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', selectedAppUserId)
          .gte('created_at', criticalSince.toISOString()),
      ])

      setSessions(sess || [])
      setSosAlerts(sos || [])
      setLocationUpdates(loc || [])
      setTodaySessionCount(sessionCount || 0)
      setTodaySosCount(sosCount || 0)
      setLastSessionInfo(latestSessionWithMode || null)
      setIsCritical((criticalSosCount || 0) > 0)

      try {
        console.debug('[AIEyes] latestSessionWithMode:', latestSessionWithMode)
        console.debug('[AIEyes] sample session modes:', (sess || []).slice(0, 5).map(s => s.mode))
      } catch { /* ignore */ }

      const merged = [
        ...(sess || []).map(s => ({
          ...s, type: 'session',
          label: s.mode ? `جلسة ${translateMode(s.mode)}` : 'جلسة جديدة',
        })),
        ...(sos || []).map(a => ({
          ...a, type: 'sos',
          label: a.message || 'تنبيه طوارئ SOS',
        })),
      ].sort((a, b) => {
        const td = (parseDate(b.created_at)?.getTime() ?? 0) - (parseDate(a.created_at)?.getTime() ?? 0)
        return td !== 0 ? td : (Number(b.id) || 0) - (Number(a.id) || 0)
      })

      setActivities(merged)
      setIsConnected(true)
      setIsLoaded(true)
    } catch (err) {
      console.error('[AIEyes] fetch error:', err)
      setIsConnected(false)
      setIsLoaded(true)
    }
  }, [selectedAppUserId])

  useEffect(() => {
    if (!selectedAppUserId || screen !== 'dashboard') return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData()
    const iv = setInterval(fetchData, 10000)
    return () => clearInterval(iv)
  }, [fetchData, selectedAppUserId, screen])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const iv = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  // ── Auth actions ─────────────────────────────────────────────────────────────

  const handleLogout = async () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aieyes_selected_app_user_id')
      localStorage.removeItem('aieyes_parent_profile')
      localStorage.removeItem('aieyes_pending_invite_code')
    }
    setInitError(null)
    setInviteError(null)
    await supabase.auth.signOut()
    // SIGNED_OUT handler clears the rest
  }

  const handleChangeUser = () => {
    setSelectedLink(null)
    setSelectedAppUserId(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('aieyes_selected_app_user_id')
    }
    setSessions([])
    setSosAlerts([])
    setLocationUpdates([])
    setActivities([])
    setIsConnected(false)
    setIsLoaded(false)
    setInviteError(null)
    setInitError(null)
    setScreen('pairing')
  }

  const handleUnlink = async (linkId) => {
    try {
      await unlinkUser(linkId)
      const updated = linkedUsers.filter(l => l.id !== linkId)
      setLinkedUsers(updated)
      if (selectedLink?.id === linkId) {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem('aieyes_selected_app_user_id')
        }
        setSessions([])
        setSosAlerts([])
        setLocationUpdates([])
        setActivities([])
        setIsConnected(false)
        setIsLoaded(false)
        if (updated.length > 0) {
          const next = updated[0]
          setSelectedLink(next)
          setSelectedAppUserId(next.app_user_id)
          localStorage.setItem('aieyes_selected_app_user_id', next.app_user_id)
        } else {
          setSelectedLink(null)
          setSelectedAppUserId(null)
          setScreen('pairing')
        }
      }
    } catch (err) {
      console.error('[AIEyes] unlink error:', err)
    }
  }

  const handleConnect = async (code) => {
    if (!authUser) return
    const appUserId = await acceptInvite(code, authUser.id)
    const links = await loadLinkedUsers(authUser.id)
    setLinkedUsers(links)
    const link = links.find(l => l.app_user_id === appUserId) || links[0]
    if (link) {
      setSelectedLink(link)
      setSelectedAppUserId(link.app_user_id)
      localStorage.setItem('aieyes_selected_app_user_id', link.app_user_id)
    }
    setScreen('dashboard')
  }

  // ── Derived values ───────────────────────────────────────────────────────────
  const latestLocation      = locationUpdates[0]
  const lastMode            = translateMode(lastSessionInfo?.mode || '—')
  const lastSessionTimeStr  = lastSessionInfo?.created_at && now ? timeAgo(lastSessionInfo.created_at, now) : ''

  const lastSeenStr = (() => {
    if (!activities[0]?.created_at || !now) return '—'
    const diff = Math.floor((now.getTime() - parseDate(activities[0].created_at).getTime()) / 1000)
    if (diff < 60) return '<1 دقيقة'
    return timeAgo(activities[0].created_at, now)
  })()

  const coordStr = latestLocation
    ? `${Number(latestLocation.latitude).toFixed(4)}, ${Number(latestLocation.longitude).toFixed(4)}`
    : 'لا يوجد موقع'

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (authLoading || screen === 'loading') {
    return (
      <div className="loading-screen">
        <div className="brand-badge" style={{ width: 64, height: 64, fontSize: 28 }}>👁</div>
        <div className="loading-ring" />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,.3)', fontFamily: 'Space Grotesk', letterSpacing: '.06em' }}>
          AIEyes Family Dashboard
        </div>
      </div>
    )
  }

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (screen === 'auth') {
    const storedCode = typeof window !== 'undefined'
      ? localStorage.getItem('aieyes_pending_invite_code')
      : null
    return (
      <AuthScreen
        pendingCode={storedCode}
        initError={initError || inviteError}
        onClearInitError={() => {
          setInviteError(null)
          setInitError(null)
        }}
      />
    )
  }

  // ── Pairing screen ───────────────────────────────────────────────────────────
  if (screen === 'pairing') {
    return (
      <PairingScreen
        parentProfile={parentProfile}
        linkedUsers={linkedUsers}
        onConnect={handleConnect}
        onLogout={handleLogout}
        onSelectUser={(link) => {
          setSelectedLink(link)
          setSelectedAppUserId(link.app_user_id)
          localStorage.setItem('aieyes_selected_app_user_id', link.app_user_id)
          setScreen('dashboard')
        }}
        inviteError={inviteError}
        initError={initError}
        onClearInviteError={() => {
          setInviteError(null)
          setInitError(null)
        }}
      />
    )
  }

  // ── Dashboard ────────────────────────────────────────────────────────────────
  return (
    <div className="app-shell">

      <Topbar
        isConnected={isConnected}
        sosCount={todaySosCount}
        monitoredUser={selectedLink?.app_user}
        onLogout={handleLogout}
        onChangeUser={handleChangeUser}
      />

      <Sidebar
        active={activeNav}
        onChange={setActiveNav}
        isConnected={isConnected}
        monitoredUser={selectedLink?.app_user}
        parentProfile={parentProfile}
        linkedUsers={linkedUsers}
        selectedLink={selectedLink}
        onLogout={handleLogout}
        onChangeUser={handleChangeUser}
        onUnlink={() => selectedLink && handleUnlink(selectedLink.id)}
      />

      <main className="main-area">

        {/* ── Row 1: 4 stat cards + hero card ── */}
        <div className="row-stats-hero">

          <StatCard
            label="جلسات اليوم"
            value={isLoaded ? todaySessionCount : '…'}
            icon="eye"
            note={todaySessionCount > 0 ? 'تحديث كل 10 ث' : 'لا جلسات اليوم'}
            col="green"
          />

          <StatCard
            label="تنبيهات اليوم"
            value={isLoaded ? todaySosCount : '…'}
            danger={todaySosCount > 0}
            icon="bell"
            note={todaySosCount > 0 ? 'يوجد حرج' : 'لا تنبيهات'}
          />

          <StatCard
            label="آخر وضع"
            value={isLoaded ? (lastMode || '—') : '…'}
            icon="mode"
            note={lastSessionTimeStr || 'لا جلسات'}
            col="indigo"
          />

          <StatCard
            label="آخر ظهور"
            value={isLoaded ? lastSeenStr : '…'}
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
                <span style={{
                  fontSize: 10, color: 'var(--g)', padding: '2px 9px', borderRadius: 10,
                  background: 'var(--gb)', border: '1px solid var(--gbr)',
                }}>
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
              <span>الموقع الحالي</span>
            </div>
          </div>

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
              {isLoaded && activities.length === 0
                ? (
                  <div style={{ padding: '32px 20px', color: 'var(--muted)', textAlign: 'center', fontSize: 13 }}>
                    <div style={{ fontSize: 28, marginBottom: 10, opacity: .4 }}>📭</div>
                    لا توجد نشاطات مسجلة بعد
                  </div>
                )
                : <ActivityList activities={activities} now={now} />
              }
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
