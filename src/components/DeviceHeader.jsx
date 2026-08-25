import { useState, useRef, useEffect } from 'react'
import { FIX_QUALITY } from '../api'

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
  )
}

function CameraIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M23 7l-7 5 7 5V7z" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  )
}

export default function DeviceHeader({ name, mac, online, type, cameraOpen, onToggleCamera, onRename, rtkPosition, rtkStatus }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(name)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  useEffect(() => setDraft(name), [name])

  const commit = () => {
    onRename(draft)
    setEditing(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit()
              else if (e.key === 'Escape') setEditing(false)
            }}
            className="font-sans text-lg font-bold bg-white border border-accent rounded-md px-2 py-1 outline-none min-w-0"
          />
        ) : (
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2
                className="text-lg font-bold tracking-tight truncate"
                title="Double-click to rename"
                onDoubleClick={() => { setDraft(name); setEditing(true) }}
              >
                {name}
              </h2>
              <button
                onClick={() => setEditing(true)}
                title="Rename device"
                className="text-text-muted hover:text-accent transition-colors p-1 -m-1"
              >
                <PencilIcon />
              </button>
            </div>
            <div className="text-xs text-text-muted font-mono">{mac}</div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border
          ${online ? 'text-accent-hover bg-accent-light border-accent/30' : 'text-text-muted bg-gray-100 border-border'}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-accent animate-pulse' : 'bg-offline'}`} />
          {online ? 'Online' : 'Offline'}
        </span>

        {type === 'robot' && rtkPosition && (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full ${FIX_QUALITY[rtkPosition.fix]?.tw || 'bg-gray-400 text-white'}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
            {FIX_QUALITY[rtkPosition.fix]?.label || 'UNKNOWN'}
          </span>
        )}

        {type === 'robot' && (
          <button
            onClick={onToggleCamera}
            aria-pressed={cameraOpen}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors
              ${cameraOpen ? 'bg-accent text-white border-accent' : 'bg-white text-text border-border hover:bg-gray-50'}`}
          >
            <CameraIcon />
            {cameraOpen ? 'Hide Camera' : 'Camera'}
          </button>
        )}
      </div>
    </div>
  )
}
