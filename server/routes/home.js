import { Router } from 'express'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import PhotoGallery from '../models/PhotoGallery.js'
import VideoGallery from '../models/VideoGallery.js'
import SiteSetting from '../models/SiteSetting.js'
import Subcategory from '../models/Subcategory.js'
import ImportantWebsite from '../models/ImportantWebsite.js'
import Staff from '../models/Staff.js'
import Ad from '../models/Ad.js'
import { ensureDemoAds, slimAd, isLive } from './ads.js'
import { cacheGet, cacheSet } from '../utils/cache.js'
import { isAdsGloballyEnabled } from '../utils/adsEnabled.js'
import BreakingNews from '../models/BreakingNews.js'
import Opinion from '../models/Opinion.js'
import LayoutTopic from '../models/LayoutTopic.js'
import { ensureDefaultLayoutTopics } from './layoutTopics.js'

const router = Router()
const CACHE_KEY = 'home:v43'
const CACHE_TTL = 5_000

const SLIM =
  'title titleEn slug excerpt excerptEn body bodyEn image author views featured headline latest popular bigthumbnail publishedAt category subcategory'

function extractText(htmlOrText, maxLen = 800) {
  if (!htmlOrText) return ''
  const clean = String(htmlOrText)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim()
  return clean.slice(0, maxLen)
}

function getFullDescription(excerpt, body, maxLen = 700) {
  const cleanExcerpt = extractText(excerpt, maxLen)
  const cleanBody = extractText(body, maxLen)
  if (!cleanExcerpt && !cleanBody) return ''
  if (!cleanBody) return cleanExcerpt
  if (!cleanExcerpt) return cleanBody
  if (cleanBody.startsWith(cleanExcerpt) || cleanBody.includes(cleanExcerpt)) {
    return cleanBody
  }
  return `${cleanExcerpt} ${cleanBody}`.slice(0, maxLen)
}

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
  const rawBn = getFullDescription(a.excerpt, a.body, 700)
  const rawEn = getFullDescription(a.excerptEn, a.bodyEn, 700)
  return {
    _id: a._id,
    title: a.title,
    titleEn: a.titleEn || '',
    slug: a.slug,
    excerpt: rawBn,
    excerptEn: rawEn,
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
    subcategory: a.subcategory
      ? {
          _id: a.subcategory._id || a.subcategory,
          slug: a.subcategory.slug || '',
          nameBn: a.subcategory.nameBn || '',
        }
      : null,
  }
}

function isOid(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || '').trim())
}

async function buildTopicGrid(settings) {
  const limit = Math.min(16, Math.max(1, Number(settings?.topicGridLimit) || 8))
  const topics = await Subcategory.find({ isActive: { $ne: false }, showOnHome: true })
    .populate('category', 'name nameEn slug')
    .sort({ homeOrder: 1, order: 1, nameBn: 1 })
    .limit(limit)
    .lean()
  if (!topics.length) return []

  const pickedIds = []
  topics.forEach((topic) => {
    if (isOid(topic.homeFeatured)) pickedIds.push(String(topic.homeFeatured).trim())
    ;(topic.homeSecondary || []).forEach((id) => {
      if (isOid(id)) pickedIds.push(String(id).trim())
    })
  })

  const extra = await Article.find({
    isPublished: true,
    $or: [{ subcategory: { $in: topics.map((topic) => topic._id) } }, { _id: { $in: pickedIds } }],
  })
    .select(SLIM)
    .populate('category', 'name nameEn slug')
    .populate('subcategory', 'nameBn slug')
    .sort({ publishedAt: -1 })
    .lean()

  const byId = new Map(extra.map((article) => [String(article._id), slimArticle(article, 400)]))
  const bySub = {}
  extra.forEach((article) => {
    const sid = String(article.subcategory?._id || article.subcategory || '')
    if (!sid) return
    if (!bySub[sid]) bySub[sid] = []
    bySub[sid].push(slimArticle(article, 400))
  })

  return topics
    .map((topic) => {
      const used = new Set()
      const items = []
      const push = (id) => {
        const art = byId.get(String(id || '').trim())
        if (!art) return
        const key = String(art._id)
        if (used.has(key)) return
        used.add(key)
        items.push(art)
      }
      push(topic.homeFeatured)
      ;(topic.homeSecondary || []).forEach(push)
      ;(bySub[String(topic._id)] || []).forEach((art) => {
        if (items.length >= 8) return
        push(art._id)
      })
      if (!items.length) return null
      return {
        _id: topic._id,
        nameBn: topic.nameBn,
        nameEn: topic.nameEn || '',
        slug: topic.slug,
        parentSlug: topic.category?.slug || settings?.topicGridSlug || 'motso',
        hasSub: true,
        items,
      }
    })
    .filter(Boolean)
}

