import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:5050',
      '/news': 'http://127.0.0.1:5050',
    },
    warmup: {
      clientFiles: [
        './src/pages/HomePage.jsx',
        './src/components/CategorySection.jsx',
        './src/components/LeadSection.jsx',
        './src/styles/global.css',
      ],
    },
  },
})
