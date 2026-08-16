import { useState, useRef, useEffect } from 'react'
import logo from '../../assets/sudoyantra-logo.png'

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  )
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9 18l6-6-6-6" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}

function PinIcon({ pinned }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill={pinned ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-3.5 h-3.5"
    >
      <path d="M12 17v5" />
      <path d="M9 11l-4 4h14l-4-4" />
      <path d="M15 3.5L9.5 9 15 11l-1.5 5L9 9.5 3.5 11 9 5l6-1.5z" />
    </svg>
  )
}

function RobotsIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="4" y="8" width="16" height="12" rx="2" ry="2" />
      <path d="M12 8V4M9 4h6" />
      <circle cx="9" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

function SidebarDeviceItem({ mac, label, online, active, pinned, onSelect, onRename, onTogglePin }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    onRename(draft)
    setEditing(false)
  }

  const handleDoubleClick = (e) => {
    e.stopPropagation()
    setDraft(label)
    setEditing(true)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') commit()
    else if (e.key === 'Escape') setEditing(false)
  }

  const handlePin = (e) => {
    e.stopPropagation()
    onTogglePin()
  }

  return (
    <div
      onClick={onSelect}
      onDoubleClick={handleDoubleClick}
      title="Double-click to rename"
      className={`w-full flex items-center gap-2.5 px-4 py-2.5 cursor-pointer transition-colors border-l-3
        ${active ? 'bg-accent-light border-l-accent' : 'border-l-transparent hover:bg-gray-50'}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${online ? 'bg-accent shadow-[0_0_6px_var(--color-accent)]' : 'bg-offline'}`} />
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
        <span className="flex-1 min-w-0">
          <span className="block font-mono text-sm font-medium truncate">{label}</span>
          <span className="block font-mono text-[10px] text-text-muted truncate">{mac}</span>
        </span>
      )}
      {online && !editing && !active && <span className="text-[10px] font-bold text-accent shrink-0">LIVE</span>}
      {!editing && (
        <button
          onClick={handlePin}
          title={pinned ? 'Unpin' : 'Pin to top'}
          className={`shrink-0 p-1 rounded transition-colors ${pinned ? 'text-accent hover:text-accent-hover' : 'text-gray-300 hover:text-gray-500'}`}
        >
          <PinIcon pinned={pinned} />
        </button>
      )}
    </div>
  )
}

export default function Sidebar({
  collapsed, onToggleCollapse,
  robots, robotStatus, selectedRobotMac, onSelectRobot,
  getDeviceName, onRename, isPinned, togglePin,
}) {
  const [showOthers, setShowOthers] = useState(false)

  if (collapsed) {
    return (
      <aside className="w-14 shrink-0 border-r border-border bg-white flex flex-col items-center py-3 gap-1">
        <button onClick={onToggleCollapse} title="Expand sidebar" className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-gray-100 transition-colors">
          <ChevronRightIcon />
        </button>
        <div className="w-7 h-px bg-border my-2" />
        <button
          onClick={onToggleCollapse}
          title="Robots"
          className="p-2 rounded-lg text-text-muted hover:text-accent hover:bg-accent-light transition-colors"
        >
          <RobotsIcon />
        </button>
      </aside>
    )
  }

  const pinned = robots.filter((mac) => isPinned(mac, 'robot'))
  const others = robots.filter((mac) => !isPinned(mac, 'robot'))

  const renderItem = (mac) => {
    const idx = robots.indexOf(mac) + 1
    return (
      <SidebarDeviceItem
        key={mac}
        mac={mac}
        label={getDeviceName(mac, idx, 'robot')}
        online={robotStatus[mac]?.online}
        active={mac === selectedRobotMac}
        pinned={isPinned(mac, 'robot')}
        onSelect={() => onSelectRobot(mac)}
        onRename={(newName) => onRename(mac, newName, 'robot')}
        onTogglePin={() => togglePin(mac, 'robot')}
      />
    )
  }

  return (
    <aside className="w-72 shrink-0 border-r border-border bg-white flex flex-col min-h-0">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <img src={logo} alt="Sudoyantra" className="h-9 w-9 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-bold tracking-tight leading-tight">Sudoyantra</div>
            <div className="text-[10px] uppercase tracking-wider text-text-muted">Robot Control</div>
          </div>
        </div>
        <button onClick={onToggleCollapse} title="Collapse sidebar" className="p-1.5 rounded-lg text-text-muted hover:text-text hover:bg-gray-100 transition-colors shrink-0">
          <ChevronLeftIcon />
        </button>
      </div>

      <div className="px-4 pb-1.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-text-muted">
        Robots · {robots.length}
      </div>

      <div className="flex-1 overflow-y-auto pb-2">
        {robots.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-text-muted">No robots found</div>
        ) : (
          <>
            {pinned.map(renderItem)}

            {pinned.length > 0 && others.length > 0 && (
              <>
                <button
                  onClick={() => setShowOthers((s) => !s)}
                  className="w-full flex items-center justify-between px-4 py-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-text-muted hover:text-text transition-colors"
                >
                  <span>Others · {others.length}</span>
                  <span className={`transition-transform ${showOthers ? 'rotate-180' : ''}`}>
                    <ChevronDownIcon />
                  </span>
                </button>
                {showOthers && others.map(renderItem)}
              </>
            )}

            {pinned.length === 0 && others.map(renderItem)}
          </>
        )}
      </div>
    </aside>
  )
}
