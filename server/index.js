import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import app, { connectDb } from './app.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../.env') })
dotenv.config()

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
