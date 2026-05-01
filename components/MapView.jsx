'use client'

import { useMemo, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER = [36.8065, 10.1815]
const DEFAULT_ZOOM   = 13

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({ iconUrl: '', iconRetinaUrl: '', shadowUrl: '' })

function makeLocationIcon() {
  return L.divIcon({
    html: `
      <div class="location-marker-wrap">
        <div class="location-marker-ring"></div>
        <div class="location-marker-ring-2"></div>
        <div class="location-marker-inner"></div>
      </div>`,
    className: '',
    iconSize:   [40, 40],
    iconAnchor: [20, 20],
  })
}

function makeSosIcon() {
  return L.divIcon({
    html: `<div class="sos-marker"></div>`,
    className: '',
    iconSize:   [10, 10],
    iconAnchor: [5, 5],
  })
}

function Recenterer({ center }) {
  const map = useMap()
  const prev = useRef(null)
  const key = center?.join(',')
  if (key && key !== prev.current) {
    prev.current = key
    map.setView(center, map.getZoom(), { animate: true, duration: 0.6 })
  }
  return null
}

export default function MapView({ currentLocation, sosAlerts }) {
  const locationIcon = useMemo(makeLocationIcon, [])
  const sosIcon      = useMemo(makeSosIcon, [])

  const currentCenter = currentLocation
    ? [currentLocation.latitude, currentLocation.longitude]
    : null

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      style={{ width: '100%', height: '100%' }}
      zoomControl
      attributionControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution="&copy; CartoDB"
        maxZoom={19}
      />

      {currentCenter && (
        <>
          <Marker position={currentCenter} icon={locationIcon} />
          <Recenterer center={currentCenter} />
        </>
      )}

      {(sosAlerts || []).map(alert =>
        alert.latitude && alert.longitude ? (
          <Marker
            key={alert.id}
            position={[alert.latitude, alert.longitude]}
            icon={sosIcon}
          />
        ) : null
      )}
    </MapContainer>
  )
}
