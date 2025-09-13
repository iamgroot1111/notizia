import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main:    { entry: 'electron/main.ts', onstart: ({ startup }) => startup() },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
  server: {
    open: false,   // ← verhindert das automatische Öffnen im Browser
  },
})
