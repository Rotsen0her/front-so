import { defineConfig } from 'vite'

// El .env usa URL_API (sin prefijo VITE_), así que se expone también ese prefijo.
export default defineConfig({
  envPrefix: ['VITE_', 'URL_'],
})