function slimSettings(s) {
  if (!s) return null
  return {
    siteName: s.siteName,
    breakingTitle: s.breakingTitle || s.breakingTitleBn || '',
    breakingTitleBn: s.breakingTitleBn || s.breakingTitle || '',
    breakingTitleEn: s.breakingTitleEn || '',
    homepageLayout: s.homepageLayout,
    homepageSlots: s.homepageSlots || null,
    sectionSlots: s.sectionSlots || {},
    sectionSidebars: s.sectionSidebars || {},
    discussedConfig: s.discussedConfig || {},
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
    adsEnabled: isAdsGloballyEnabled(s),
    ads_enabled: isAdsGloballyEnabled(s),
    topicGridLimit: Number(s.topicGridLimit) > 0 ? Number(s.topicGridLimit) : 8,
    topicGridSlug: s.topicGridSlug || 'motso',
  }
}

router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    const bust = Boolean(req.query.bust)
    const cached = bust ? null : cacheGet(CACHE_KEY)
    if (cached) {
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
      breakingNews,
      opinions,
      layoutTopics,
    ] = await Promise.all([
      Category.find({ isActive: true }).select('name nameEn slug order').sort({ order: 1, name: 1 }).lean(),
      Article.find({ isPublished: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .populate('subcategory', 'nameBn slug')
        .sort({ publishedAt: -1 })
        .limit(160)
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
      PhotoGallery.find().select('title photo type').sort({ createdAt: -1 }).limit(12).lean(),
      VideoGallery.find()
        .select('title embedCode thumbnail type')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      SiteSetting.findOne({ key: 'site' })
        .select(
          'siteName tagline hotline notice logo favicon email phoneBn addressBn addressEn phoneEn aboutUs facebookPage liveTvLink liveTvEmbed chiefAdvisor publisher managingEditor social namaz seo themeColor homepageLayout homepageSlots sectionSlots sectionSidebars discussedConfig adsEnabled topicGridLimit topicGridSlug breakingTitle breakingTitleBn breakingTitleEn',
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
      BreakingNews.find({ isActive: { $ne: false }, status: 'published' })
        .select('titleBn titleEn order publishedAt')
        .sort({ order: 1, publishedAt: -1 })
        .limit(20)
        .lean(),
      Opinion.find({ status: 'published', isActive: { $ne: false } })
        .select('name title details image createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      LayoutTopic.find({ isActive: { $ne: false } })
        .populate('category', 'name nameEn slug')
        .populate('subcategory', 'nameBn nameEn slug')
        .sort({ order: 1, createdAt: 1 })
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

    const gridSlug = settings?.topicGridSlug || 'motso'
    const byCategory = {}
    for (const cat of contentCats) byCategory[cat.slug] = []
    for (const article of slimArts) {
      const slug = article.category?.slug
      const cap = slug === gridSlug ? 32 : 9
      if (!slug || !byCategory[slug] || byCategory[slug].length >= cap) continue
      byCategory[slug].push(article)
    }

    const sectionSlots = settings?.sectionSlots && typeof settings.sectionSlots === 'object'
      ? settings.sectionSlots
      : {}
    const extraIds = []
    for (const slug of Object.keys(byCategory)) {
      const ids = (sectionSlots[slug]?.items || sectionSlots[slug] || [])
        .map((id) => String(id || '').trim())
        .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))
      ids.forEach((id) => extraIds.push(id))
    }
    const known = new Map(slimArts.map((a) => [String(a._id), a]))
    const need = [...new Set(extraIds)].filter((id) => !known.has(id))
    if (need.length) {
      const extra = await Article.find({ _id: { $in: need }, isPublished: true })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .lean()
      extra.forEach((a) => known.set(String(a._id), slimArticle(a, 400)))
    }
    for (const slug of Object.keys(byCategory)) {
      const ids = (sectionSlots[slug]?.items || sectionSlots[slug] || [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
      if (!ids.length) continue
      const used = new Set()
      const next = []
      ids.forEach((id) => {
        const item = known.get(id)
        if (item && !used.has(id)) {
          next.push(item)
          used.add(id)
        }
      })
      ;(byCategory[slug] || []).forEach((item) => {
        const id = String(item._id)
        if (!used.has(id)) next.push(item)
      })
      byCategory[slug] = next.slice(0, slug === gridSlug ? 32 : 12)
    }

    const safolloCat = contentCats.find((c) => c.slug === 'safollo')
    if (safolloCat && (byCategory.safollo?.length || 0) < 7) {
      const moreSafollo = await Article.find({
        isPublished: true,
        category: safolloCat._id,
      })
        .select(SLIM)
        .populate('category', 'name nameEn slug')
        .sort({ publishedAt: -1 })
        .limit(7)
        .lean()
      const have = new Set((byCategory.safollo || []).map((a) => String(a._id)))
      if (!byCategory.safollo) byCategory.safollo = []
      for (const article of moreSafollo) {
        if (byCategory.safollo.length >= 7) break
        const id = String(article._id)
        if (have.has(id)) continue
        byCategory.safollo.push(slimArticle(article, 400))
        have.add(id)
      }
    }

    let topicGrid = []
    try {
      topicGrid = await buildTopicGrid(settings)
    } catch (err) {
      console.warn('topicGrid failed:', err.message)
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
      topicGrid,
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
      ads: isAdsGloballyEnabled(settings) ? (ads || []).filter((a) => isLive(a)).map(slimAd) : [],
      settings: slimSettings(settings),
      breakingNews: (breakingNews || []).map((b) => ({
        _id: b._id,
        titleBn: b.titleBn,
        titleEn: b.titleEn || '',
        order: b.order ?? 1,
      })),
      opinions: (opinions || []).map((o) => ({
        _id: o._id,
        name: o.name,
        title: o.title,
        details: o.details || '',
        image: o.image || '',
        createdAt: o.createdAt,
      })),
      layoutTopics: (layoutTopics || []).map((t) => ({
        _id: t._id,
        title: t.title,
        titleEn: t.titleEn || '',
        slug: t.slug,
        icon: t.icon || 'fa-solid fa-leaf',
        image: t.image || '',
        url: t.url || '',
        category: t.category ? { _id: t.category._id, name: t.category.name, slug: t.category.slug } : null,
        subcategory: t.subcategory ? { _id: t.subcategory._id, nameBn: t.subcategory.nameBn, slug: t.subcategory.slug } : null,
        order: t.order || 0,
        isActive: t.isActive !== false,
      })),
    }

    if (!bust) cacheSet(CACHE_KEY, payload, CACHE_TTL)
    res.set(
      'Cache-Control',
      bust ? 'private, no-store' : 'public, max-age=10, s-maxage=30, stale-while-revalidate=60',
    )
    res.set('X-Cache', bust ? 'BYPASS' : 'MISS')
    res.json(payload)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
