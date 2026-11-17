import { useEffect, useMemo, useRef, useState } from 'react'
import { parseLogLine } from '../../api'
import LogLine, { getLogLevel } from './LogLine'

const HOVER_REFRESH_MS = 15000
const PAGE_SIZE = 20

const LEVELS = [
  { value: 'all', label: 'All' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Warn' },
  { value: 'gps', label: 'GPS' },
  { value: 'run', label: 'Run' },
  { value: 'info', label: 'Info' },
];

function logText(line) {
  return String(parseLogLine(line).body).toLowerCase()
}

export default function LogsPanel({ logs, loading, error, onRefresh }) {
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('all')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const scrollRef = useRef(null)
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return logs.filter((line) => {
      if (level !== 'all' && getLogLevel(line) !== level) return false
      return !q || logText(line).includes(q)
    })
  }, [logs, query, level])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => setPage(1), [query, level, logs])
  useEffect(() => {
    if (page !== currentPage) setPage(currentPage)
  }, [page, currentPage])
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [currentPage, query, level, logs])

  useEffect(() => {
    if (!hovered) return
    const id = setInterval(() => onRefreshRef.current?.(), HOVER_REFRESH_MS)
    return () => clearInterval(id)
  }, [hovered])

  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => { if (e.key === 'Escape') setExpanded(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded])

  const resetView = () => {
    setQuery('')
    setLevel('all')
    setPage(1)
  }

  const panel = (
    <div
      className={`bg-white border border-border rounded-xl overflow-hidden flex flex-col ${expanded ? 'h-full' : 'flex-1 min-h-52 max-h-[55vh]'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-border">
        <span className="text-sm font-semibold">Logs</span>
        {hovered && <span className="text-[10px] font-medium text-text-muted">auto 15s</span>}

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search logs…"
          className="px-2 py-1 text-xs border border-border rounded-md bg-white outline-none focus:border-accent min-w-32 flex-1 max-w-64"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-2 py-1 text-xs border border-border rounded-md bg-white cursor-pointer"
        >
          {LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
        </select>

        <div className="flex items-center gap-1 ml-auto">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 text-xs border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40">‹</button>
          <span className="px-1 text-[11px] text-text-muted whitespace-nowrap">{currentPage}/{totalPages} · {filtered.length}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-2 py-1 text-xs border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-40">›</button>
          <button onClick={resetView} title="Reset view" className="px-2 py-1 text-xs border border-border rounded-md bg-white hover:bg-gray-50">✕</button>
          <button onClick={onRefresh} disabled={loading} className="px-2 py-1 text-xs border border-border rounded-md bg-white hover:bg-gray-50 disabled:opacity-50">{loading ? 'Loading…' : 'Fetch Log'}</button>
          <button onClick={() => setExpanded((v) => !v)} title={expanded ? 'Collapse logs' : 'Expand logs'} className="px-2 py-1 text-xs border border-border rounded-md bg-white hover:bg-gray-50">
            {expanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 min-h-0 overflow-hidden font-mono text-xs leading-relaxed flex flex-col">
        {loading && <div className="py-6 text-center text-text-muted">Loading…</div>}
        {!loading && error && <div className="py-6 text-center text-error">{error}</div>}
        {!loading && !error && visible.length === 0 && (
          <div className="py-6 text-center text-text-muted">{logs.length ? 'No matching logs' : 'No logs available'}</div>
        )}
        {!loading && !error && visible.map((line, i) => (
          <LogLine key={(currentPage - 1) * PAGE_SIZE + i} line={line} />
        ))}
      </div>
    </div>
  )

  if (expanded) {
    return (
      <div className="fixed inset-0 z-40 bg-bg p-3 md:p-4 flex flex-col">
        {panel}
      </div>
    )
  }

  return panel
}
