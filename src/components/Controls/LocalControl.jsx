import { useEffect, useState } from 'react'
import { isValidIp } from '../../api'

export default function LocalControl({ ip, detectedIp, onChange, onUseDetected, relay, onRelayChange }) {
  const [draft, setDraft] = useState(ip)

  useEffect(() => { setDraft(ip) }, [ip])

  const handleIpChange = (value) => {
    setDraft(value)
    if (isValidIp(value)) onChange(value)
  }

  return (
    <div className="flex flex-wrap items-center gap-2 px-3 py-2 mb-3 bg-wifi-light border border-wifi/30 rounded-lg">
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-wifi uppercase tracking-wide">
        <span className="w-1.5 h-1.5 rounded-full bg-wifi animate-pulse" />
        Local UDP
      </span>
      <label htmlFor="local-robot-ip" className="text-xs font-semibold text-text">Robot IP</label>
      <input
        id="local-robot-ip"
        value={draft}
        onChange={(e) => handleIpChange(e.target.value.trim())}
        onBlur={() => { if (!isValidIp(draft)) setDraft(ip) }}
        placeholder={ip || detectedIp || '192.168.1.100'}
        spellCheck={false}
        className="px-2 py-1 text-xs font-mono border border-border rounded-md bg-white outline-none focus:border-wifi w-36"
      />
      {detectedIp && detectedIp !== ip && (
        <button
          onClick={() => handleIpChange(detectedIp)}
          title="Use IP from WIFI: log line"
          className="px-2 py-1 text-xs border border-wifi text-wifi rounded-md bg-white hover:bg-white/60"
        >
          Use log IP ({detectedIp})
        </button>
      )}
      <label htmlFor="local-relay" className="text-xs font-semibold text-text">Relay</label>
      <input
        id="local-relay"
        value={relay}
        onChange={(e) => onRelayChange(e.target.value.trim())}
        placeholder="blank = same site, or https://gateway-host"
        title="Base URL only — do not include /local/udp"
        spellCheck={false}
        className="px-2 py-1 text-xs font-mono border border-border rounded-md bg-white outline-none focus:border-wifi w-52"
      />
      <span className="text-[11px] text-text-muted">Port 8888 · trusted LAN only</span>
    </div>
  )
}
