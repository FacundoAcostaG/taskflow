import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/*.spec.ts', 'apps/**/*.test.ts'],
    exclude: [
      'e2e/**',
      'mobile/**',
      // Estas suites requieren infraestructura dedicada y se corren
      // con scripts/workflows propios.
      'apps/api/tests/**/*.integration.test.ts',
      'apps/api/tests/pact/**',
      'apps/web/tests/pact/**',
      '**/node_modules/**',
      '**/dist/**',
    ],
  },
})
