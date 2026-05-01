'use client'
import dynamic from 'next/dynamic'
const MapView = dynamic(() => import('./MapView'), { ssr: false })

function MapOverlay({ location }) {
  const openMaps = () => {
    if (!location) return
    window.open(
      `https://www.google.com/maps?q=${location.latitude},${location.longitude}`,
      '_blank', 'noopener,noreferrer'
    )
  }

  return (
    <div className="map-overlay">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>الموقع الحالي</div>
        <div style={{ fontSize: 11, color: location ? 'var(--g)' : 'var(--muted)',
          display: 'flex', alignItems: 'center', gap: 4 }}>
          {location && <span style={{ animation: 'blink 1.8s infinite', fontSize: 7 }}>●</span>}
          {location ? 'مباشر' : 'غير متاح'}
        </div>
      </div>

      {location && (
        <div style={{ marginTop: 8, fontFamily: 'monospace', color: 'var(--muted)', fontSize: 12 }}>
          {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}
        </div>
      )}

      <button className="map-open-btn" onClick={openMaps}>
        فتح في Google Maps ↗
      </button>
    </div>
  )
}

export default function MapPanel({ latestLocation, sosAlerts }) {
  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 260 }}>
      <MapView currentLocation={latestLocation} sosAlerts={sosAlerts} />
      <MapOverlay location={latestLocation} />
    </div>
  )
}
