import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),basicSsl()],
  server: {
    // 🚀 Esto arregla el error de WebSocket
    hmr: {
      protocol: 'wss',
      host: 'localhost',
    },
  },
})
