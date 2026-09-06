import LogLine from './LogLine'

export default function LogsPanel({ logs, loading, error }) {
  return (
    <div className="flex-1 bg-white border border-border rounded-xl overflow-hidden flex flex-col min-h-52">
      <div className="px-4 py-2.5 border-b border-border text-sm font-semibold">Logs</div>
      <div className="flex-1 overflow-y-auto px-4 py-3 font-mono text-xs leading-relaxed flex flex-col-reverse">
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
