import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // C'est cette ligne qui autorise l'accès via IP
    port: 5173, // (Optionnel) Force le port 5173
  }
})
