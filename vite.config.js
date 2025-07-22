import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import { fileURLToPath, URL } from 'node:url'

// Get current directory for ES modules
const __dirname = fileURLToPath(new URL('.', import.meta.url))

// Check if certificates exist
const keyPath = __dirname + 'localhost-key.pem'
const certPath = __dirname + 'localhost.pem'
const certsExist = fs.existsSync(keyPath) && fs.existsSync(certPath)

let httpsConfig = true // Default basic HTTPS

if (certsExist) {
  httpsConfig = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath)
  }
  console.log('✅ Using custom certificates for HTTPS')
} else {
  console.log('⚠️  Using Vite default HTTPS (may cause certificate warnings)')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      fastRefresh: false
    })
  ],
  base: './',
  root: 'src',
  publicDir: '../public',

  build: {
    outDir: '../build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: __dirname + '/src/index.html',
        config: __dirname + '/src/config.html',
        mobile: __dirname + '/src/mobile.html'
      }
    }
  },
  server: {
    port: 8080,
    https: httpsConfig,
    host: 'localhost'
  }
}) 