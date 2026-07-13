export default function Header({ domain, onDomainChange, countdown, title, onExport, onImport }) {
  return (
    <header className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-white border-b border-border">
      <h1 className="text-lg font-bold tracking-tight">{title}</h1>
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={domain}
          onChange={(e) => onDomainChange(e.target.value)}
          className="px-2 py-1 text-sm border border-border rounded-md bg-white font-sans cursor-pointer"
        >
          <option value="https://server2.sudoyantra.com">Server 2 (Default)</option>
          <option value="hpcl-robot-a4f00f72f340">HPCL Robot (a4f00f72f340)</option>
          <option value="carbantis">Carbantis</option>
        </select>
        <button onClick={onExport} className="px-2 py-1 text-xs font-medium border border-border rounded-md bg-white hover:bg-gray-50 transition-colors" title="Export device names">
          Export
        </button>
        <button onClick={onImport} className="px-2 py-1 text-xs font-medium border border-border rounded-md bg-white hover:bg-gray-50 transition-colors" title="Import device names">
          Import
        </button>
        <span className="text-sm text-text-muted">
          Refresh: <span className="text-accent font-semibold">{countdown}</span>s
        </span>
      </div>
    </header>
  )
}
