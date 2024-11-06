import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,   // Set to `true` or use '0.0.0.0' to avoid using localhost
    // port: 5173,   // Default port; you can change this if needed
  },
})
