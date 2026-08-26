import { useState, useRef, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { FIX_QUALITY } from '../../api'

const STEP = 1
const TURN = 45

function MaximizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
  )
}

function MinimizeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
    </svg>
  )
}

function DeadReckoningMap({ lastCmd }) {
  const [running, setRunning] = useState(false)
  const [path, setPath] = useState([{ x: 0, y: 0 }])
  const [heading, setHeading] = useState(0)
  const headingRef = useRef(0)
  const lastTsRef = useRef(0)

  useEffect(() => {
    if (!lastCmd) return
    const isNew = lastCmd.ts !== lastTsRef.current
    lastTsRef.current = lastCmd.ts
    if (!isNew || !running) return
    const cmd = lastCmd.cmd
    if (cmd === 'left' || cmd === 'right') {
      headingRef.current += cmd === 'left' ? -TURN : TURN
      setHeading(headingRef.current)
      return
    }
    if (cmd !== 'forward' && cmd !== 'backward') return
    setPath((prev) => {
      const cur = prev[prev.length - 1]
      const rad = (headingRef.current * Math.PI) / 180
      const dir = cmd === 'forward' ? 1 : -1
      return [...prev, { x: cur.x + Math.sin(rad) * STEP * dir, y: cur.y - Math.cos(rad) * STEP * dir }]
    })
  }, [lastCmd, running])

  const startRun = () => {
    setPath([{ x: 0, y: 0 }])
    headingRef.current = 0
    setHeading(0)
    setRunning(true)
  }

  const reset = () => {
    setRunning(false)
    setPath([{ x: 0, y: 0 }])
    headingRef.current = 0
    setHeading(0)
  }

  const xs = path.map((p) => p.x)
  const ys = path.map((p) => p.y)
  const pad = 1.2
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad

  const cur = path[path.length - 1]
  const rad = (heading * Math.PI) / 180
  const tipX = cur.x + Math.sin(rad) * 0.55
  const tipY = cur.y - Math.cos(rad) * 0.55
  const points = path.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <>
      <div className="flex items-center gap-1.5">
        {!running ? (
          <button onClick={startRun} className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-accent text-white hover:bg-accent-hover transition-colors">
            Start Running
          </button>
        ) : (
          <button onClick={() => setRunning(false)} className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-error text-white hover:opacity-90 transition-opacity">
            Stop
          </button>
        )}
        <button onClick={reset} title="Clear map" className="px-2 py-1.5 text-xs font-semibold rounded-md border border-border text-text-muted hover:bg-gray-50 transition-colors">
          Clear
        </button>
      </div>
      <div className="relative flex-1 min-h-0">
        <svg viewBox={`${minX} ${minY} ${maxX - minX} ${maxY - minY}`} preserveAspectRatio="xMidYMid meet" className="w-full h-full">
          <defs>
            <pattern id="mapgrid" width="1" height="1" patternUnits="userSpaceOnUse">
              <path d="M 1 0 L 0 0 0 1" fill="none" stroke="#eef0f3" strokeWidth="0.02" />
            </pattern>
          </defs>
          <rect x={minX} y={minY} width={maxX - minX} height={maxY - minY} fill="url(#mapgrid)" />
          {path.length > 1 && (
            <polyline points={points} fill="none" stroke="#2563eb" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity="0.85" />
          )}
          <circle cx={path[0].x} cy={path[0].y} r="0.18" fill="#22c55e" stroke="#16a34a" strokeWidth="0.04" vectorEffect="non-scaling-stroke" />
          <line x1={cur.x} y1={cur.y} x2={tipX} y2={tipY} stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          <circle cx={cur.x} cy={cur.y} r="0.15" fill="#dc2626" />
        </svg>
        {!running && path.length === 1 && (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-text-muted pointer-events-none">
            Press Start Running, then drive with WASD
          </span>
        )}
      </div>
      <div className="px-3 py-2 border-t border-border shrink-0 flex items-center justify-between text-[11px] font-mono font-bold text-text-muted">
        <span>POS {cur.x.toFixed(1)}, {(-cur.y).toFixed(1)}</span>
        <span className={running ? 'text-accent' : ''}>{running ? 'RECORDING' : 'IDLE'}</span>
        <span>HDG {((heading % 360) + 360) % 360}°</span>
      </div>
    </>
  )
}

