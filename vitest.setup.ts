import path from 'node:path'
import { config as loadEnv } from 'dotenv'
import { afterEach, vi } from 'vitest'

loadEnv({ path: path.resolve(process.cwd(), 'apps/api/.env.test') })

afterEach(() => {
  vi.clearAllMocks()
})
