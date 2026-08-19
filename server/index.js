import 'dotenv/config'
import app, { connectDb } from './app.js'

const PORT = process.env.PORT || 5050

async function start() {
  await connectDb()
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
