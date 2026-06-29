import { createApp } from './app'

const PORT = process.env.PORT ?? 3001
const app = createApp()

app.listen(PORT, () => {
  process.stdout.write(`TaskFlow API running on http://localhost:${PORT}\n`)
})
