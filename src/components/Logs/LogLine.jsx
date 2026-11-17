import { parseLogLine, formatGmtIstTags } from '../../api'

export function getLogLevel(line) {
  const text = String(parseLogLine(line).body).toLowerCase()
  if (/error|fatal|exception|failed|failure|timeout|not found/.test(text)) return 'error'
  if (/warn|warning|low battery|lowbat|critical/.test(text)) return 'warn'
  if (/rover position|latitude|longitude|rtk|gps|satellites|hdop/.test(text)) return 'gps'
  if (/running_|command|cmd|start|stop|forward|backward|left|right/.test(text)) return 'run'
  return 'info'
}

const LEVEL_STYLES = {
  error: 'text-error bg-error-light border-l-error',
  warn: 'text-warning bg-warning-light border-l-warning',
  gps: 'text-wifi bg-wifi-light border-l-wifi',
  run: 'text-accent-hover bg-accent-light border-l-accent',
  info: 'text-text border-l-border',
};

export default function LogLine({ line }) {
  const parsed = parseLogLine(line)
  const tag = parsed.date ? formatGmtIstTags(parsed.date).ist : parsed.raw

  return (
    <div className={`py-1 px-1.5 border-b border-black/5 border-l-2 last:border-b-0 break-words text-[13px] leading-relaxed font-mono ${LEVEL_STYLES[getLogLevel(line)]}`}>
      {tag && (
        <span className="inline-flex items-center mr-1.5 px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-[11px] font-semibold text-green-700 whitespace-nowrap align-middle">
          {tag}
        </span>
      )}
      {parsed.body}
    </div>
  )
}
