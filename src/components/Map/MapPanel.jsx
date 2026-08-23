import { useState, useRef, useEffect } from 'react'

const STEP = 1
const TURN = 45

export default function MapPanel({ lastCmd }) {
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
    <div className="flex-1 min-w-0 bg-white border border-border rounded-xl overflow-hidden flex flex-col">
      <div className="px-3 py-2.5 border-b border-border flex items-center justify-between gap-2 shrink-0">
        <span className="text-sm font-semibold">Map</span>
        <div className="flex items-center gap-1.5">
          {!running ? (
            <button
              onClick={startRun}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-accent text-white hover:bg-accent-hover transition-colors"
            >
              Start Running
            </button>
          ) : (
            <button
              onClick={() => setRunning(false)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md bg-error text-white hover:opacity-90 transition-opacity"
            >
              Stop
            </button>
          )}
          <button
            onClick={reset}
            title="Clear map"
            className="px-2 py-1.5 text-xs font-semibold rounded-md border border-border text-text-muted hover:bg-gray-50 transition-colors"
          >
            Clear
          </button>
        </div>
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
    </div>
  )
}
