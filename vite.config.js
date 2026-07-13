import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/Basic_Robot_DashBoard_HUL/',
  server: {
    proxy: {
      '/api': {
        target: 'https://server2.sudoyantra.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
