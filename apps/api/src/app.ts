import express from 'express'
import cors from 'cors'
import authRoutes from './routes/auth.routes'
import projectRoutes from './routes/project.routes'
import taskRoutes from './routes/task.routes'
import { errorHandler } from './middleware/auth.middleware'
import testRoutes from './routes/test.routes'

export function createApp() {
  const app = express()

  app.use(cors())
  app.use(express.json())

  // Health check
  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  // Routes
  app.use('/api/auth', authRoutes)
  app.use('/api/projects', projectRoutes)
  app.use('/api/tasks', taskRoutes)
  app.use('/api/test', testRoutes)

  // Error handler (must be last)
  app.use(errorHandler)

  return app
}
