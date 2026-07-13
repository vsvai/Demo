import { useState, useRef, useEffect } from 'react'

function PinIcon({ pinned }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={pinned ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4 shrink-0"
    >
      <path d="M12 17v5" />
      <path d="M9 11l-4 4h14l-4-4" />
      <path d="M15 3.5L9.5 9 15 11l-1.5 5L9 9.5 3.5 11 9 5l6-1.5z" />
    </svg>
  )
}

export default function DeviceItem({ mac, index, online, active, type, onClick, displayName, onRename, pinned, onTogglePin }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(displayName)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    onRename(mac, draft, type)
    setEditing(false)
  }

  const handleDblClick = (e) => {
    e.stopPropagation()
    setDraft(displayName)
    setEditing(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') setEditing(false)
  }

  const handlePin = (e) => {
    e.stopPropagation()
    onTogglePin(mac, type)
  }

  return (
    <div
      onClick={onClick}
      onDoubleClick={handleDblClick}
      title="Double-click to rename"
      className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-l-3 transition-all duration-150
        ${active
          ? type === 'wifi'
            ? 'bg-wifi-light border-l-wifi'
            : 'bg-accent-light border-l-accent'
          : 'border-l-transparent hover:bg-gray-50 active:bg-gray-100'
        }`}
    >
      <span className={`w-2.5 h-2.5 rounded-full shrink-0
        ${online ? 'bg-accent shadow-[0_0_8px_var(--color-accent)]' : 'bg-offline'}
      `} />
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="font-mono text-sm font-medium bg-white border border-accent rounded px-1.5 py-0.5 flex-1 outline-none"
        />
      ) : (
        <span className="font-mono text-sm font-medium truncate flex-1">{displayName}</span>
      )}
      <button
        onClick={handlePin}
        title={pinned ? 'Unpin' : 'Pin to top'}
        className={`shrink-0 p-1 rounded transition-colors
          ${pinned ? 'text-accent hover:text-accent-hover' : 'text-gray-300 hover:text-gray-500'}
        `}
      >
        <PinIcon pinned={pinned} />
      </button>
    </div>
  )
}
