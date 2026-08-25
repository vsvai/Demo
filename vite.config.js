import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
