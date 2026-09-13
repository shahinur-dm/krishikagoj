import app, { connectDb } from '../../server/app.js'
import { renderArticleOgHtml } from '../../server/utils/ssrOgMeta.js'

export default async function handler(req, res) {
  const raw = req.query?.slug
  const slug = Array.isArray(raw) ? raw.filter(Boolean).join('/') : raw

  try {
    await connectDb()
  } catch (err) {
    console.error('DB connect failed:', err.message)
    return app(req, res)
  }

  if ((req.method === 'GET' || req.method === 'HEAD') && slug) {
    return renderArticleOgHtml(req, res, slug)
  }

  return app(req, res)
}
