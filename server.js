import http from 'node:http'
import https from 'node:https'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { handleLocalUdp } from './udp-relay.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = 3000
const ROBOT_API = 'https://server2.sudoyantra.com'
const DIST_DIR = path.join(__dirname, 'dist')
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
}

function serveFile(filePath, res) {
  const ext = path.extname(filePath)
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404)
      res.end('Not found')
      return
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' })
    res.end(data)
  })
}

function serveApp(res, pathname) {
  const indexFile = path.join(DIST_DIR, 'index.html')
  if (!fs.existsSync(indexFile)) {
    serveFile(path.join(__dirname, 'index.html'), res)
    return
  }

  let rel
  try {
    rel = decodeURIComponent(pathname).replace(/^\/Demo(?=\/|$)/, '').replace(/^\/+/, '')
  } catch {
    rel = ''
  }
  const candidate = path.resolve(DIST_DIR, rel || 'index.html')
  if (candidate !== indexFile && !candidate.startsWith(DIST_DIR + path.sep)) {
    res.writeHead(404)
    res.end('Not found')
    return
  }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : indexFile
  serveFile(file, res)
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
  // /api + upstream path → https://server2.sudoyantra.com + path
  // e.g. /api/wifi_view/view/MAC → https://server2.sudoyantra.com/wifi_view/view/MAC
  if (p.startsWith('/api/')) {
    proxy(req, res, p.replace(/^\/api/, ''))
    return
  }
  serveApp(res, p)
})

server.listen(PORT, (err) => {
  if (err) throw err
  console.log(`Robot Dashboard: http://localhost:${PORT}`)
  console.log(fs.existsSync(path.join(DIST_DIR, 'index.html')) ? 'Serving React build from dist/' : 'Serving legacy index.html (run npm run build for the React app)')
  console.log(`Proxying /api/* → ${ROBOT_API}`)
  console.log('Local UDP relay: POST /local/udp?ip=<robot-ip>&cmd=<command> → robot:8888')
})
