import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['shared/**/*.{test,spec}.{ts,tsx}', 'apps/**/*.{test,spec}.{ts,tsx}'],
    alias: {
      '@directhire/shared': path.resolve(__dirname, './shared'),
    },
    deps: {
      inline: ['framer-motion'],
    },
  },
  resolve: {
    alias: {
      '@directhire/shared': path.resolve(__dirname, './shared'),
    },
  },
})
