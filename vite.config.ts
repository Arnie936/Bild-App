import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // For local development only - production uses Vercel serverless function
  const n8nBaseUrl = env.N8N_BASE_URL || 'http://localhost:5678'
  const webhookPath = env.N8N_WEBHOOK_PATH || '/webhook/test'

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/webhook': {
          target: n8nBaseUrl,
          changeOrigin: true,
          secure: true,
          rewrite: () => webhookPath,
        },
      },
    },
  }
})
