import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://192.168.4.113',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  base: '/cmms/'
})