'use client'
import { useState } from 'react'

const NAV = [
  { key: 'dashboard', label: 'لوحة التحكم', badge: null },
  { key: 'alerts',    label: 'التنبيهات',   badge: null },
  { key: 'sessions',  label: 'الجلسات',     badge: null },
  { key: 'settings',  label: 'الإعدادات',   badge: null },
]

export default function Sidebar({ active, onChange, isConnected }) {
  const [hover, setHover] = useState(null)

  return (
    <aside className="sidebar" aria-label="القائمة الجانبية">

      {/* Logo */}
      <div className="sidebar-logo">
        <div className="brand">
          <div className="brand-badge">👁</div>
          <div>
            <div className="brand-title">AIEyes</div>
            <div className="brand-sub">FAMILY SAFETY</div>
          </div>
        </div>
      </div>

      {/* Monitored member */}
      <div className="sidebar-member">
        <div style={{ fontSize: 9.5, color: 'var(--muted)', letterSpacing: '.1em', fontFamily: 'Space Grotesk', marginBottom: 8 }}>
          MONITORED
        </div>
        <div className="member-card">
          <div className="member-avatar">
            ن
            <div className={`member-online-dot ${isConnected ? '' : 'offline'}`}
              style={{ background: isConnected ? 'var(--g)' : 'var(--muted)' }}/>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>نور الدين</div>
            <div style={{ fontSize: 11, color: isConnected ? 'var(--g)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
              {isConnected
                ? <><span style={{ animation: 'blink 1.8s infinite', fontSize: 7 }}>●</span>مباشر الآن</>
                : 'غير متصل'}
            </div>
          </div>
          <span style={{ color: 'var(--muted)', fontSize: 11 }}>▾</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Navigation">
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            onMouseEnter={() => setHover(item.key)}
            onMouseLeave={() => setHover(null)}
            className={`nav-item ${active === item.key ? 'active' : ''}`}
          >
            {item.label}
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Connection status */}
      <div className="sidebar-footer">
        <div className="conn-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isConnected ? 'var(--g)' : 'var(--danger)',
                boxShadow: isConnected ? '0 0 8px var(--g)' : '0 0 8px var(--danger)',
                animation: 'blink 2s infinite',
              }}/>
              <span style={{ fontSize: 12, fontWeight: 700, color: isConnected ? 'var(--g)' : 'var(--danger)' }}>
                {isConnected ? 'متصل' : 'غير متصل'}
              </span>
            </div>
            {/* signal bars */}
            <div className="signal-bars">
              {[1,2,3,4].map(i => (
                <div key={i} className="signal-bar" style={{
                  height: `${22 + i * 17}%`,
                  background: isConnected && i <= 3 ? 'var(--g)' : 'rgba(255,255,255,.12)',
                  boxShadow: isConnected && i <= 3 ? '0 0 5px rgba(0,217,126,.5)' : undefined,
                }}/>
              ))}
            </div>
          </div>
          <div className="conn-grid">
            {[['GPS', '±5م'], ['4G', 'نشط'], ['Wi-Fi', 'متصل'], ['بطارية', '73%']].map(([k, v]) => (
              <div key={k} className="conn-item">
                <span style={{ color: 'var(--text)', fontFamily: 'Space Grotesk', marginLeft: 3 }}>{k}</span>{v}
              </div>
            ))}
          </div>
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(80,20,140,.1))',
            border: '1px solid rgba(168,85,247,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--pur)',
          }}>ع</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>ولي الأمر</div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>مدير الحساب</div>
          </div>
          <div style={{ marginRight: 'auto', width: 7, height: 7, borderRadius: '50%',
            background: isConnected ? 'var(--g)' : 'var(--muted)',
            boxShadow: isConnected ? '0 0 6px var(--g)' : undefined }}/>
        </div>
      </div>
    </aside>
  )
}
