import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { fileURLToPath } from 'url'
import path from 'path'
import login from './api/login.js'
import content from './api/content.js'
import messages from './api/messages.js'
import upload from './api/upload.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json({ limit: '12mb' }))
app.all('/api/login', (req, res) => login(req, res))
app.all('/api/content', (req, res) => content(req, res))
app.all('/api/messages', (req, res) => messages(req, res))
app.all('/api/upload', (req, res) => upload(req, res))
app.use(express.static(__dirname))

const port = Number(process.env.PORT || 5174)
createServer(app).listen(port, () => {
  console.log(`Portfolio http://localhost:${port}`)
  console.log(`Admin     http://localhost:${port}/admin/`)
})
