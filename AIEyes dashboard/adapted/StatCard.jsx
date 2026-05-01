'use client'

const ICON_SVG = {
  eye: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/></svg>,
  bell: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  mode: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
}

const COL_MAP = {
  green:  { color: 'var(--g)',      shadow: 'rgba(0,217,126,.55)' },
  red:    { color: 'var(--danger)', shadow: 'rgba(239,68,68,.55)' },
  blue:   { color: 'var(--blu)',    shadow: 'rgba(14,165,233,.55)' },
  amber:  { color: 'var(--amb)',    shadow: 'rgba(245,158,11,.55)' },
  indigo: { color: 'var(--ind)',    shadow: 'rgba(99,102,241,.55)' },
  muted:  { color: 'var(--muted)', shadow: 'transparent' },
}

export default function StatCard({ label, value, danger = false, icon = 'eye', note, col }) {
  const resolvedCol = danger ? 'red' : (col || 'green')
  const { color, shadow } = COL_MAP[resolvedCol] || COL_MAP.green

  return (
    <div className="stat-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ color, opacity: .75, display: 'flex' }}>
          {ICON_SVG[icon] || ICON_SVG.eye}
        </div>
        {note && <span className="stat-note">{note}</span>}
      </div>
      <div
        className="stat-value"
        style={{
          color,
          filter: `drop-shadow(0 0 14px ${shadow})`,
          fontFamily: 'Space Grotesk, sans-serif',
        }}
      >
        {value ?? '—'}
      </div>
      <div className="stat-title" style={{ marginTop: 4, textTransform: 'none', fontSize: 11.5, color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  )
}
