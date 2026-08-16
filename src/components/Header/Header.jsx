import logo from '../../assets/sudoyantra-logo.png'

export default function Header({ domain, onDomainChange, countdown, title, onExport, onImport, apiStatus, apiStatusError, domainLocked, lockLabel, onLock }) {
  return (
    <header className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 bg-white border-b border-border">
      <div className="flex items-center gap-3 min-w-0">
        <img src={logo} alt="Sudoyantra" className="h-10 w-10 object-contain shrink-0" />
        <div className="min-w-0">
          <h1 className="text-lg font-bold tracking-tight leading-tight truncate">{title}</h1>
          <span className={`hidden md:inline-block text-xs px-2 py-0.5 rounded-md border max-w-64 break-all
            ${apiStatusError ? 'text-error border-error bg-error-light' : 'text-text-muted border-border bg-bg'}`}
          >
            {apiStatus}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {domainLocked ? (
          <span className="flex items-center gap-2 px-3 py-1 text-sm font-semibold border border-accent rounded-md bg-accent-light text-accent-hover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            {lockLabel}
          </span>
        ) : (
          <select
            value={domain}
            onChange={(e) => onDomainChange(e.target.value)}
            className="px-2 py-1 text-sm border border-border rounded-md bg-white font-sans cursor-pointer"
          >
            <option value="https://server2.sudoyantra.com">Server 2 (Default)</option>
            <option value="hpcl">HPCL Delhi </option>
            <option value="carbantis">Carbantis</option>
          </select>
        )}
        <button onClick={onExport} className="px-2 py-1 text-xs font-medium border border-border rounded-md bg-white hover:bg-gray-50 transition-colors" title="Export device names">
          Export
        </button>
        <button onClick={onImport} className="px-2 py-1 text-xs font-medium border border-border rounded-md bg-white hover:bg-gray-50 transition-colors" title="Import device names">
          Import
        </button>
        <span className="text-sm text-text-muted">
          Refresh: <span className="text-accent font-semibold">{countdown}</span>s
        </span>
        {domainLocked && (
          <button onClick={onLock} className="ml-2 px-2.5 py-1 text-xs font-semibold border border-error rounded-md bg-error text-white hover:bg-red-700 transition-colors" title="Logout">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 inline-block mr-1 align-text-bottom">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Logout
          </button>
        )}
      </div>
    </header>
  )
}
