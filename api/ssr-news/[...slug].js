import { connectDb } from '../../server/app.js'
import { renderArticleOgHtml } from '../../server/utils/ssrOgMeta.js'

function slugFromRequest(req) {
  const raw = req.query?.slug
  if (Array.isArray(raw) && raw.length) {
    const last = raw.filter(Boolean).pop()
    return String(last || '')
  }
  if (raw) return String(raw)
  const url = `${req.url || ''} ${req.headers?.['x-invoke-path'] || ''} ${req.headers?.['x-vercel-original-url'] || ''} ${req.headers?.['x-matched-path'] || ''}`
  const hex = String(url).match(/[0-9a-fA-F]{24}/)?.[0]
  if (hex) return hex
  const match = url.match(/\/(?:ssr-news|news|articles\/og)\/([^?#\s]+)/)
  if (!match) return ''
  try {
    return decodeURIComponent(match[1].split('/')[0])
  } catch {
    return match[1].split('/')[0]
  }
}

export default async function handler(req, res) {
  try {
    await connectDb()
    const slug = slugFromRequest(req)
    if (!slug) {
      res.statusCode = 302
      res.setHeader('Location', '/')
      res.end()
      return
    }
    return await renderArticleOgHtml(req, res, slug)
  } catch (err) {
    console.error('ssr-news handler:', err)
    res.statusCode = 302
    res.setHeader('Location', '/')
    res.end()
  }
}
