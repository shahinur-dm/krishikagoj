import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import categoriesRouter from './routes/categories.js'
import subcategoriesRouter from './routes/subcategories.js'
import articlesRouter from './routes/articles.js'
import settingsRouter from './routes/settings.js'
import authRouter from './routes/auth.js'
import dashboardRouter from './routes/dashboard.js'
import photosRouter from './routes/photos.js'
import videosRouter from './routes/videos.js'
import staffRouter from './routes/staff.js'
import websitesRouter from './routes/websites.js'
import adsRouter from './routes/ads.js'
import homeRouter from './routes/home.js'
import uploadRouter from './routes/upload.js'
import seoRouter from './routes/seo.js'
import breakingRouter from './routes/breaking.js'
import usersRouter from './routes/users.js'
import opinionsRouter from './routes/opinions.js'
import pollsRouter from './routes/polls.js'
import surveysRouter from './routes/surveys.js'
import pagesRouter from './routes/pages.js'
import aiSettingsRouter from './routes/aiSettings.js'
import layoutTopicsRouter from './routes/layoutTopics.js'
import translateRouter from './routes/translate.js'
import { renderArticleOgHtml } from './utils/ssrOgMeta.js'

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.get(['/news/:idOrSlug', '/api/news/:idOrSlug'], async (req, res) => {
  await connectDb()
  return renderArticleOgHtml(req, res, req.params.idOrSlug)
})

app.use((req, _res, next) => {
  if (req.url && (req.url.startsWith('/news') || req.url.startsWith('/api/news'))) {
    return next()
  }
  if (req.url && !req.url.startsWith('/api')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`
  }
  next()
})

app.get('/api/health', async (_req, res) => {
  try {
    await connectDb()
    res.json({
      ok: true,
      db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    })
  } catch (err) {
    res.status(500).json({
      ok: false,
      db: 'disconnected',
      error: err.message,
    })
  }
})

app.use('/api/home', homeRouter)
app.use('/api/upload', uploadRouter)
app.use('/api/media', uploadRouter)
app.use('/api/seo', seoRouter)
app.use('/api/auth', authRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/subcategories', subcategoriesRouter)
app.use('/api/articles', articlesRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/photos', photosRouter)
app.use('/api/videos', videosRouter)
app.use('/api/staff', staffRouter)
app.use('/api/websites', websitesRouter)
app.use('/api/ads', adsRouter)
app.use('/api/breaking', breakingRouter)
app.use('/api/users', usersRouter)
app.use('/api/opinions', opinionsRouter)
app.use('/api/polls', pollsRouter)
app.use('/api/surveys', surveysRouter)
app.use('/api/pages', pagesRouter)
app.use('/api/ai-settings', aiSettingsRouter)
app.use('/api/layout-topics', layoutTopicsRouter)
app.use('/api/translate', translateRouter)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Server error' })
})

const globalCache = globalThis.__kkMongo || { conn: null, promise: null }
globalThis.__kkMongo = globalCache

let lastDbError = null

function formatMongoUri(raw) {
  if (!raw) return ''
  let cleaned = String(raw).trim().replace(/^["']|["']$/g, '').trim()
  try {
    const match = cleaned.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):([^@]+)@(.+)$/)
    if (match) {
      const [, proto, user, pass, rest] = match
      const encodedUser = encodeURIComponent(decodeURIComponent(user))
      const encodedPass = encodeURIComponent(decodeURIComponent(pass))
      return `${proto}${encodedUser}:${encodedPass}@${rest}`
    }
  } catch {}
  return cleaned
}

export async function connectDb() {
  const state = mongoose.connection.readyState
  if (state === 1) {
    globalCache.conn = mongoose
    lastDbError = null
    return mongoose
  }

  if (state === 0 || state === 3) {
    globalCache.conn = null
    globalCache.promise = null
  }

  if (!globalCache.promise) {
    const rawUri = process.env.MONGODB_URI
    if (!rawUri) {
      lastDbError = 'MONGODB_URI environment variable is missing'
      throw new Error(lastDbError)
    }
    const uri = formatMongoUri(rawUri)

    globalCache.promise = mongoose
      .connect(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
        bufferCommands: false,
        autoIndex: false,
      })
      .then((conn) => {
        console.log('MongoDB connected:', conn.connection.name)
        globalCache.conn = conn
        lastDbError = null
        return conn
      })
      .catch((err) => {
        globalCache.promise = null
        globalCache.conn = null
        lastDbError = err.message
        throw err
      })
  }

  return globalCache.promise
}

export default app
