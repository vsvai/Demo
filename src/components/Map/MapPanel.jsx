import { useState, useRef, useEffect, useCallback } from 'react'
import L from 'leaflet'
import { FIX_QUALITY } from '../../api'

const STEP = 1
const TURN = 45

function fixColor(fix) {
  return FIX_QUALITY[fix]?.color || '#9ca3af'
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

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstanceRef.current) return
    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)
    mapInstanceRef.current = map
    layerRef.current = L.layerGroup().addTo(map)
  }, [])

  useEffect(() => {
    initMap()
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [initMap])

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
      const marker = L.circleMarker(latlng, {
        radius: i === gpsPositions.length - 1 ? 8 : 5,
        fillColor: fixInfo.color,
        color: '#fff',
        weight: 2,
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
      const line = L.polyline(coords, { color: '#2563eb', weight: 2, opacity: 0.8 })
      layer.addLayer(line)
    }

    const bounds = L.latLngBounds(coords)
    map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17 })
  }, [gpsPositions])

  const lastPos = gpsPositions.length > 0 ? gpsPositions[gpsPositions.length - 1] : null

  return (
    <>
      <div className="px-2">
        {lastPos && (
          <span className="text-[10px] font-mono text-text-muted">
            {gpsPositions.length} pts · Fix: {FIX_QUALITY[lastPos.fix]?.label || 'UNKNOWN'}
          </span>
        )}
      </div>
      <div ref={mapRef} className="flex-1 min-h-0 w-full" />
      {!gpsPositions.length && (
        <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-text-muted pointer-events-none pt-8">
          No GPS data yet
        </span>
      )}
      <div className="px-3 py-2 border-t border-border shrink-0 flex items-center justify-between text-[11px] font-mono font-bold text-text-muted">
        {lastPos ? (
          <>
            <span>{lastPos.lat.toFixed(6)}, {lastPos.lon.toFixed(6)}</span>
            <span className="text-accent">{gpsPositions.length} PTS</span>
            <span>SAT {lastPos.sat ?? '--'}</span>
          </>
        ) : (
          <span className="flex-1 text-center">Waiting for GPS…</span>
        )}
      </div>
    </>
  )
}

export default function MapPanel({ lastCmd, gpsPositions = [] }) {
  const [tab, setTab] = useState('dr')

  return (
    <div className="flex-1 min-w-0 bg-white border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm font-semibold">Map</span>
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
