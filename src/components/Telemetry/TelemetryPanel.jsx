const BATT_MIN_V = 10.5
const BATT_MAX_V = 12.6

function battPercent(v) {
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, ((v - BATT_MIN_V) / (BATT_MAX_V - BATT_MIN_V)) * 100))
}

function fmtTs(ts) {
  if (!ts) return '--'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '--'
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

export default function TelemetryPanel({ data, lowLimit }) {
  const state = String(data?.state || 'unknown').toLowerCase()
  const lamp = data?.status_lamp || 'UNKNOWN'
  const battery = Number.isFinite(data?.battery_v) ? data.battery_v : null
  const pct = battPercent(battery)
  const low = battery != null && lowLimit != null && battery <= lowLimit

  const stateStyle =
    state === 'moving'
      ? { cls: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-500 animate-pulse' }
      : state === 'error' || state === 'fault'
        ? { cls: 'bg-error-light text-error border-red-200', dot: 'bg-error animate-pulse' }
        : { cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400' }

  const lampStyle = {
    RUNNING: 'bg-accent-light text-accent-hover border-green-200',
    STOPPED: 'bg-gray-100 text-gray-600 border-gray-200',
    LOW_BATTERY: 'bg-warning-light text-warning border-amber-200',
    FAULT: 'bg-error-light text-error border-red-200',
    UNKNOWN: 'bg-gray-100 text-gray-400 border-gray-200',
  }[lamp] || 'bg-gray-100 text-gray-400 border-gray-200'

  const barColor = low ? 'bg-error' : pct > 50 ? 'bg-accent' : pct > 20 ? 'bg-warning' : 'bg-error'

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-2 mb-4">
      {/* Battery */}
      <div className="bg-white border border-border rounded-lg p-3 shadow-sm col-span-2 flex flex-col justify-center min-h-20">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Battery</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${low ? 'bg-error text-white animate-pulse' : 'bg-accent-light text-accent-hover'}`}>
            {low ? `LOW < ${lowLimit ?? '--'}V` : 'OK'}
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-0.5">
          <span className={`text-xl font-bold font-mono ${low ? 'text-error' : 'text-text'}`}>{battery != null ? battery.toFixed(2) : '--'}</span>
          <span className="text-xs font-semibold text-text-muted">V</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* State + Lamp */}
      <div className="bg-white border border-border rounded-lg p-3 shadow-sm flex flex-col justify-center items-start gap-1.5 min-h-20">
        <span className="text-[11px] font-bold uppercase tracking-wide text-text-muted">State / Lamp</span>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-bold capitalize ${stateStyle.cls}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${stateStyle.dot}`} />
          {state}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${lampStyle}`}>
          {lamp.replace('_', ' ')}
        </span>
      </div>

      {/* Runs */}
      <div className="bg-white border border-border rounded-lg p-3 text-center shadow-sm h-20 flex flex-col justify-center">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Total Runs</div>
        <div className="text-lg font-semibold text-accent-hover font-mono mt-0.5">{data ? (data.total_runs ?? 0) : '--'}</div>
      </div>

      {/* Distance */}
      <div className="bg-white border border-border rounded-lg p-3 text-center shadow-sm h-20 flex flex-col justify-center">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Distance Cleaned</div>
        <div className="text-lg font-semibold text-wifi font-mono mt-0.5">
          {data?.total_distance_m != null ? `${Number(data.total_distance_m).toFixed(1)} m` : '--'}
        </div>
      </div>

      {/* Last run */}
      <div className="bg-white border border-border rounded-lg p-3 text-center shadow-sm h-20 flex flex-col justify-center">
        <div className="text-[11px] font-bold uppercase tracking-wide text-text-muted">Last Run</div>
        <div className="text-sm font-semibold text-text font-mono mt-0.5">{fmtTs(data?.last_run_ts)}</div>
      </div>
    </div>
  )
}
