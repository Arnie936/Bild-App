import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/webhook': {
        target: 'https://n8n.srv804235.hstgr.cloud',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, '/webhook/83e0a46f-e95a-47ee-803f-a3823f8adc21'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('Proxy request to:', proxyReq.path)
          })
          proxy.on('proxyRes', (proxyRes) => {
            console.log('Proxy response status:', proxyRes.statusCode)
          })
          proxy.on('error', (err) => {
            console.error('Proxy error:', err)
          })
        },
      },
    },
  },
})
