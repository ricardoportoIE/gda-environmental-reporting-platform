import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:8000', '/health': 'http://localhost:8000' },
  },
  test: {
    environment: 'node',
    fileParallelism: false,
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/types.ts', 'src/vite-env.d.ts'],
      reporter: ['text-summary', 'html', 'lcov'],
      thresholds: { statements: 70, branches: 70, functions: 55, lines: 70 },
    },
  },
})
