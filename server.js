import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleLocalUdp } from './udp-relay.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 3000
const ROBOT_API = 'https://server2.sudoyantra.com'

function serveFile(filePath, res) {
  const ext = path.extname(filePath)
  const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.ico': 'image/x-icon' }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

function proxy(req, res, targetPath) {
  const url = new URL(targetPath, ROBOT_API)
  const isHttps = url.protocol === 'https:'
  const client = isHttps ? https : http
  const opts = { hostname: url.hostname, port: url.port || (isHttps ? 443 : 80), path: url.pathname + url.search, method: req.method }
  const proxyReq = client.request(opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers)
    proxyRes.pipe(res)
  })
  proxyReq.on('error', (e) => {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'Proxy error', message: e.message }))
  })
  req.pipe(proxyReq)
}

const server = http.createServer((req, res) => {
  const u = new URL(req.url || '/', 'http://localhost')
  const p = u.pathname

  if (u.pathname.startsWith('/local/')) {
    handleLocalUdp(req, res)
    return
  }
  if (p === '/' || p === '/index.html') {
    serveFile(path.join(__dirname, 'index.html'), res)
    return
  }
  // /api + upstream path → https://server2.sudoyantra.com + path
  // e.g. /api/wifi_view/view/MAC → https://server2.sudoyantra.com/wifi_view/view/MAC
  if (p.startsWith('/api/')) {
    proxy(req, res, p.replace(/^\/api/, ''))
    return
  }
  res.writeHead(404)
  res.end('Not found')
})

server.listen(PORT, () => {
  console.log(`Robot Dashboard: http://localhost:${PORT}`)
  console.log(`Proxying /api/* → ${ROBOT_API} (includes /macs, /wifi_view/*, /wifi_api/* via /api/wifi_api/...)`)
  console.log('Local UDP relay: POST /local/udp?ip=<robot-ip>&cmd=<command> → robot:8888')
})
