import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import Article from '../models/Article.js'
import Opinion from '../models/Opinion.js'
import { stripHtml } from './seoContent.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function getBaseHtml() {
  const candidates = [
    path.resolve(process.cwd(), 'dist', 'index.html'),
    path.resolve(process.cwd(), 'index.html'),
    path.resolve(__dirname, '../../dist/index.html'),
    path.resolve(__dirname, '../../index.html'),
  ]
  for (const p of candidates) {
    try {
      if (fs.existsSync(p)) {
        return fs.readFileSync(p, 'utf8')
      }
    } catch {}
  }
  return `<!doctype html><html lang="bn"><head><meta charset="UTF-8" /><title>কৃষিকাগজ</title></head><body><div id="root"></div></body></html>`
}

function escapeAttr(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export async function renderArticleOgHtml(req, res, idOrSlug) {
  try {
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
    let article = await Article.findOne(
      isId ? { _id: idOrSlug } : { slug: idOrSlug },
    ).lean()

    if (!article && isId) {
      const op = await Opinion.findById(idOrSlug).lean()
      if (op) {
        article = {
          _id: op._id,
          title: op.title,
          excerpt: op.details ? op.details.slice(0, 160) : '',
          body: op.details || '',
          image: op.image || '',
          slug: String(op._id),
        }
      }
    }

    const baseHtml = getBaseHtml()
    if (!article) {
      return res.status(200).type('html').send(baseHtml)
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'www.krishikagoj.com'
    const proto = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'http')
    const siteUrl = `${proto}://${host}`

    const siteName = 'কৃষিকাগজ'
    const activeTitle = article.title || siteName
    const pageTitle = `${activeTitle} | ${siteName}`
    const rawDesc =
      article.metaDescription ||
      article.excerpt ||
      article.shortHeadline ||
      stripHtml(article.body) ||
      'কৃষিকাগজ — বাংলাদেশের কৃষি খবর, ফসল, প্রাণিসম্পদ, মৎস্য, প্রযুক্তি ও কৃষকের কথা।'
    const desc = rawDesc.replace(/\s+/g, ' ').trim().slice(0, 200)
    const canonicalUrl = `${siteUrl}/news/${encodeURIComponent(article.slug || article._id)}`
    const rawImg = article.image || '/api/media/6a85e9c7821f3539c0aa9591'
    const imgUrl = rawImg.startsWith('http')
      ? rawImg
      : `${siteUrl}${rawImg.startsWith('/') ? '' : '/'}${rawImg}`

    let html = baseHtml

    // Title
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeAttr(pageTitle)}</title>`)

    // Description
    if (html.includes('name="description"')) {
      html = html.replace(
        /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
        `<meta name="description" content="${escapeAttr(desc)}" />`,
      )
    } else {
      html = html.replace(
        '</head>',
        `<meta name="description" content="${escapeAttr(desc)}" />\n</head>`,
      )
    }

    // Canonical
    if (html.includes('rel="canonical"')) {
      html = html.replace(
        /<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i,
        `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />`,
      )
    } else {
      html = html.replace(
        '</head>',
        `<link rel="canonical" href="${escapeAttr(canonicalUrl)}" />\n</head>`,
      )
    }

    // Strip existing static OG and Twitter tags to prevent duplicates
    html = html.replace(/<meta\s+(?:property="og:[^"]*"|name="twitter:[^"]*")\s+content="[^"]*"\s*\/?>\s*/gi, '')

    // Open Graph & Twitter meta tags to inject
    const dynamicTags = [
      `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
      `<meta property="og:type" content="article" />`,
      `<meta property="og:title" content="${escapeAttr(activeTitle)}" />`,
      `<meta property="og:description" content="${escapeAttr(desc)}" />`,
      `<meta property="og:url" content="${escapeAttr(canonicalUrl)}" />`,
      `<meta property="og:image" content="${escapeAttr(imgUrl)}" />`,
      `<meta property="og:image:secure_url" content="${escapeAttr(imgUrl)}" />`,
      `<meta name="twitter:card" content="summary_large_image" />`,
      `<meta name="twitter:title" content="${escapeAttr(activeTitle)}" />`,
      `<meta name="twitter:description" content="${escapeAttr(desc)}" />`,
      `<meta name="twitter:image" content="${escapeAttr(imgUrl)}" />`,
    ].join('\n    ')

    html = html.replace('</head>', `    ${dynamicTags}\n  </head>`)

    res.set('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
    return res.status(200).type('html').send(html)
  } catch (err) {
    console.error('SSR OG Meta Error:', err)
    return res.status(200).type('html').send(getBaseHtml())
  }
}
