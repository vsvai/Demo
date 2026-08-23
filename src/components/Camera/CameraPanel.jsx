import CameraFeed from './CameraFeed'

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

export default function CameraPanel({ apiBase, ts, deviceName, onClose, size, onSizeChange, lastCmd }) {
  return (
    <div
      className="flex-1 min-w-0 bg-white border border-border rounded-xl p-3 flex flex-col"
      style={{ height: `${size}vh` }}
    >
      <div className="flex items-center justify-between gap-2 mb-2.5 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 text-sm font-semibold min-w-0">
          <span className="text-accent shrink-0"><CameraIcon /></span>
          <span className="shrink-0">Live Camera</span>
          <span className="text-xs font-mono text-text-muted truncate">{deviceName}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-text-muted">Size</span>
          <input
            type="range"
            min="20"
            max="100"
            step="5"
            value={size}
            onChange={(e) => onSizeChange(Number(e.target.value))}
            title="Camera height (20% – 100% of screen)"
            className="w-28 accent-accent cursor-pointer"
          />
          <span className="text-xs font-mono font-bold text-text w-11 text-right">{size}%</span>
          <button
            onClick={onClose}
            title="Close camera"
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-gray-100 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col">
        <CameraFeed apiBase={apiBase} ts={ts} lastCmd={lastCmd} />
      </div>
    </div>
  )
}
