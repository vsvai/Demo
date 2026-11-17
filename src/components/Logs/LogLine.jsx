import { parseLogLine, formatGmtIstTags } from '../../api'

export function getLogLevel(line) {
  const text = String(parseLogLine(line).body).toLowerCase()
  if (/error|fatal|exception|failed|failure|timeout|not found/.test(text)) return 'error'
  if (/warn|warning|low battery|lowbat|critical/.test(text)) return 'warn'
  if (/rover position|latitude|longitude|rtk|gps|satellites|hdop/.test(text)) return 'gps'
  if (/running_|command|cmd|start|stop|forward|backward|left|right/.test(text)) return 'run'
  return 'info'
}

const LEVEL_CHIPS = {
  error: 'bg-error text-white',
  warn: 'bg-warning text-white',
  gps: 'bg-wifi text-white',
  run: 'bg-accent text-white',
  info: '',
};

export default function LogLine({ line }) {
  const parsed = parseLogLine(line)
  const level = getLogLevel(line)
  const tag = parsed.date ? formatGmtIstTags(parsed.date).ist : parsed.raw

  return (
    <div className="py-1 px-1.5 border-b border-black/5 last:border-0 break-words text-[13px] leading-relaxed font-mono text-text">
      {level !== 'info' && (
        <span className={`inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${LEVEL_CHIPS[level]}`}>
          {level}
        </span>
      )}
      {tag && (
        <span className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 whitespace-nowrap align-middle">
          {tag}
        </span>
      )}
      {parsed.body}
    </div>
  )
}
