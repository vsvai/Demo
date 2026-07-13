const stats = [
  { key: 'totalRuns', label: 'Total Runs' },
  { key: 'lastRunTime', label: 'Last Run Cmd' },
  { key: 'lastBat', label: 'Battery (ADS)' },
  { key: 'lastVer', label: 'Version' },
]

export default function StatsPanel({ data }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 mb-4">
      {stats.map((s) => (
        <div key={s.key} className="bg-white border border-border rounded-lg p-3 text-center shadow-sm h-20 flex flex-col justify-center">
          <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{s.label}</div>
          <div className="text-lg font-semibold text-accent-hover font-mono mt-0.5">{data[s.key]}</div>
        </div>
      ))}
    </div>
  )
}
