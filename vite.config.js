import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/ALJ_Jonage_Escalade/', // Le nom de votre dépôt GitHub
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
