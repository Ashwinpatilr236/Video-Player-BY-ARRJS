import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/Video-Player-by-ARRJS/',
  plugins: [react()],
})
