import { Router } from 'express'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import PhotoGallery from '../models/PhotoGallery.js'
import VideoGallery from '../models/VideoGallery.js'
import SiteSetting from '../models/SiteSetting.js'
import ImportantWebsite from '../models/ImportantWebsite.js'
import Staff from '../models/Staff.js'
import Ad from '../models/Ad.js'
import { ensureDemoAds, slimAd, isLive } from './ads.js'
import { cacheGet, cacheSet } from '../utils/cache.js'

const router = Router()
const CACHE_KEY = 'home:v32'
const CACHE_TTL = 180_000

const SLIM =
  'title titleEn slug excerpt excerptEn image author views featured headline latest popular bigthumbnail publishedAt category'

function thumb(url, w = 480) {
  if (!url || typeof url !== 'string') return url || ''
  if (url.includes('res.cloudinary.com')) {
    const parts = url.split('/upload/')
    if (parts.length === 2) {
      return `${parts[0]}/upload/f_auto,q_auto,w_${w},c_fill,g_auto/${parts[1]}`
    }
  }
  if (url.includes('images.unsplash.com')) {
    const base = url.split('?')[0]
    return `${base}?auto=format&fit=crop&w=${w}&h=${Math.round(w * 0.66)}&q=70`
  }
  return url
}

function ytThumb(embed) {
  if (!embed) return ''
  const m = String(embed).match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : ''
}

function slimArticle(a, imageW = 480) {
  if (!a) return a
  return {
    _id: a._id,
    title: a.title,
    titleEn: a.titleEn || '',
    slug: a.slug,
    excerpt: (a.excerpt || '').slice(0, 100),
    excerptEn: (a.excerptEn || '').slice(0, 100),
    image: thumb(a.image, imageW),
    author: a.author,
    views: a.views || 0,
    featured: !!a.featured,
    headline: !!a.headline,
    latest: !!a.latest,
    popular: !!a.popular,
    bigthumbnail: !!a.bigthumbnail,
    publishedAt: a.publishedAt,
    category: a.category
      ? { _id: a.category._id, name: a.category.name, nameEn: a.category.nameEn || '', slug: a.category.slug }
      : null,
  }
}

function slimSettings(s) {
  if (!s) return null
  return {
    siteName: s.siteName,
    homepageLayout: s.homepageLayout,
    tagline: s.tagline,
    hotline: s.hotline,
    notice: s.notice,
    logo: s.logo,
    email: s.email,
    phoneBn: s.phoneBn,
    addressBn: s.addressBn,
    addressEn: s.addressEn,
    phoneEn: s.phoneEn,
    aboutUs: (s.aboutUs || '').slice(0, 220),
    facebookPage: s.facebookPage,
    themeColor: s.themeColor,
    liveTvLink: s.liveTvLink || '',
    liveTvEmbed: s.liveTvEmbed || '',
    chiefAdvisor: s.chiefAdvisor,
    publisher: s.publisher,
    managingEditor: s.managingEditor,
    social: s.social,
    namaz: s.namaz,
    seo: s.seo
      ? {
          metaTitle: s.seo.metaTitle || '',
          metaDescription: s.seo.metaDescription || '',
          metaKeyword: s.seo.metaKeyword || '',
          metaAuthor: s.seo.metaAuthor || '',
          googleAnalytics: s.seo.googleAnalytics || '',
          googleVerification: s.seo.googleVerification || '',
          ogImage: s.seo.ogImage || '',
          horizontal1: s.seo.horizontal1 || '',
          horizontal2: s.seo.horizontal2 || '',
          horizontal3: s.seo.horizontal3 || '',
          horizontalBig1: s.seo.horizontalBig1 || '',
          bottomPopup: s.seo.bottomPopup || '',
          vertical: s.seo.vertical || '',
        }
      : null,
    favicon: s.favicon || s.logo || '/logo.png',
  }
}

