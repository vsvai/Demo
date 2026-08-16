import { useState, useRef, useEffect, useCallback } from 'react'

const MAX_ZOOM = 4
const MIN_ZOOM = 1
const ZOOM_STEP = 0.25

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

export default function CameraFeed({ apiBase, ts }) {
  const [filterId, setFilterId] = useState('normal')
  const [zoom, setZoom] = useState(1)
  const [imgError, setImgError] = useState(false)
  const imgRef = useRef(null)
  const edgeCanvasRef = useRef(null)

  const frame = `${apiBase}/udp/camera/latest?ts=${ts}`
  const filter = FILTERS.find((f) => f.id === filterId)
  const isEdges = filter?.canvas

  const incZoom = () => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100))
  const decZoom = () => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100))

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
    transform: `scale(${zoom})`,
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

      <div className="flex-1 min-h-0 w-full bg-black border border-border rounded-lg overflow-hidden flex items-center justify-center">
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
      </div>
    </div>
  )
}
