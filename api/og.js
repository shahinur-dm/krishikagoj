import { connectDb } from '../server/app.js'
import { renderArticleOgHtml } from '../server/utils/ssrOgMeta.js'

function readSlug(req) {
  const q = req.query || {}
  const raw = q.slug || q.__newsSlug
  if (Array.isArray(raw)) return raw.filter(Boolean).join('/')
  return raw ? String(raw) : ''
}

export default async function handler(req, res) {
  const slug = readSlug(req)
  if (!slug || req.method === 'POST') {
    const app = (await import('../server/app.js')).default
    return app(req, res)
  }

  try {
    await connectDb()
  } catch (err) {
    console.error('OG DB connect failed:', err.message)
    const app = (await import('../server/app.js')).default
    return app(req, res)
  }

  return renderArticleOgHtml(req, res, slug)
}
