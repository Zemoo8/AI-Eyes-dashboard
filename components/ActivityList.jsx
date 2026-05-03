'use client'

function parseDate(s) {
  if (!s) return null
  if (typeof s === 'string' && !s.endsWith('Z') && !/[+-]\d{2}:?\d{2}$/.test(s)) {
    return new Date(s.replace(' ', 'T') + 'Z')
  }
  return new Date(s)
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

const ICONS = { sos: '⚠', session: '👁', default: '📡' }
const COLS  = { sos: 'var(--danger)', session: 'var(--g)', default: 'var(--amb)' }

export default function ActivityList({ activities = [], now }) {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: 24, color: 'var(--muted)', textAlign: 'center', fontSize: 13 }}>
        لا توجد نشاطات مسجلة
      </div>
    )
  }

  return (
    <div className="activity-list no-scrollbar">
      {activities.map((item, idx) => {
        const isSos     = item.type === 'sos'
        const isSession = item.type === 'session'
        const iconKey   = isSos ? 'sos' : isSession ? 'session' : 'default'
        const col       = COLS[iconKey]
        const icon      = ICONS[iconKey]
        const hasCoords = item.latitude && item.longitude

        return (
          <div key={`${item.type}-${item.id ?? idx}`} className="activity-item">

            {/* icon */}
            <div className="activity-dot">
              <div
                className={`activity-icon ${iconKey}`}
                style={{ color: col }}
              >
                {icon}
              </div>
            </div>

            {/* content */}
            <div className="activity-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                <span className={`activity-label ${iconKey}`}>
                  {item.label || (isSos ? 'تنبيه طوارئ SOS' : 'جلسة جديدة')}
                </span>
                <span className="activity-time">{timeAgo(item.created_at, now)}</span>
              </div>

              {hasCoords && (
                <div className="activity-sublabel">
                  {Number(item.latitude).toFixed(5)}, {Number(item.longitude).toFixed(5)}
                </div>
              )}

              {item.duration && (
                <div className="activity-dur" style={{ color: col }}>
                  مدة: {item.duration}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
