import DeviceItem from './DeviceItem'

export default function Sidebar({
  activeTab, onTabChange,
  robots, robotStatus, selectedRobotMac, onSelectRobot,
  wifiDevices, wifiStatus, selectedWifiMac, onSelectWifi,
  apiStatus, apiStatusError,
  getDeviceName, renameDevice, togglePin, isPinned,
}) {
  const sortedRobots = [...robots].sort((a, b) => {
    const ap = isPinned(a, 'robot') ? 0 : 1
    const bp = isPinned(b, 'robot') ? 0 : 1
    return ap !== bp ? ap - bp : robots.indexOf(a) - robots.indexOf(b)
  })

  const sortedWifi = [...wifiDevices].sort((a, b) => {
    const ap = isPinned(a, 'wifi') ? 0 : 1
    const bp = isPinned(b, 'wifi') ? 0 : 1
    return ap !== bp ? ap - bp : wifiDevices.indexOf(a) - wifiDevices.indexOf(b)
  })

  return (
    <aside className="w-70 min-w-60 border-r border-border bg-white overflow-y-auto flex flex-col">
      {/* Tabs */}
      <div className="flex gap-1 p-3 pb-2 border-b border-border">
        <button
          onClick={() => onTabChange('robots')}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors
            ${activeTab === 'robots'
              ? 'bg-accent text-white border-accent'
              : 'bg-bg border-border text-text hover:bg-gray-100'
            }`}
        >
          Robots
        </button>
        <button
          onClick={() => onTabChange('wifi')}
          className={`flex-1 py-2.5 px-3 text-xs font-semibold rounded-lg border transition-colors
            ${activeTab === 'wifi'
              ? 'bg-wifi text-white border-wifi'
              : 'bg-bg border-border text-text hover:bg-gray-100'
            }`}
        >
          Wi‑Fi
        </button>
      </div>

      {/* Robot list */}
      <div className={activeTab !== 'robots' ? 'hidden' : ''}>
        <div className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Robots
        </div>
        {sortedRobots.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-text-muted">No robots</div>
        ) : (
          sortedRobots.map((mac) => {
            const idx = robots.indexOf(mac) + 1
            return (
              <DeviceItem
                key={mac}
                mac={mac}
                index={idx}
                online={robotStatus[mac]?.online}
                active={mac === selectedRobotMac}
                type="robot"
                onClick={() => onSelectRobot(mac)}
                displayName={getDeviceName(mac, idx, 'robot')}
                onRename={renameDevice}
                pinned={isPinned(mac, 'robot')}
                onTogglePin={togglePin}
              />
            )
          })
        )}
      </div>

      {/* WiFi list */}
      <div className={activeTab !== 'wifi' ? 'hidden' : ''}>
        <div className="px-4 pt-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
          Wi‑Fi devices
        </div>
        {sortedWifi.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-text-muted">No Wi‑Fi devices</div>
        ) : (
          sortedWifi.map((mac) => {
            const idx = wifiDevices.indexOf(mac) + 1
            return (
              <DeviceItem
                key={mac}
                mac={mac}
                index={idx}
                online={wifiStatus[mac]?.online}
                active={mac === selectedWifiMac}
                type="wifi"
                onClick={() => onSelectWifi(mac)}
                displayName={getDeviceName(mac, idx, 'wifi')}
                onRename={renameDevice}
                pinned={isPinned(mac, 'wifi')}
                onTogglePin={togglePin}
              />
            )
          })
        )}
      </div>

      {/* API Status */}
      <div className={`mt-auto mx-3 mb-3 px-3 py-2 text-xs rounded-lg border break-words
        ${apiStatusError ? 'text-error border-error bg-error-light' : 'text-text-muted border-border bg-bg'}
      `}>
        {apiStatus}
      </div>
    </aside>
  )
}
