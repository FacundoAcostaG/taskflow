import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['apps/**/*.spec.ts', 'apps/**/*.test.ts'],
    exclude: [
      'e2e/**',
      'mobile/**',
      'apps/api/tests/*.integration.test.ts',
      'apps/web/tests/pact/**',
      '**/node_modules/**',
      '**/dist/**',
    ],
    reporters: [
      'default', // mantiene la salida en terminal
      [
        'allure-vitest/reporter',
        {
          // agrega el reporter de Allure
          resultsDir: 'allure-results',
        },
      ],
    ],
    setupFiles: ['allure-vitest/setup'],
  },
})
