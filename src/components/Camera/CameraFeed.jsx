import { useState, useRef, useEffect, useCallback } from 'react'

const STREAMS = [
  { id: 'normal', label: 'Normal' },
  { id: 'edges', label: 'Edge Filter' },
]

function renderEdges(img, outCanvas, zoom) {
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
  const scale = zoom ? 1 : 2
  outCanvas.width = w * scale
  outCanvas.height = h * scale
  octx.imageSmoothingEnabled = true
  octx.imageSmoothingQuality = 'high'
  octx.drawImage(temp, 0, 0, w, h, 0, 0, w * scale, h * scale)
}

export default function CameraFeed({ apiBase, ts }) {
  const [mode, setMode] = useState('normal')
  const [zoom, setZoom] = useState(false)
  const imgRef = useRef(null)
  const edgeCanvasRef = useRef(null)

  const frame = `${apiBase}/udp/camera/latest?ts=${ts}`
  const isEdges = mode === 'edges'

  const cycle = useCallback(() => {
    setMode((m) => (m === 'normal' ? 'edges' : 'normal'))
  }, [])

  useEffect(() => {
    const img = imgRef.current
    if (isEdges && img && img.naturalWidth) {
      renderEdges(img, edgeCanvasRef.current, zoom)
    }
  }, [isEdges, ts, zoom])

  const handleImgLoad = useCallback(() => {
    const img = imgRef.current
    if (!img || !img.naturalWidth) return
    if (isEdges) renderEdges(img, edgeCanvasRef.current, zoom)
  }, [isEdges, zoom])

  const current = STREAMS.find((s) => s.id === mode)

  return (
    <div className="mt-5 text-center">
      <div className="flex items-center justify-center gap-3 mb-2">
        <button
          onClick={cycle}
          title="Previous stream"
          className="px-3 py-1.5 text-sm font-bold rounded-lg border border-border text-text hover:bg-gray-100 transition-colors"
        >
          ◀
        </button>
        <span className="text-xs font-semibold text-text-muted">
          Stream {current.id === 'normal' ? 1 : 2} · {current.label}
        </span>
        <button
          onClick={cycle}
          title="Next stream"
          className="px-3 py-1.5 text-sm font-bold rounded-lg border border-border text-text hover:bg-gray-100 transition-colors"
        >
          ▶
        </button>
        <button
          onClick={() => setZoom((z) => !z)}
          title="Toggle 1:1 / Fit"
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
            ${zoom ? 'bg-accent text-white border-accent' : 'border-border text-text hover:bg-gray-100'}`}
        >
          {zoom ? '1:1' : 'Fit'}
        </button>
      </div>

      <div className="inline-block max-w-full bg-black border border-border rounded-lg overflow-hidden">
        <img
          ref={imgRef}
          src={frame}
          alt="Camera Feed"
          crossOrigin="anonymous"
          onLoad={handleImgLoad}
          onError={(e) => { e.target.style.display = 'none' }}
          onLoadStart={(e) => { e.target.style.display = 'block' }}
          className={`${isEdges ? 'hidden' : ''} ${zoom ? 'max-w-none' : 'max-w-full'}`}
          style={zoom ? { width: 'auto', height: 'auto', imageRendering: 'pixelated' } : { width: '100%', imageRendering: 'auto' }}
        />
        <canvas
          ref={edgeCanvasRef}
          className={`${isEdges ? '' : 'hidden'} ${zoom ? 'max-w-none' : 'max-w-full'}`}
          style={zoom ? { imageRendering: 'pixelated' } : { width: '100%', imageRendering: 'auto' }}
        />
      </div>
    </div>
  )
}
