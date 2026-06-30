import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      reporters: [
        'default',
        [
          'allure-vitest/reporter',
          {
            resultsDir: 'allure-results',
          },
        ],
      ],
      setupFiles: ['allure-vitest/setup'],
    },
  })
)
