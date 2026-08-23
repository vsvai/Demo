import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  getDomainConfig,
  fetchRobotsList,
  fetchWifiMacsList,
  fetchLogs,
  fetchWifiLogs,
  fetchUdpStatus,
  sendRobotCommand,
  sendRobotStop,
  triggerOta,
  sendWifiAction,
  fetchTelemetry,
  fetchTelemetrySettings,
  extractStatsFromLogs,
} from './api'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import DeviceHeader from './components/DeviceHeader'
import RobotControls from './components/Controls/RobotControls'
import MapPanel from './components/Map/MapPanel'
import WifiControls from './components/Controls/WifiControls'
import StatsPanel from './components/Stats/StatsPanel'
import TelemetryPanel from './components/Telemetry/TelemetryPanel'
import LogsPanel from './components/Logs/LogsPanel'
import CameraPanel from './components/Camera/CameraPanel'
import PasscodeGate from './components/PasscodeGate'

const REFRESH_MS = 10000
const ONLINE_THRESHOLD_MS = 120000
const UDP_STATUS_INTERVAL = 30000
const NAMES_KEY = 'robot_dashboard_device_names'
const SESSION_KEY = 'robot_dashboard_session'

function getInitialDomain() {
  return localStorage.getItem('selected_domain') || 'https://server2.sudoyantra.com'
}

function loadDeviceNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    return raw ? JSON.parse(raw) : { robots: {}, wifi: {}, pinnedRobots: [], pinnedWifi: [] }
  } catch { return { robots: {}, wifi: {}, pinnedRobots: [], pinnedWifi: [] } }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveSession(session) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

function saveDeviceNames(names) {
  localStorage.setItem(NAMES_KEY, JSON.stringify(names))
}

function getDefaultName(mac, index, type) {
  return type === 'wifi' ? `Wi‑Fi ${index} (${mac})` : `Robot ${index} (${mac})`
}

