import { useState, useRef } from 'react'

const DIRS = [
  { cmd: 'forward', label: 'Forward', kbd: 'W', grid: 'col-start-2', icon: <path d="M12 19V5M5 12l7-7 7 7" /> },
  { cmd: 'left', label: 'Left', kbd: 'A', grid: 'col-start-1 row-start-2', icon: <path d="M19 12H5M12 5l-7 7 7 7" /> },
  { cmd: 'backward', label: 'Backward', kbd: 'S', grid: 'col-start-2 row-start-2', icon: <path d="M12 5v14M5 12l7 7 7-7" /> },
  { cmd: 'right', label: 'Right', kbd: 'D', grid: 'col-start-3 row-start-2', icon: <path d="M5 12h14M12 5l7 7-7 7" /> },
]

const REPEAT_MS = 250

export default function RobotControls({ onCommand, onStop, onOta, feedback, activeCmd }) {
  const [held, setHeld] = useState(null)
  const repeatRef = useRef(null)

  const press = (cmd) => {
    if (repeatRef.current) return
    setHeld(cmd)
    onCommand(cmd)
    repeatRef.current = setInterval(() => onCommand(cmd), REPEAT_MS)
  }

  const release = () => {
    clearInterval(repeatRef.current)
    repeatRef.current = null
    setHeld(null)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center pb-3">
      <button onClick={onStop} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-error text-error hover:bg-error-light transition-colors min-h-11">
        Stop
      </button>
      <button onClick={() => onCommand('go_forward')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        Go Forward
      </button>
      <button onClick={() => onCommand('go_backward')} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-wifi text-wifi hover:bg-wifi-light transition-colors min-h-11">
        Go Backward
      </button>
      <button onClick={onOta} className="px-4 py-2.5 text-sm font-semibold rounded-lg border border-warning text-warning hover:bg-warning-light transition-colors min-h-11">
        OTA
      </button>

      {/* WASD Grid */}
      <div className="grid grid-cols-3 gap-1 w-56 mt-2 select-none" style={{ WebkitTouchCallout: 'none' }}>
        {DIRS.map((d) => {
          const pressed = held === d.cmd || activeCmd === d.cmd
          return (
            <button
              key={d.cmd}
              onPointerDown={(e) => { e.preventDefault(); press(d.cmd) }}
              onPointerUp={release}
              onPointerLeave={release}
              onPointerCancel={release}
              onContextMenu={(e) => e.preventDefault()}
              className={`${d.grid} flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 min-h-[52px] rounded-lg border transition-all duration-100 select-none touch-none [-webkit-touch-callout:none] ${
                pressed
                  ? 'bg-blue-500 text-white border-blue-600 shadow-inner scale-95'
                  : 'border-blue-500 text-blue-500 bg-white hover:bg-blue-50'
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={`w-4 h-4 ${pressed ? 'animate-pulse' : ''}`}>
                {d.icon}
              </svg>
              <span className="text-[10px] leading-none font-semibold">{d.label}</span>
              <span className={`text-[9px] leading-none font-mono font-bold px-1 rounded ${pressed ? 'bg-white/20' : 'bg-blue-50'}`}>{d.kbd}</span>
            </button>
          )
        })}
      </div>

      {feedback && (
        <span className={`w-full text-xs px-3 py-2 rounded-md
          ${feedback.error ? 'bg-error-light text-error' : 'bg-accent-light text-accent-hover'}
        `}>
          {feedback.text}
        </span>
      )}
    </div>
  )
}
