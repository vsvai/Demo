import { useState, useEffect, useRef, useCallback } from 'react'
import {
  getDomainConfig,
  fetchRobotsList,
  fetchWifiMacsList,
  fetchLogs,
  fetchWifiLogs,
  sendRobotCommand,
  sendRobotStop,
  triggerOta,
  sendWifiAction,
  extractStatsFromLogs,
} from './api'
import Header from './components/Header/Header'
import Sidebar from './components/Sidebar/Sidebar'
import RobotControls from './components/Controls/RobotControls'
import WifiControls from './components/Controls/WifiControls'
import StatsPanel from './components/Stats/StatsPanel'
import LogsPanel from './components/Logs/LogsPanel'
import CameraFeed from './components/Camera/CameraFeed'

const REFRESH_MS = 10000
const ONLINE_THRESHOLD_MS = 120000
const NAMES_KEY = 'robot_dashboard_device_names'

function getInitialDomain() {
  return localStorage.getItem('selected_domain') || 'https://server2.sudoyantra.com'
}

function loadDeviceNames() {
  try {
    const raw = localStorage.getItem(NAMES_KEY)
    return raw ? JSON.parse(raw) : { robots: {}, wifi: {}, pinnedRobots: [], pinnedWifi: [] }
  } catch { return { robots: {}, wifi: {}, pinnedRobots: [], pinnedWifi: [] } }
}

function saveDeviceNames(names) {
  localStorage.setItem(NAMES_KEY, JSON.stringify(names))
}

function getDefaultName(mac, index, type) {
  return type === 'wifi' ? `Wi‑Fi ${index} (${mac})` : `Robot ${index} (${mac})`
}

export default function App() {
  const [domain, setDomain] = useState(getInitialDomain)
  const [activeTab, setActiveTab] = useState('robots')
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
  const [deviceNames, setDeviceNames] = useState(loadDeviceNames)

  const refreshTimerRef = useRef(null)
  const countdownTimerRef = useRef(null)
  const feedbackTimerRef = useRef(null)
  const wifiFeedbackTimerRef = useRef(null)

  const config = getDomainConfig(domain)
  const apiBase = config.apiBase
  const title = config.title
  const stats = extractStatsFromLogs(logs)

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
    let parts = []
    let hasErr = false
    try {
      const macs = await fetchRobotsList(apiBase)
      let unique = [...new Set(macs)]
      if (config.filterMacs.length > 0) {
        unique = unique.filter((mac) => config.filterMacs.includes(mac))
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
  }, [apiBase, config.filterMacs])

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

  // Auto refresh
  useEffect(() => {
    refresh()
    setCountdown(REFRESH_MS / 1000)
    refreshTimerRef.current = setInterval(() => { refresh(); setCountdown(REFRESH_MS / 1000) }, REFRESH_MS)
    countdownTimerRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000)
    return () => { clearInterval(refreshTimerRef.current); clearInterval(countdownTimerRef.current) }
  }, [refresh])

  // Load logs on selection
  useEffect(() => {
    if (selectedRobotMac) loadLogs(selectedRobotMac, 'robot')
    else if (selectedWifiMac) loadLogs(selectedWifiMac, 'wifi')
  }, [selectedRobotMac, selectedWifiMac, loadLogs])

  // Periodic log refresh
  useEffect(() => {
    if (!selectedRobotMac && !selectedWifiMac) return
    const id = setInterval(() => {
      if (selectedRobotMac) loadLogs(selectedRobotMac, 'robot')
      else if (selectedWifiMac) loadLogs(selectedWifiMac, 'wifi')
    }, REFRESH_MS)
    return () => clearInterval(id)
  }, [selectedRobotMac, selectedWifiMac, loadLogs])

  // Camera refresh
  useEffect(() => {
    if (!selectedRobotMac) return
    const id = setInterval(() => setCameraTs(Date.now()), 1000)
    return () => clearInterval(id)
  }, [selectedRobotMac])

  // Keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (!selectedRobotMac) return
      const key = e.key.toLowerCase()
      const map = { w: 'forward', a: 'left', s: 'backward', d: 'right' }
      if (map[key]) handleRobotCommand(map[key])
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [selectedRobotMac])

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

  const selectedLabel = (() => {
    if (selectedRobotMac) {
      const idx = robots.indexOf(selectedRobotMac)
      return getDeviceName(selectedRobotMac, idx + 1, 'robot')
    }
    if (selectedWifiMac) {
      const idx = wifiDevices.indexOf(selectedWifiMac)
      return getDeviceName(selectedWifiMac, idx + 1, 'wifi')
    }
    return 'Select a robot or Wi‑Fi device'
  })()

  return (
    <div className="flex flex-col min-h-screen min-h-dvh">
      <Header domain={domain} onDomainChange={handleDomainChange} countdown={countdown} title={title} onExport={exportNames} onImport={importNames} />

      <main className="flex flex-1 min-h-0 flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab} onTabChange={setActiveTab}
          robots={robots} robotStatus={robotStatus} selectedRobotMac={selectedRobotMac} onSelectRobot={selectRobot}
          wifiDevices={wifiDevices} wifiStatus={wifiStatus} selectedWifiMac={selectedWifiMac} onSelectWifi={selectWifi}
          apiStatus={apiStatus} apiStatusError={apiStatusError}
          getDeviceName={getDeviceName} renameDevice={renameDevice} togglePin={togglePin} isPinned={isPinned}
        />

        <section className="flex-1 flex flex-col min-w-0 p-3 md:p-4">
          <div className="text-xs font-semibold text-text-muted mb-2 leading-snug">Logs — {selectedLabel}</div>

          {selectedRobotMac && (
            <RobotControls onCommand={handleRobotCommand} onStop={handleStop} onOta={handleOta} feedback={controlFeedback} />
          )}

          {selectedWifiMac && (
            <WifiControls timer={wifiTimer} onTimerChange={setWifiTimer} onAction={handleWifiAction} feedback={wifiFeedback} />
          )}

          <StatsPanel data={stats} />
          <LogsPanel logs={logs} loading={loading} error={error} />

          {selectedRobotMac && <CameraFeed apiBase={apiBase} ts={cameraTs} />}
        </section>
      </main>
    </div>
  )
}
