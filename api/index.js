import app, { connectDb } from '../server/app.js'
import { extractNewsSlug, renderArticleOgHtml } from '../server/utils/ssrOgMeta.js'

async function handler(req, res) {
  try {
    await connectDb()
  } catch (err) {
    console.error('DB connect failed:', err.message)
    if (!res.headersSent) {
      res.status(500).json({
        ok: false,
        message: 'ডাটাবেস সংযোগ ব্যর্থ। Atlas cluster চালু আছে এবং Network Access-এ 0.0.0.0/0 আছে কিনা দেখুন।',
        error: err.message,
      })
    }
    return
  }

  const newsSlug = extractNewsSlug(req)
  if ((req.method === 'GET' || req.method === 'HEAD') && newsSlug) {
    return renderArticleOgHtml(req, res, newsSlug)
  }

  // Ensure req.url starts with /api so Express routes always match under Vercel serverless functions
  if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/news')) {
    req.url = `/api${req.url.startsWith('/') ? '' : '/'}${req.url}`
  }

  return app(req, res)
}

export default handler
