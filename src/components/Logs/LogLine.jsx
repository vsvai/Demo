import { parseLogLine, formatGmtIstTags } from '../../api'

export default function LogLine({ line }) {
  const parsed = parseLogLine(line)

  if (parsed.date) {
    const { gmt, ist } = formatGmtIstTags(parsed.date)
    return (
      <div className="py-1 px-0.5 border-b border-black/5 last:border-0 break-words text-[13px] leading-relaxed font-mono">
        <span className="inline-flex flex-wrap items-center gap-1.5 mr-1 align-middle">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">{gmt}</span>
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded border border-green-200 bg-green-50 text-green-700 whitespace-nowrap">{ist}</span>
        </span>{' '}
        {parsed.body}
      </div>
    )
  }

  if (parsed.raw) {
    return (
      <div className="py-1 px-0.5 border-b border-black/5 last:border-0 break-words text-[13px] leading-relaxed font-mono">
        <span className="inline-flex items-center gap-1.5 mr-1 align-middle">
          <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 whitespace-nowrap">{parsed.raw}</span>
        </span>{' '}
        {parsed.body}
      </div>
    )
  }

  return (
    <div className="py-1 px-0.5 border-b border-black/5 last:border-0 break-words text-[13px] leading-relaxed font-mono">
      {parsed.body}
    </div>
  )
}
