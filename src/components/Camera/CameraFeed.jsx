import { useState, useRef, useEffect, useCallback } from 'react'

const MAX_ZOOM = 4
const MIN_ZOOM = 1
const ZOOM_STEP = 0.25

const LINE_MOVES = {
  forward: { transform: 'translateY(7%) scale(1.15)' },
  backward: { transform: 'translateY(-6%) scale(0.88)' },
  left: { transform: 'translateX(8%)' },
  right: { transform: 'translateX(-8%)' },
}

const FILTERS = [
  { id: 'normal', label: 'Normal', css: 'none' },
  { id: 'edges', label: 'Edge', canvas: true },
  { id: 'grayscale', label: 'Grayscale', css: 'grayscale(1)' },
  { id: 'contrast', label: 'High Contrast', css: 'contrast(1.5) saturate(1.3)' },
  { id: 'bwcontrast', label: 'Mono + Contrast', css: 'grayscale(1) contrast(1.55)' },
  { id: 'enhanced', label: 'Enhanced', css: 'brightness(1.12) contrast(1.28) saturate(1.35)' },
  { id: 'sepia', label: 'Sepia', css: 'sepia(0.8)' },
  { id: 'invert', label: 'Invert', css: 'invert(1)' },
]

function renderEdges(img, outCanvas) {
  const w = img.naturalWidth || img.width
  const h = img.naturalHeight || img.height
  if (!w || !h) return

  const src = document.createElement('canvas')
  src.width = w
  src.height = h
  const sctx = src.getContext('2d', { willReadFrequently: true })
  sctx.drawImage(img, 0, 0)
  const data = sctx.getImageData(0, 0, w, h).data

  const gray = new Float32Array(w * h)
  for (let i = 0; i < w * h; i++) {
    gray[i] = data[i * 4] * 0.299 + data[i * 4 + 1] * 0.587 + data[i * 4 + 2] * 0.114
  }

  const temp = document.createElement('canvas')
  temp.width = w
  temp.height = h
  const tctx = temp.getContext('2d')
  const out = tctx.createImageData(w, h)
  const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1]
  const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1]

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sx = 0
      let sy = 0
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const v = gray[(y + ky) * w + (x + kx)]
          const k = (ky + 1) * 3 + (kx + 1)
          sx += v * gx[k]
          sy += v * gy[k]
        }
      }
      const m = Math.min(255, Math.hypot(sx, sy))
      const i = (y * w + x) * 4
      const v = m > 28 ? 255 : 0
      out.data[i] = v
      out.data[i + 1] = v
      out.data[i + 2] = v
      out.data[i + 3] = 255
    }
  }
  tctx.putImageData(out, 0, 0)

  const octx = outCanvas.getContext('2d')
  outCanvas.width = w
  outCanvas.height = h
  octx.imageSmoothingEnabled = true
  octx.drawImage(temp, 0, 0)
}

