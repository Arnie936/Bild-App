import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/webhook': {
        target: 'Deine URL',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api\/webhook/, 'Deine URL'),
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
