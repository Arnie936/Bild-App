import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configure your n8n webhook URL here
const N8N_BASE_URL = 'https://n8n.srv804235.hstgr.cloud'
const WEBHOOK_PATH = '/webhook/83e0a46f-e95a-47ee-803f-a3823f8adc21'

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
