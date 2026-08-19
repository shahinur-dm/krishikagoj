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

const app = express()

app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  })
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

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Server error' })
})

const globalCache = globalThis.__kkMongo || { conn: null, promise: null }
globalThis.__kkMongo = globalCache

export async function connectDb() {
  if (globalCache.conn && mongoose.connection.readyState === 1) {
    return globalCache.conn
  }

  if (!globalCache.promise) {
    const uri = process.env.MONGODB_URI
    if (!uri) throw new Error('MONGODB_URI is required')

    globalCache.promise = mongoose
      .connect(uri, {
        maxPoolSize: 5,
        minPoolSize: 0,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 20000,
        bufferCommands: false,
        autoIndex: false,
      })
      .then((conn) => {
        console.log('MongoDB connected:', conn.connection.name)
        globalCache.conn = conn
        return conn
      })
      .catch((err) => {
        globalCache.promise = null
        throw err
      })
  }

  return globalCache.promise
}

export default app