function GpsTrackMap({ gpsPositions }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const layerRef = useRef(null)
  const initRef = useRef(false)
  const fittedRef = useRef(false)

  useEffect(() => {
    if (!mapRef.current || initRef.current) return
    initRef.current = true
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      center: [28.7937, 77.5058],
      zoom: 17,
    })

    let esriFailed = false

    const satellite = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
      maxZoom: 20,
      attribution: 'Google Satellite',
    })

    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap',
    })

    satellite.on('tileerror', () => {
      if (esriFailed) return
      esriFailed = true
      map.removeLayer(satellite)
      osm.addTo(map)
    })

    satellite.addTo(map)

    mapInstanceRef.current = map
    layerRef.current = L.layerGroup().addTo(map)

    const resize = () => map.invalidateSize()
    window.addEventListener('resize', resize)
    setTimeout(() => map.invalidateSize(), 500)
    setTimeout(() => map.invalidateSize(), 1500)

    map._resizeHandler = () => {
      window.removeEventListener('resize', resize)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        window.removeEventListener('resize', mapInstanceRef.current._resizeHandler || (() => {}))
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        initRef.current = false
        fittedRef.current = false
      }
    }
  }, [])

  useEffect(() => {
    const map = mapInstanceRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()
    if (!gpsPositions.length) return

    const coords = []
    gpsPositions.forEach((pos, i) => {
      const latlng = [pos.lat, pos.lon]
      coords.push(latlng)
      const fixInfo = FIX_QUALITY[pos.fix] || { label: 'UNKNOWN', color: '#9ca3af' }
      const isLast = i === gpsPositions.length - 1
      const marker = L.circleMarker(latlng, {
        radius: isLast ? 9 : 5,
        fillColor: fixInfo.color,
        color: isLast ? '#000' : '#fff',
        weight: isLast ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.9,
      })
      marker.bindPopup(
        `<div style="font-family:monospace;font-size:12px;line-height:1.6">` +
        `<b>${fixInfo.label}</b><br>` +
        `Lat: ${pos.lat.toFixed(7)}<br>` +
        `Lon: ${pos.lon.toFixed(7)}<br>` +
        `Alt: ${pos.alt?.toFixed(1) ?? '--'} m<br>` +
        `Sat: ${pos.sat ?? '--'}<br>` +
        `HDOP: ${pos.hdop?.toFixed(2) ?? '--'}` +
        `</div>`
      )
      layer.addLayer(marker)
    })

    if (coords.length > 1) {
      layer.addLayer(L.polyline(coords, { color: '#2563eb', weight: 3, opacity: 0.85 }))
    }

    const last = coords[coords.length - 1]
    if (last) {
      const pulse = L.circleMarker(last, { radius: 14, fillColor: FIX_QUALITY[gpsPositions[gpsPositions.length - 1]?.fix]?.color || '#9ca3af', color: '#000', weight: 2, opacity: 0.5, fillOpacity: 0.2 })
      layer.addLayer(pulse)
    }

    // Only center on first point ever, never zoom after
    if (!fittedRef.current) {
      map.setView(last, 17)
      fittedRef.current = true
    }
  }, [gpsPositions])

  const lastPos = gpsPositions.length > 0 ? gpsPositions[gpsPositions.length - 1] : null

  return (
    <div className="flex-1 min-h-0 flex flex-col relative">
      {lastPos && (
        <div className="px-3 py-1.5 flex items-center justify-between text-[10px] font-mono text-text-muted shrink-0">
          <span>{gpsPositions.length} pts · {FIX_QUALITY[lastPos.fix]?.label || 'UNKNOWN'}</span>
          <span className="text-accent font-bold">LIVE</span>
        </div>
      )}
      <div ref={mapRef} className="w-full" style={{ height: '100%', minHeight: '300px' }} />
      <div className="px-3 py-2 border-t border-border shrink-0 flex items-center justify-between text-[11px] font-mono font-bold text-text-muted">
        {lastPos ? (
          <>
            <span>{lastPos.lat.toFixed(6)}, {lastPos.lon.toFixed(6)}</span>
            <span className="text-accent">{gpsPositions.length} PTS</span>
            <span>SAT {lastPos.sat ?? '--'} HDOP {lastPos.hdop?.toFixed(1) ?? '--'}</span>
          </>
        ) : (
          <span className="flex-1 text-center">Waiting for GPS…</span>
        )}
      </div>
    </div>
  )
}

export default function MapPanel({ lastCmd, gpsPositions = [], expanded, onToggleExpand, onClear, mapSize, onMapSizeChange }) {
  const [tab, setTab] = useState('gps')

  return (
    <div className={`flex-1 min-w-0 bg-white border border-border rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${expanded ? 'h-full' : ''}`}>
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm font-semibold">Map</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setTab('dr')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${tab === 'dr' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              Dead Reckoning
            </button>
            <button
              onClick={() => setTab('gps')}
              className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${tab === 'gps' ? 'bg-white text-text shadow-sm' : 'text-text-muted hover:text-text'}`}
            >
              GPS Track
            </button>
          </div>
          {onClear && tab === 'gps' && gpsPositions.length > 0 && (
            <button
              onClick={onClear}
              title="Clear GPS track"
              className="px-2 py-1 text-[11px] font-semibold rounded-md border border-error/30 text-error hover:bg-error-light transition-colors"
            >
              Clear
            </button>
          )}
          {onMapSizeChange && expanded && (
            <select
              value={mapSize}
              onChange={(e) => onMapSizeChange(Number(e.target.value))}
              className="px-1.5 py-0.5 text-[11px] font-semibold border border-border rounded bg-white"
            >
              <option value={30}>30%</option>
              <option value={50}>50%</option>
              <option value={70}>70%</option>
            </select>
          )}
          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              title={expanded ? 'Shrink map' : 'Expand map'}
              className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
            >
              {expanded ? <MinimizeIcon /> : <MaximizeIcon />}
            </button>
          )}
        </div>
      </div>
      <div className="relative flex-1 min-h-0 flex flex-col">
        {tab === 'dr' ? (
          <DeadReckoningMap lastCmd={lastCmd} />
        ) : (
          <GpsTrackMap gpsPositions={gpsPositions} />
        )}
      </div>
    </div>
  )
}
