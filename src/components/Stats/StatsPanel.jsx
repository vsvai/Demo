const stats = [
  { key: 'totalRuns', label: 'Total Runs' },
  { key: 'lastRunTime', label: 'Last Run Cmd' },
  { key: 'lastBat', label: 'Battery (ADS)' },
  { key: 'lastVer', label: 'Version' },
  { key: 'peakBrush', label: 'Peak Brush' },
  { key: 'peakLeft', label: 'Peak Left' },
  { key: 'peakBottom', label: 'Peak Bottom' },
]

export default function StatsPanel({ data }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 mb-4">
      {stats.map((s) => {
        const v = data[s.key]
        const isPeak = v && typeof v === 'object'
        return (
          <div key={s.key} className="bg-white border border-border rounded-lg p-3 text-center shadow-sm h-24 flex flex-col justify-center">
            <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">{s.label}</div>
            <div className="text-lg font-semibold text-accent-hover font-mono mt-0.5">{isPeak ? v.amps : v}</div>
            {isPeak && <div className="text-[10px] text-text-muted font-mono">{v.volts}</div>}
          </div>
        )
      })}
    </div>
  )
}
