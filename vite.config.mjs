import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Builds the React app into ONE self-contained public/index.html (JS + CSS inlined),
// which server.js serves statically. Keeps the "single self-contained file" property
// the app relies on for offline use, while giving us a real Vite dev/build pipeline.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  publicDir: false,            // icons are inline data URIs; no static dir needed
  build: {
    outDir: 'public',
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
})
