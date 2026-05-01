'use client'
import { useState, useEffect } from 'react'

export default function Topbar({ isConnected, sosCount = 0 }) {
  const [time, setTime] = useState(null)

  useEffect(() => {
    setTime(new Date())
    const iv = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(iv)
  }, [])

  const ts = time
    ? time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--'

  return (
    <header className="topbar" dir="rtl">

      {/* Live badge */}
      <div className="live-badge">
        <div className="live-dot"/>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--g)', fontFamily: 'Space Grotesk', letterSpacing: '.07em' }}>
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      <div style={{ width: 1, height: 16, background: 'var(--bd)' }}/>

      {/* Timestamp */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>آخر تحديث</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', fontFamily: 'Space Grotesk', letterSpacing: '.03em' }}>{ts}</span>
      </div>

      {/* SOS button */}
      <div className="sos-btn">
        <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--danger)', animation: 'blink 1s infinite' }}/>
        SOS طوارئ
      </div>

      {/* Alert badge */}
      {sosCount > 0 && (
        <div className="alert-badge">
          <span>⚠</span>
          <span>{sosCount} تنبيه</span>
        </div>
      )}

      {/* Connection pill */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '4px 12px', borderRadius: 20,
        background: isConnected ? 'rgba(0,217,126,.07)' : 'rgba(239,68,68,.07)',
        border: `1px solid ${isConnected ? 'rgba(0,217,126,.25)' : 'rgba(239,68,68,.25)'}`,
        fontSize: 12, fontWeight: 600,
        color: isConnected ? 'var(--g)' : 'var(--danger)',
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: isConnected ? 'var(--g)' : 'var(--danger)',
          animation: 'blink 1.4s step-end infinite',
        }}/>
        {isConnected ? 'مباشر' : 'غير متصل'}
      </div>

      {/* Avatar */}
      <div className="avatar-btn">ع</div>
    </header>
  )
}
