import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(),tailwindcss(),],

  server: {
    proxy: {
      // Proxy requests starting with /api to your backend server
      '/api': {
        target: 'http://localhost:8080', // Your Go backend address
        changeOrigin: true, // Needed for virtual hosted sites
        secure: false,      // If backend is not https
        // Optional: rewrite path if needed, but usually not necessary
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // Explicitly proxy WebSocket connections
      '/ws': {
        target: 'ws://localhost:8080', // Use ws:// protocol
        ws: true, // <-- IMPORTANT: Enable WebSocket proxying
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
