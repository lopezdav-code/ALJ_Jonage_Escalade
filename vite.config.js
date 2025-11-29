import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: '/ALJ_Jonage_Escalade/', // Le nom de votre dépôt GitHub
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name]-${Date.now()}.js`,
          chunkFileNames: `assets/[name]-${Date.now()}.js`,
          assetFileNames: `assets/[name]-${Date.now()}.[ext]`
        }
      }
    },
    publicDir: 'public',
    server: {
      proxy: {
        '/api-helloasso': {
          target: env.VITE_HELLOASSO_API_URL || 'https://api.helloasso.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-helloasso/, ''),
        },
      },
    },
  }
})
