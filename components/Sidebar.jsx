'use client'

const NAV = [
  { key: 'dashboard', label: 'لوحة التحكم', comingSoon: false },
  { key: 'alerts',    label: 'التنبيهات',   comingSoon: true  },
  { key: 'sessions',  label: 'الجلسات',     comingSoon: true  },
  { key: 'settings',  label: 'الإعدادات',   comingSoon: true  },
]

function userLabel(u, fallback = '—') {
  if (!u) return fallback
  return u.display_name || u.email?.split('@')[0] || u.email || fallback
}

function userInitial(u, fallback = '?') {
  const label = userLabel(u, fallback)
  return label.charAt(0).toUpperCase()
}

export default function Sidebar({
  active,
  onChange,
  isConnected,
  monitoredUser,
  parentProfile,
  linkedUsers = [],
  selectedLink,
  onLogout,
  onChangeUser,
  onUnlink,
}) {
  const memberName    = userLabel(monitoredUser, 'غير محدد')
  const memberInitial = userInitial(monitoredUser, '؟')
  const parentName    = userLabel(parentProfile, 'ولي الأمر')
  const parentInitial = userInitial(parentProfile, 'ع')

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
        <div className="member-card" onClick={linkedUsers.length > 1 ? onChangeUser : undefined}
          style={{ cursor: linkedUsers.length > 1 ? 'pointer' : 'default' }}>
          <div className="member-avatar">
            {memberInitial}
            <div
              className={`member-online-dot ${isConnected ? '' : 'offline'}`}
              style={{ background: isConnected ? 'var(--g)' : 'var(--muted)' }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {memberName}
            </div>
            {monitoredUser?.email && (
              <div style={{ fontSize: 9.5, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Space Grotesk' }}>
                {monitoredUser.email}
              </div>
            )}
            <div style={{ fontSize: 11, color: isConnected ? 'var(--g)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5, marginTop: 1 }}>
              {isConnected
                ? <><span style={{ animation: 'blink 1.8s infinite', fontSize: 7 }}>●</span>مباشر الآن</>
                : 'غير متصل'}
            </div>
          </div>
          {linkedUsers.length > 1 && (
            <span style={{ color: 'var(--muted)', fontSize: 11, flexShrink: 0 }}>▾</span>
          )}
        </div>

        {/* User management actions */}
        {(onChangeUser || onUnlink) && (
          <div style={{ display: 'flex', gap: 6, marginTop: 7 }}>
            {onChangeUser && (
              <button
                onClick={onChangeUser}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10,
                  background: 'rgba(99,102,241,.08)', border: '1px solid rgba(99,102,241,.2)',
                  color: 'var(--ind)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 600,
                }}
              >
                تغيير
              </button>
            )}
            {onUnlink && selectedLink && (
              <button
                onClick={onUnlink}
                style={{
                  flex: 1, padding: '5px 0', borderRadius: 8, fontSize: 10,
                  background: 'rgba(239,68,68,.07)', border: '1px solid rgba(239,68,68,.18)',
                  color: 'var(--danger)', cursor: 'pointer', fontFamily: 'Cairo, sans-serif', fontWeight: 600,
                }}
              >
                فصل
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav" aria-label="Navigation">
        {NAV.map(item => (
          <button
            key={item.key}
            onClick={() => !item.comingSoon && onChange(item.key)}
            className={`nav-item ${active === item.key ? 'active' : ''} ${item.comingSoon ? 'nav-item-disabled' : ''}`}
            style={item.comingSoon ? { opacity: 0.4, cursor: 'default', pointerEvents: 'none' } : undefined}
          >
            {item.label}
            {item.comingSoon && (
              <span style={{
                fontSize: 9, fontFamily: 'Space Grotesk', letterSpacing: '.05em',
                padding: '1px 6px', borderRadius: 6, marginRight: 'auto',
                background: 'rgba(255,255,255,.07)', color: 'var(--muted)',
              }}>قريباً</span>
            )}
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

        {/* Parent user + logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,rgba(168,85,247,.3),rgba(80,20,140,.1))',
            border: '1px solid rgba(168,85,247,.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: 'var(--pur)',
          }}>{parentInitial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {parentName}
            </div>
            <div style={{ fontSize: 10, color: 'var(--muted)' }}>مدير الحساب</div>
          </div>
          {onLogout && (
            <button
              onClick={onLogout}
              title="تسجيل الخروج"
              style={{
                width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.18)',
                color: 'var(--danger)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13,
              }}
            >↩</button>
          )}
        </div>
      </div>
    </aside>
  )
}
