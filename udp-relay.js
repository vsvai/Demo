import dgram from 'node:dgram'

export const UDP_PORT = 8888

const START_TARGETS = new Set(['LEFT', 'RIGHT', 'FORWARD', 'BACKWARD', 'GO_FORWARD', 'GO_BACKWARD', 'STOP'])
const MOVE_TARGETS = new Set(['LEFT', 'RIGHT', 'FORWARD', 'BACKWARD', 'GO_FORWARD', 'GO_BACKWARD', 'STOP'])
const BOOL_SETTINGS = new Set(['SET:HOME_RIGHT', 'SET:OVERRIDE', 'SET:NIGHT_SLEEP'])

const RANGE_SETTINGS = {
  'SET:DRIVE_PWM': [0, 255],
  'SET:BRUSH_PWM': [0, 255],
  'SET:ZERO_PWM': [0, 255],
  'SET:RTC_HOUR': [0, 23],
  'SET:RTC_MINUTE': [0, 59],
  'SET:LOW_VOLTAGE': [21, 26],
  'SET:MAX_RUN_TIME': [1000, 600000],
}

const EXACT_COMMANDS = new Set([
  'GET:SETTINGS',
  'STOP',
  'RESET',
  'CURRENT_REF:RESET',
  'MOSFET:ON',
  'MOSFET:OFF',
  'NIGHT_SLEEP:ON',
  'NIGHT_SLEEP:OFF',
])

const socket = dgram.createSocket('udp4')
socket.unref()

export function isValidIp(value) {
  const parts = String(value || '').split('.')
  return parts.length === 4 && parts.every((p) => /^\d{1,3}$/.test(p) && Number(p) <= 255)
}

export function normalizeCommand(value) {
  const cmd = String(value || '').trim().toUpperCase()
  if (!cmd || /[\x00-\x1F\x7F]/.test(cmd)) return null

  if (EXACT_COMMANDS.has(cmd)) return cmd

  if (BOOL_SETTINGS.has(cmd.split(':').slice(0, 2).join(':'))) {
    return cmd.endsWith(':TRUE') || cmd.endsWith(':FALSE') ? cmd : null
  }

  const prefix = cmd.slice(0, cmd.lastIndexOf(':'))
  const arg = cmd.slice(cmd.lastIndexOf(':') + 1)
  if (RANGE_SETTINGS[prefix]) {
    const [min, max] = RANGE_SETTINGS[prefix]
    const n = Number(arg)
    return Number.isInteger(n) && n >= min && n <= max ? cmd : null
  }

  if (cmd.startsWith('SET:ROBOT_ID:')) return arg.length > 0 ? cmd : null
  if (cmd.startsWith('START:')) return START_TARGETS.has(arg) ? cmd : null

  const move = cmd.match(/^MOVE:([A-Z_]+):(\d+)$/)
  if (move) {
    const ms = Number(move[2])
    return MOVE_TARGETS.has(move[1]) && ms >= 1 && ms <= 600000 ? cmd : null
  }

  if (cmd.startsWith('OTA:')) {
    try {
      const url = new URL(cmd.slice(4))
      return url.protocol === 'http:' || url.protocol === 'https:' ? cmd : null
    } catch { return null }
  }

  return null
}

export function sendUdpCommand(ip, command) {
  const cmd = normalizeCommand(command)
  if (!isValidIp(ip)) return Promise.reject(new Error('Invalid robot IP'))
  if (!cmd) return Promise.reject(new Error('Invalid command'))

  const payload = Buffer.from(cmd, 'ascii')
  return new Promise((resolve, reject) => {
    socket.send(payload, 0, payload.length, UDP_PORT, ip, (err) => {
      if (err) reject(err)
      else resolve(cmd)
    })
  })
}

export async function handleLocalUdp(req, res) {
  const u = new URL(req.url || '/', 'http://localhost')
  if (u.pathname !== '/local/udp') return false

  const send = (status, text) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' })
    res.end(text)
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    send(405, 'Method not allowed')
    return true
  }

  try {
    const cmd = await sendUdpCommand(u.searchParams.get('ip'), u.searchParams.get('cmd'))
    send(200, 'UDP OK: ' + cmd)
  } catch (e) {
    send(400, e.message || 'UDP send failed')
  }
  return true
}
