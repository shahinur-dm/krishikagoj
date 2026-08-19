import { Router } from 'express'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import SiteSetting from '../models/SiteSetting.js'

const router = Router()

function siteOrigin(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'krishi-kagos.vercel.app'
  return `${proto}://${host}`.replace(/\/$/, '')
}

router.get('/sitemap.xml', async (req, res) => {
  try {
    const origin = siteOrigin(req)
    const [articles, categories] = await Promise.all([
      Article.find({ isPublished: true })
        .select('slug _id updatedAt publishedAt')
        .sort({ publishedAt: -1 })
        .limit(2000)
        .lean(),
      Category.find({ isActive: true }).select('slug updatedAt').lean(),
    ])

    const urls = [
      { loc: `${origin}/`, priority: '1.0', changefreq: 'hourly' },
      { loc: `${origin}/search`, priority: '0.3', changefreq: 'weekly' },
      ...categories.map((c) => ({
        loc: `${origin}/category/${c.slug}`,
        lastmod: c.updatedAt,
        priority: '0.7',
        changefreq: 'daily',
      })),
      ...articles.map((a) => ({
        loc: `${origin}/news/${a.slug || a._id}`,
        lastmod: a.updatedAt || a.publishedAt,
        priority: '0.8',
        changefreq: 'weekly',
      })),
    ]

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map((u) => {
    const last = u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''
    return `  <url>
    <loc>${u.loc}</loc>
    ${last}
    <changefreq>${u.changefreq || 'weekly'}</changefreq>
    <priority>${u.priority || '0.5'}</priority>
  </url>`
  })
  .join('\n')}
</urlset>`

    res.set('Content-Type', 'application/xml; charset=utf-8')
    res.set('Cache-Control', 'public, max-age=600, s-maxage=1800')
    res.send(body)
  } catch (err) {
    res.status(500).type('text').send(`Sitemap error: ${err.message}`)
  }
})

router.get('/robots.txt', async (req, res) => {
  const origin = siteOrigin(req)
  const body = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /login
Disallow: /register

Sitemap: ${origin}/api/seo/sitemap.xml
`
  res.type('text/plain').set('Cache-Control', 'public, max-age=86400').send(body)
})

router.get('/snippets', async (_req, res) => {
  try {
    const s = await SiteSetting.findOne({ key: 'site' }).select('siteName tagline seo logo favicon').lean()
    res.json({
      siteName: s?.siteName || 'কৃষিকাগজ',
      tagline: s?.tagline || '',
      logo: s?.logo || '/logo.png',
      favicon: s?.favicon || '/logo.png',
      seo: s?.seo || {},
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
