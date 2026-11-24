import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleLocalUdp } from './udp-relay.js'

function localUdpRelay() {
  const attach = (server) => {
    server.middlewares.use((req, res, next) => {
      if (!req.url?.startsWith('/local/')) return next()
      handleLocalUdp(req, res).then((handled) => { if (!handled) next() })
    })
  }
  return { name: 'local-udp-relay', configureServer: attach, configurePreviewServer: attach }
}

export default defineConfig({
  plugins: [react(), localUdpRelay()],
  base: '/Demo/',
  server: {
    proxy: {
      '/api': {
        target: 'https://server2.sudoyantra.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/rtk': {
        target: 'http://server2.sudoyantra.com:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/rtk/, ''),
      },
    },
  },
})