export default function App() {
  const [domain, setDomain] = useState(getInitialDomain)
  const [robots, setRobots] = useState([])
  const [robotStatus, setRobotStatus] = useState({})
  const [selectedRobotMac, setSelectedRobotMac] = useState(null)
  const [wifiDevices, setWifiDevices] = useState([])
  const [wifiStatus, setWifiStatus] = useState({})
  const [selectedWifiMac, setSelectedWifiMac] = useState(null)
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [apiStatus, setApiStatus] = useState('')
  const [apiStatusError, setApiStatusError] = useState(false)
  const [countdown, setCountdown] = useState(REFRESH_MS / 1000)
  const [controlFeedback, setControlFeedback] = useState(null)
  const [wifiFeedback, setWifiFeedback] = useState(null)
  const [wifiTimer, setWifiTimer] = useState(10)
  const [cameraTs, setCameraTs] = useState(Date.now())
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraSize, setCameraSize] = useState(40)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [deviceNames, setDeviceNames] = useState(loadDeviceNames)
  const [session, setSession] = useState(loadSession)
  const [activeCmd, setActiveCmd] = useState(null)
  const [lastCmd, setLastCmd] = useState(null)
  const [telemetry, setTelemetry] = useState(null)
  const [lowLimit, setLowLimit] = useState(null)

  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const wifiFeedbackTimerRef = useRef(null)
  const refreshRef = useRef(null)
  const loadLogsRef = useRef(null)
  const robotCmdRef = useRef(null)
  const activeCmdTimerRef = useRef(null)

  const config = useMemo(() => getDomainConfig(domain), [domain])
  const apiBase = config.apiBase
  const title = config.title
  const stats = useMemo(() => extractStatsFromLogs(logs), [logs])

  const getDeviceName = useCallback((mac, index, type) => {
    const custom = type === 'wifi' ? deviceNames.wifi[mac] : deviceNames.robots[mac]
    return custom || getDefaultName(mac, index, type)
  }, [deviceNames])

  const renameDevice = useCallback((mac, newName, type) => {
    setDeviceNames((prev) => {
      const updated = { ...prev }
      const group = type === 'wifi' ? 'wifi' : 'robots'
      updated[group] = { ...updated[group] }
      if (newName && newName.trim()) {
        updated[group][mac] = newName.trim()
      } else {
        delete updated[group][mac]
      }
      saveDeviceNames(updated)
      return updated
    })
  }, [])

  const togglePin = useCallback((mac, type) => {
    setDeviceNames((prev) => {
      const updated = { ...prev }
      const key = type === 'wifi' ? 'pinnedWifi' : 'pinnedRobots'
      const list = [...(updated[key] || [])]
      const idx = list.indexOf(mac)
      if (idx >= 0) list.splice(idx, 1)
      else list.push(mac)
      updated[key] = list
      saveDeviceNames(updated)
      return updated
    })
  }, [])

  const isPinned = useCallback((mac, type) => {
    const key = type === 'wifi' ? 'pinnedWifi' : 'pinnedRobots'
    return (deviceNames[key] || []).includes(mac)
  }, [deviceNames])

  const exportNames = useCallback(() => {
    const blob = new Blob([JSON.stringify(deviceNames, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'robot-dashboard-names.json'
    a.click()
    URL.revokeObjectURL(url)
  }, [deviceNames])

  const importNames = useCallback(() => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = e.target.files[0]
      if (!file) return
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          if (data.robots || data.wifi) {
            setDeviceNames(data)
            saveDeviceNames(data)
          }
        } catch { alert('Invalid JSON file') }
      }
      reader.readAsText(file)
    }
    input.click()
  }, [])

  const handleDomainChange = useCallback((val) => {
    localStorage.setItem('selected_domain', val)
    setDomain(val)
    setSelectedRobotMac(null)
    setSelectedWifiMac(null)
    setLogs([])
    setRobots([])
    setWifiDevices([])
    setRobotStatus({})
    setWifiStatus({})
  }, [])

  const refresh = useCallback(async () => {
    if (session?.guest) {
      setRobots([])
      setWifiDevices([])
      setRobotStatus({})
      setWifiStatus({})
      setApiStatus('Guest view')
      setApiStatusError(false)
      return
    }
    let parts = []
    let hasErr = false
    try {
      const macs = await fetchRobotsList(apiBase)
      let unique = [...new Set(macs)]
      if (config.filterMacs.length > 0) {
        unique = unique.filter((mac) => config.filterMacs.some((f) => f.toLowerCase() === mac.toLowerCase()))
      }
      setRobots(unique)
      setRobotStatus((prev) => {
        const now = Date.now()
        const updated = {}
        for (const mac of unique) {
          const old = prev[mac] || {}
          updated[mac] = { ...old, online: old.lastSeen && (now - old.lastSeen) > ONLINE_THRESHOLD_MS ? false : (old.online ?? false) }
        }
        return updated
      })
      parts.push('Robots: ' + unique.length)
    } catch (e) {
      hasErr = true
      parts.push('Robots: error')
    }
    try {
      const w = await fetchWifiMacsList(apiBase)
      const unique = [...new Set(w)]
      setWifiDevices(unique)
      setWifiStatus((prev) => {
        const now = Date.now()
        const updated = {}
        for (const mac of unique) {
          const old = prev[mac] || {}
          updated[mac] = { ...old, online: old.lastSeen && (now - old.lastSeen) > ONLINE_THRESHOLD_MS ? false : (old.online ?? false) }
        }
        return updated
      })
      parts.push('Wi‑Fi: ' + unique.length)
    } catch (e) {
      hasErr = true
      parts.push('Wi‑Fi: error')
    }
    setApiStatus(parts.join(' · '))
    setApiStatusError(hasErr)
  }, [apiBase, config.filterMacs, session?.guest])

  const loadLogs = useCallback(async (mac, type) => {
    if (!mac) return
    setLoading(true)
    setError(null)
    try {
      const data = type === 'wifi' ? await fetchWifiLogs(apiBase, mac) : await fetchLogs(apiBase, mac)
      const raw = data.logs ?? data.data ?? (Array.isArray(data) ? data : [])
      const lines = Array.isArray(raw) ? [...raw].reverse() : (raw ? [raw] : [])
      setLogs(lines)
      const setter = type === 'robot' ? setRobotStatus : setWifiStatus
      setter((prev) => ({ ...prev, [mac]: { ...(prev[mac] || {}), online: true, lastSeen: Date.now() } }))
    } catch (e) {
      setError(e.message)
      setLogs([])
      const setter = type === 'robot' ? setRobotStatus : setWifiStatus
      setter((prev) => ({ ...prev, [mac]: { ...(prev[mac] || {}), online: false } }))
    }
    setLoading(false)
  }, [apiBase])

  refreshRef.current = refresh
  loadLogsRef.current = loadLogs

  // Auto refresh
  useEffect(() => {
    if (!session) return
    refreshRef.current()
    setCountdown(REFRESH_MS / 1000)
    refreshTimerRef.current = setInterval(() => { refreshRef.current(); setCountdown(REFRESH_MS / 1000) }, REFRESH_MS)
    countdownTimerRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => { clearInterval(refreshTimerRef.current); clearInterval(countdownTimerRef.current) }
  }, [session])

  const resetSelection = useCallback(() => {
    setSelectedRobotMac(null)
    setSelectedWifiMac(null)
    setLogs([])
    setRobots([])
    setWifiDevices([])
    setRobotStatus({})
    setWifiStatus({})
    setCameraOpen(false)
    setCameraTs(Date.now())
  }, [])

  const handleUnlock = useCallback((info) => {
    resetSelection()
    if (info.org) {
      localStorage.setItem('selected_domain', info.org.domain)
      setDomain(info.org.domain)
    }
    setSession(info)
    saveSession(info)
  }, [resetSelection])

  const handleLock = useCallback(() => {
    resetSelection()
    setSession(null)
    saveSession(null)
  }, [resetSelection])

  // Auto-select first robot once list loads
  useEffect(() => {
    if (robots.length && !selectedRobotMac && !selectedWifiMac) {
      setSelectedRobotMac(robots[0])
    }
  }, [robots, selectedRobotMac, selectedWifiMac])

  // Load logs on selection
  useEffect(() => {
    if (selectedRobotMac) loadLogsRef.current(selectedRobotMac, 'robot')
    else if (selectedWifiMac) loadLogsRef.current(selectedWifiMac, 'wifi')
  }, [selectedRobotMac, selectedWifiMac])

  // Periodic log refresh
  useEffect(() => {
    if (!selectedRobotMac && !selectedWifiMac) return
    const id = setInterval(() => {
      if (selectedRobotMac) loadLogsRef.current(selectedRobotMac, 'robot')
      else if (selectedWifiMac) loadLogsRef.current(selectedWifiMac, 'wifi')
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [selectedRobotMac, selectedWifiMac])

  // UDP status polling for all robots every 30s
  const robotsRef = useRef(robots)
  robotsRef.current = robots
  const hadRobotsRef = useRef(false)

  useEffect(() => {
    const poll = async () => {
      const list = robotsRef.current
      if (!list.length) return
      const results = await Promise.allSettled(list.map((mac) => fetchUdpStatus(apiBase, mac)))
      setRobotStatus((prev) => {
        const now = Date.now()
        const updated = { ...prev }
        const lookup = {}
        for (const mac of list) lookup[mac.toLowerCase()] = mac
        for (const r of results) {
          if (r.status === 'fulfilled') {
            const data = r.value
            const key = lookup[data.mac.toLowerCase()] || data.mac
            updated[key] = { ...(updated[key] || {}), online: data.udpReady, lastSeen: now }
          }
        }
        return updated
      })
    }
    const id = setInterval(poll, UDP_STATUS_INTERVAL)
    return () => clearInterval(id)
  }, [apiBase])

  useEffect(() => {
    if (robots.length && !hadRobotsRef.current) {
      hadRobotsRef.current = true
      robotsRef.current.forEach((mac) => fetchUdpStatus(apiBase, mac).then((data) => {
        setRobotStatus((prev) => {
          const lookup = {}
          for (const m of robotsRef.current) lookup[m.toLowerCase()] = m
          const key = lookup[data.mac.toLowerCase()] || data.mac
          return { ...prev, [key]: { ...(prev[key] || {}), online: data.udpReady, lastSeen: Date.now() } }
        })
      }).catch(() => {}))
    }
  }, [robots, apiBase])

  // Camera refresh
  useEffect(() => {
    if (!selectedRobotMac) return
    const id = setInterval(() => setCameraTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [selectedRobotMac])

  // Telemetry polling
  useEffect(() => {
    let cancelled = false
    setTelemetry(null)
    if (!selectedRobotMac) return undefined
    const poll = async () => {
      try {
        const data = await fetchTelemetry(apiBase, selectedRobotMac)
        if (!cancelled) setTelemetry(data)
      } catch { /* keep last known */ }
    }
    poll()
    const id = setInterval(poll, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [selectedRobotMac, apiBase])

  useEffect(() => {
    let cancelled = false
    fetchTelemetrySettings(apiBase)
      .then((s) => { if (!cancelled) setLowLimit(s.low_limit) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [apiBase])

  // Keyboard
  const flashActiveCmd = useCallback((cmd) => {
    setActiveCmd(cmd)
    setLastCmd({ cmd, ts: Date.now() })
    clearTimeout(activeCmdTimerRef.current)
    activeCmdTimerRef.current = setTimeout(() => setActiveCmd(null), 300)
  }, [])

  useEffect(() => {
    const handleKey = (e) => {
      const mac = selectedRobotMac
      if (!mac) return
      const key = e.key.toLowerCase()
      const map = { w: 'forward', a: 'left', s: 'backward', d: 'right' }
      if (map[key]) {
        robotCmdRef.current(map[key])
        flashActiveCmd(map[key])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedRobotMac, flashActiveCmd])

  const selectRobot = useCallback((mac) => { setSelectedRobotMac(mac); setSelectedWifiMac(null) }, [])
  const selectWifi = useCallback((mac) => { setSelectedWifiMac(mac); setSelectedRobotMac(null) }, [])

  const handleFeedback = useCallback((setter, timerRef, text, error) => {
    setter({ text, error })
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setter(null), 3500)
  }, [])

  const handleRobotCommand = useCallback(async (command) => {
    if (!selectedRobotMac) return
    try {
      const msg = await sendRobotCommand(apiBase, selectedRobotMac, command)
      handleFeedback(setControlFeedback, feedbackTimerRef, msg || 'OK', false)
    } catch (e) {
      handleFeedback(setControlFeedback, feedbackTimerRef, e.message || 'Failed', true)
    }
  }, [selectedRobotMac, apiBase, handleFeedback])

  robotCmdRef.current = handleRobotCommand

  const handleStop = useCallback(async () => {
    if (!selectedRobotMac) return
    try {
      const msg = await sendRobotStop(apiBase, selectedRobotMac)
      handleFeedback(setControlFeedback, feedbackTimerRef, msg || 'OK', false)
    } catch (e) {
      handleFeedback(setControlFeedback, feedbackTimerRef, e.message || 'Failed', true)
    }
  }, [selectedRobotMac, apiBase, handleFeedback])

  const handleOta = useCallback(async () => {
    if (!selectedRobotMac) return
    try {
      const msg = await triggerOta(apiBase, selectedRobotMac)
      handleFeedback(setControlFeedback, feedbackTimerRef, msg || 'OK', false)
    } catch (e) {
      handleFeedback(setControlFeedback, feedbackTimerRef, e.message || 'Failed', true)
    }
  }, [selectedRobotMac, apiBase, handleFeedback])

  const handleWifiAction = useCallback(async (kind) => {
    if (!selectedWifiMac) return
    const sec = parseInt(wifiTimer, 10)
    if (!sec || sec < 1) return handleFeedback(setWifiFeedback, wifiFeedbackTimerRef, 'Enter valid seconds', true)
    try {
      const msg = await sendWifiAction(apiBase, selectedWifiMac, kind, sec)
      handleFeedback(setWifiFeedback, wifiFeedbackTimerRef, msg || 'OK', false)
    } catch (e) {
      handleFeedback(setWifiFeedback, wifiFeedbackTimerRef, e.message || 'Failed', true)
    }
  }, [selectedWifiMac, apiBase, wifiTimer, handleFeedback])

  const selectedType = selectedRobotMac ? 'robot' : selectedWifiMac ? 'wifi' : null
  const selectedMac = selectedRobotMac || selectedWifiMac

  const selectedLabel = (() => {
    if (selectedRobotMac) {
      const idx = robots.indexOf(selectedRobotMac)
      return getDeviceName(selectedRobotMac, idx + 1, 'robot')
    }
    if (selectedWifiMac) {
      const idx = wifiDevices.indexOf(selectedWifiMac)
      return getDeviceName(selectedWifiMac, idx + 1, 'wifi')
    }
    return ''
  })()

  const selectedOnline = selectedRobotMac
    ? robotStatus[selectedRobotMac]?.online
    : selectedWifiMac
      ? wifiStatus[selectedWifiMac]?.online
      : null

  return (
    <div className="flex flex-col min-h-screen min-h-dvh">
      {!session && <PasscodeGate onUnlock={handleUnlock} />}
      <Header
        domain={domain} onDomainChange={handleDomainChange} countdown={countdown} title={title}
        onExport={exportNames} onImport={importNames} apiStatus={apiStatus} apiStatusError={apiStatusError}
        domainLocked={!!session} lockLabel={session?.guest ? 'Guest' : session?.org?.label} onLock={handleLock}
      />

      <main className="flex flex-1 min-h-0 flex-col md:flex-row">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          robots={robots} robotStatus={robotStatus} selectedRobotMac={selectedRobotMac} onSelectRobot={selectRobot}
          getDeviceName={getDeviceName} onRename={renameDevice} isPinned={isPinned} togglePin={togglePin}
        />

        <section className="flex-1 flex flex-col min-w-0 min-h-0 p-3 md:p-4">
          {selectedRobotMac && cameraOpen && (
            <div className="flex gap-3 mb-4">
              <CameraPanel
                apiBase={apiBase}
                ts={cameraTs}
                deviceName={selectedLabel}
                size={cameraSize}
                onSizeChange={setCameraSize}
                lastCmd={lastCmd}
                onClose={() => setCameraOpen(false)}
              />
              <div className="hidden md:flex w-72 xl:w-80 shrink-0" style={{ height: `${cameraSize}vh` }}>
                <MapPanel lastCmd={lastCmd} />
              </div>
            </div>
          )}

          {selectedType ? (
            <>
              <DeviceHeader
                name={selectedLabel}
                mac={selectedMac}
                online={selectedOnline}
                type={selectedType}
                cameraOpen={cameraOpen}
                onToggleCamera={() => setCameraOpen((o) => !o)}
                onRename={(newName) => renameDevice(selectedMac, newName, selectedType)}
              />

              {selectedRobotMac && (
                <RobotControls
                  onCommand={(cmd) => { handleRobotCommand(cmd); flashActiveCmd(cmd) }}
                  onStop={handleStop}
                  onOta={handleOta}
                  feedback={controlFeedback}
                  activeCmd={activeCmd}
                />
              )}

              {selectedWifiMac && (
                <WifiControls timer={wifiTimer} onTimerChange={setWifiTimer} onAction={handleWifiAction} feedback={wifiFeedback} />
              )}

              {selectedRobotMac && <StatsPanel data={stats} />}
              {selectedRobotMac && <TelemetryPanel data={telemetry} lowLimit={lowLimit} />}
            <div className="flex-1 min-h-0 flex gap-3">
              <LogsPanel logs={logs} loading={loading} error={error} />
              {selectedRobotMac && !cameraOpen && (
                <div className="hidden lg:flex w-72 xl:w-80 shrink-0 min-h-0">
                  <MapPanel lastCmd={lastCmd} />
                </div>
              )}
            </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 text-text-muted">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="w-12 h-12 opacity-40">
                <rect x="4" y="8" width="16" height="12" rx="2" ry="2" />
                <path d="M12 8V4M9 4h6" />
                <circle cx="12" cy="14" r="3" />
              </svg>
              <p className="text-sm">{session?.guest ? 'Guest mode — enter an organization passcode to view robots' : 'Select a robot or Wi‑Fi device from the sidebar'}</p>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
