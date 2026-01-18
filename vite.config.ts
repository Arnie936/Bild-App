import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure your n8n webhook URL here
const N8N_BASE_URL = 'https://your-n8n-instance.com'
const WEBHOOK_PATH = '/webhook/your-webhook-id'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/webhook': {
        target: N8N_BASE_URL,
        changeOrigin: true,
        secure: true,
        rewrite: () => WEBHOOK_PATH,
      },
    },
  },
})
