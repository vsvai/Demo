import { useEffect, useRef, useState } from 'react'
import LogLine from './LogLine'

const HOVER_REFRESH_MS = 15000

export default function LogsPanel({ logs, loading, error, onRefresh }) {
  const [hovered, setHovered] = useState(false)
  const scrollRef = useRef(null)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    if (!hovered) return
    const id = setInterval(() => onRefreshRef.current?.(), HOVER_REFRESH_MS)
    return () => clearInterval(id)
  }, [hovered])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [logs])

  return (
    <div
      className="flex-1 bg-white border border-border rounded-xl overflow-hidden flex flex-col min-h-52 max-h-[55vh]"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>Logs</span>
          {hovered && <span className="text-[10px] font-medium text-text-muted">auto 15s</span>}
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-2 py-1 text-[11px] font-medium border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Loading…' : 'Fetch Log'}
        </button>
      </div>
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed flex flex-col">
        {loading && <div className="py-6 text-center text-text-muted">Loading…</div>}
        {!loading && error && <div className="py-6 text-center text-error">{error}</div>}
        {!loading && !error && logs.length === 0 && (
          <div className="py-6 text-center text-text-muted">No logs available</div>
        )}
        {!loading && !error && logs.map((line, i) => (
          <LogLine key={i} line={line} />
        ))}
      </div>
    </div>
  )
}