export default function CameraFeed({ apiBase, ts, lastCmd }) {
  const [filterId, setFilterId] = useState('normal')
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [showLines, setShowLines] = useState(false)
  const [lineShift, setLineShift] = useState('none')
  const [imgError, setImgError] = useState(false)
  const imgRef = useRef(null)
  const edgeCanvasRef = useRef(null)
  const lineShiftTimerRef = useRef(null)

  useEffect(() => {
    if (!lastCmd) return
    const move = LINE_MOVES[lastCmd.cmd]
    if (!move || !showLines) return
    setLineShift(move.transform)
    clearTimeout(lineShiftTimerRef.current)
    lineShiftTimerRef.current = setTimeout(() => setLineShift('none'), 380)
    return () => clearTimeout(lineShiftTimerRef.current)
  }, [lastCmd, showLines])

  const frame = `${apiBase}/udp/camera/latest?ts=${ts}`
  const filter = FILTERS.find((f) => f.id === filterId)
  const isEdges = filter?.canvas

  const incZoom = () => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100))
  const decZoom = () => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100))
  const rotate = () => setRotation((r) => (r + 90) % 360)

  const handleImgLoad = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    setImgError(false)
    if (isEdges) renderEdges(img, edgeCanvasRef.current)
  }, [isEdges])

  useEffect(() => {
    const img = imgRef.current
    if (isEdges && img && img.naturalWidth) {
      renderEdges(img, edgeCanvasRef.current)
    }
  }, [isEdges, ts])

  const viewStyle = {
    transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
    transformOrigin: 'center center',
  }

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={decZoom}
            disabled={zoom <= MIN_ZOOM}
            title="Zoom out"
            className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-md border border-border bg-white text-text hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className="w-14 text-center text-xs font-bold font-mono text-text-muted">{zoom.toFixed(2)}×</span>
          <button
            onClick={incZoom}
            disabled={zoom >= MAX_ZOOM}
            title="Zoom in"
            className="w-8 h-8 flex items-center justify-center text-lg font-bold rounded-md border border-border bg-white text-text hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            +
          </button>
          <button
            onClick={() => setZoom(1)}
            disabled={zoom === 1}
            title="Reset zoom"
            className="px-2.5 h-8 text-xs font-semibold rounded-md border border-border bg-white text-text-muted hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={rotate}
            title={`Rotate ${rotation}°`}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-white text-text-muted hover:bg-gray-50 transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M21.5 2v6h-6" />
              <path d="M21.34 13.72A10 10 0 1 1 18.57 4.34L21.5 2" />
            </svg>
          </button>
          <span className="text-xs font-mono font-bold text-text-muted w-8 text-center">{rotation}°</span>
          <button
            onClick={() => setFlipH((f) => !f)}
            title="Flip horizontal"
            className={`w-8 h-8 flex items-center justify-center rounded-md border border-border ${flipH ? 'bg-accent text-white' : 'bg-white text-text-muted hover:bg-gray-50'} transition-colors`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3" />
              <path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3" />
              <line x1="12" y1="20" x2="12" y2="4" />
            </svg>
          </button>
          <button
            onClick={() => setFlipV((f) => !f)}
            title="Flip vertical"
            className={`w-8 h-8 flex items-center justify-center rounded-md border border-border ${flipV ? 'bg-accent text-white' : 'bg-white text-text-muted hover:bg-gray-50'} transition-colors`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3" />
              <path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3" />
              <line x1="4" y1="12" x2="20" y2="12" />
            </svg>
          </button>
          <button
            onClick={() => setShowLines((s) => !s)}
            title="Parking lines"
            className={`w-8 h-8 flex items-center justify-center rounded-md border border-border ${showLines ? 'bg-accent text-white' : 'bg-white text-text-muted hover:bg-gray-50'} transition-colors`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 21L9 10h6l3 11z" />
              <line x1="7.5" y1="16" x2="16.5" y2="16" strokeDasharray="2 2" />
              <line x1="12" y1="10" x2="12" y2="21" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-text-muted">Filter</span>
          <select
            value={filterId}
            onChange={(e) => setFilterId(e.target.value)}
            className="px-2.5 h-8 text-xs font-semibold rounded-md border border-border bg-white text-text cursor-pointer"
          >
            {FILTERS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 w-full bg-black border border-border rounded-lg overflow-hidden flex items-center justify-center">
        {imgError && (
          <span className="text-xs font-semibold text-gray-400">No signal</span>
        )}
        <img
          ref={imgRef}
          src={frame}
          alt="Camera Feed"
          crossOrigin="anonymous"
          onLoad={handleImgLoad}
          onError={() => setImgError(true)}
          onLoadStart={() => setImgError(false)}
          className={`${isEdges ? 'hidden' : ''} w-full h-full object-contain`}
          style={{
            ...viewStyle,
            filter: isEdges ? 'none' : filter?.css,
            imageRendering: zoom > 1 ? 'pixelated' : 'auto',
          }}
        />
        <canvas
          ref={edgeCanvasRef}
          className={`${isEdges ? 'block' : 'hidden'} w-full h-full object-contain`}
          style={{
            ...viewStyle,
            imageRendering: zoom > 1 ? 'pixelated' : 'auto',
          }}
        />
        {showLines && (
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            <g
              style={{
                transform: lineShift,
                transformOrigin: '50% 100%',
                transition: lineShift === 'none' ? 'transform 450ms ease-out' : 'transform 120ms ease-out',
              }}
            >
              <line x1="15" y1="98" x2="35" y2="30" stroke="white" strokeWidth="1.4" opacity="0.9" vectorEffect="non-scaling-stroke" />
              <line x1="85" y1="98" x2="65" y2="30" stroke="white" strokeWidth="1.4" opacity="0.9" vectorEffect="non-scaling-stroke" />
              <line x1="20.3" y1="80" x2="79.7" y2="80" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 2.5" opacity="0.95" vectorEffect="non-scaling-stroke" />
              <line x1="26.2" y1="60" x2="73.8" y2="60" stroke="#eab308" strokeWidth="1" strokeDasharray="4 2.5" opacity="0.95" vectorEffect="non-scaling-stroke" />
              <line x1="31.5" y1="42" x2="68.5" y2="42" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 2.5" opacity="0.95" vectorEffect="non-scaling-stroke" />
            </g>
          </svg>
        )}
      </div>
    </div>
  )
}