router.get('/', async (_req, res) => {
  try {
    const cached = cacheGet(CACHE_KEY)
    if (cached) {
      res.set('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60')
      res.set('X-Cache', 'HIT')
      return res.json(cached)
    }

    try {
      await ensureDemoAds()
    } catch (err) {
      console.warn('ensureDemoAds failed:', err.message)
    }

    const [
      categories,
      articles,
      popularFlagged,
      popularByViews,
      photos,
      videos,
      settings,
      websites,
      staff,
    ] = await Promise.all([
      Category.find({ isActive: true }).select('name nameEn slug order').sort({ order: 1, name: 1 }).lean(),
      Article.find({ isPublished: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .sort({ publishedAt: -1 })
        .limit(120)
        .lean(),
      Article.find({ isPublished: true, popular: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .sort({ publishedAt: -1 })
        .limit(20)
        .lean(),
      Article.find({ isPublished: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .sort({ views: -1 })
        .limit(20)
        .lean(),
      PhotoGallery.find().select('title photo type').sort({ createdAt: -1 }).limit(4).lean(),
      VideoGallery.find()
        .select('title embedCode thumbnail type')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      SiteSetting.findOne({ key: 'site' })
        .select(
          'siteName tagline hotline notice logo favicon email phoneBn addressBn aboutUs facebookPage liveTvLink liveTvEmbed chiefAdvisor publisher managingEditor social namaz seo themeColor homepageLayout homepageSlots',
        )
        .lean(),
      ImportantWebsite.find({ isActive: { $ne: false } })
        .select('websiteName websiteLink order')
        .sort({ order: 1 })
        .limit(12)
        .lean(),
      Staff.find({ isActive: { $ne: false }, type: { $in: ['Staff', 'Management'] } })
        .select('name designation image link type order')
        .sort({ order: 1 })
        .limit(8)
        .lean(),
    ])

    let ads = []
    try {
      ads = await Ad.find({ isActive: { $ne: false } })
        .sort({ position: 1, order: 1, createdAt: -1 })
        .lean()
    } catch (err) {
      console.warn('ads query failed:', err.message)
    }

    const slimArts = articles.map((a, i) => slimArticle(a, i === 0 ? 800 : 400))
    const popularSource = popularFlagged.length ? popularFlagged : popularByViews
    const popular = popularSource.map((a) => slimArticle(a, 400))
    const contentCats = categories.filter((c) => c.slug && c.slug !== 'home')

    const headlines = slimArts.filter((a) => a.headline).slice(0, 16)
    const featured = slimArts.filter((a) => a.featured).slice(0, 16)
    const latest = slimArts.filter((a) => a.latest).slice(0, 30)
    const bigThumb = slimArts.find((a) => a.bigthumbnail)

    const byCategory = {}
    for (const cat of contentCats) byCategory[cat.slug] = []
    for (const article of slimArts) {
      const slug = article.category?.slug
      if (!slug || !byCategory[slug] || byCategory[slug].length >= 9) continue
      byCategory[slug].push(article)
    }

    // Prefer bigthumbnail as lead if present
    let featuredOut = featured.length ? featured : (headlines.length ? headlines : latest).slice(0, 16)
    if (bigThumb && featuredOut[0]?._id !== bigThumb._id) {
      featuredOut = [bigThumb, ...featuredOut.filter((a) => a._id !== bigThumb._id)].slice(0, 16)
    }

    const byId = new Map(slimArts.map((a) => [String(a._id), a]))
    popular.forEach((a) => byId.set(String(a._id), a))

    const slots = settings?.homepageSlots || {}
    const wantedIds = [
      slots.lead,
      ...(slots.grid || []),
      ...(slots.mid || []),
      slots.story,
      ...(slots.storyList || []),
    ]
      .map((id) => String(id || '').trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))

    const missing = [...new Set(wantedIds)].filter((id) => !byId.has(id))
    if (missing.length) {
      const extra = await Article.find({ _id: { $in: missing }, isPublished: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .lean()
      extra.forEach((a) => byId.set(String(a._id), slimArticle(a, 400)))
    }

    const pickSlot = (id) => {
      const key = String(id || '').trim()
      return key && byId.get(key) ? byId.get(key) : null
    }

    const hasManualSlots = wantedIds.length > 0
    const leadLayout = hasManualSlots
      ? {
          lead: pickSlot(slots.lead),
          grid: Array.from({ length: 9 }, (_, i) => pickSlot((slots.grid || [])[i])),
          mid: Array.from({ length: 8 }, (_, i) => pickSlot((slots.mid || [])[i])),
          story: pickSlot(slots.story),
          storyList: Array.from({ length: 8 }, (_, i) => pickSlot((slots.storyList || [])[i])),
        }
      : null

    const payload = {
      categories,
      headlines: headlines.length ? headlines : slimArts.slice(0, 16),
      featured: featuredOut.length ? featuredOut : slimArts.slice(0, 16),
      latest: latest.length >= 12 ? latest : slimArts.slice(0, 40),
      popular: popular.length ? popular : slimArts.slice(0, 16),
      recent: slimArts.slice(0, 40),
      leadLayout,
      byCategory,
      photos: photos.map((p) => ({ ...p, photo: thumb(p.photo, 400) })),
      videos: videos.map((v) => ({
        _id: v._id,
        title: v.title,
        embedCode: v.embedCode,
        thumbnail: thumb(v.thumbnail || '', 400) || ytThumb(v.embedCode),
        type: v.type,
      })),
      websites,
      staff,
      ads: (ads || []).filter((a) => isLive(a)).map(slimAd),
      settings: slimSettings(settings),
    }

    cacheSet(CACHE_KEY, payload, CACHE_TTL)
    res.set('Cache-Control', 'public, max-age=10, s-maxage=30, stale-while-revalidate=60')
    res.set('X-Cache', 'MISS')
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
