import { Router } from 'express'
import Article from '../models/Article.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import { requireAuth, requirePermission, canSeeAllPosts } from '../middleware/auth.js'
import { ARTICLE_LIST_SELECT, ARTICLE_DETAIL_SELECT } from '../utils/articleFields.js'
import { cacheDel, cacheGet, cacheSet } from '../utils/cache.js'
import { applyArticleSeoDefaults, slugify } from '../utils/seoContent.js'
import Opinion from '../models/Opinion.js'
import SiteSetting from '../models/SiteSetting.js'

const router = Router()

const WRITE_FIELDS = [
  'title',
  'titleEn',
  'slug',
  'excerpt',
  'excerptEn',
  'metaDescription',
  'body',
  'bodyEn',
  'image',
  'images',
  'showImageInDetails',
  'tags',
  'author',
  'category',
  'subcategory',
  'printViewLink',
  'headline',
  'bigthumbnail',
  'firstSection',
  'firstSectionThumbnail',
  'categoryHomepage',
  'featured',
  'latest',
  'popular',
  'publishedAt',
  'isPublished',
]

function pickWriteFields(body) {
  const src = { ...body }
  if (src.meta_description != null && src.metaDescription == null) {
    src.metaDescription = src.meta_description
  }
  const data = {}
  for (const key of WRITE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(src, key)) data[key] = src[key]
  }
  return data
}

async function resolveCategoryId(category) {
  if (!category) return null
  if (String(category).match(/^[0-9a-fA-F]{24}$/)) return category
  const cacheKey = `catslug:${category}`
  const cached = cacheGet(cacheKey)
  if (cached) return cached
  const cat = await Category.findOne({ slug: category, isActive: true }).select('_id').lean()
  if (!cat) return null
  cacheSet(cacheKey, String(cat._id), 300_000)
  return String(cat._id)
}

async function resolveSubcategoryId(subcategory, categoryId) {
  if (!subcategory) return null
  if (String(subcategory).match(/^[0-9a-fA-F]{24}$/)) return subcategory
  const filter = { slug: subcategory, isActive: true }
  if (categoryId) filter.category = categoryId
  const sub = await Subcategory.findOne(filter).select('_id').lean()
  return sub ? String(sub._id) : null
}

async function assertSubcategoryBelongs(categoryId, subcategoryId) {
  if (!subcategoryId) return null
  const sub = await Subcategory.findById(subcategoryId).select('category').lean()
  if (!sub) throw new Error('Subcategory not found')
  if (String(sub.category) !== String(categoryId)) {
    throw new Error('Subcategory does not belong to selected category')
  }
  return subcategoryId
}

function canEditArticle(user, article) {
  if (canSeeAllPosts(user)) return true
  const authorId = article.authorUser?._id || article.authorUser
  if (!authorId) return false
  return String(authorId) === String(user._id)
}

function bustCaches() {
  cacheDel('home')
  cacheDel('articles')
  cacheDel('categories')
  cacheDel('catslug')
}

function populateArticle(q) {
  return q
    .populate('category', 'name nameEn slug')
    .populate('subcategory', 'nameBn slug')
    .populate('authorUser', 'name email')
}

router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')

    const {
      category,
      subcategory,
      featured,
      headline,
      latest,
      popular,
      limit,
      q,
      skip,
      exclude,
      excludeCategory,
    } = req.query
    const filter = { isPublished: true }
    const lim = Math.min(Number(limit) || 40, 100)
    const skipN = Math.max(0, Number(skip) || 0)
    const excludeIds = String(exclude || '')
      .split(',')
      .map((id) => id.trim())
      .filter((id) => /^[0-9a-fA-F]{24}$/.test(id))

    const usePaging = skipN > 0 || excludeIds.length > 0 || Boolean(excludeCategory)
    const cacheKey = `articles:${JSON.stringify({
      category,
      subcategory,
      featured,
      headline,
      latest,
      popular,
      lim,
      q,
      skipN,
      excludeIds,
      excludeCategory,
    })}`
    if (!usePaging) {
      const cached = cacheGet(cacheKey)
      if (cached) {
        res.set('Cache-Control', 'public, max-age=5, s-maxage=15')
        return res.json(cached)
      }
    }

    let catId = null
    if (category) {
      catId = await resolveCategoryId(category)
      if (!catId) return res.json([])
      filter.category = catId
    } else if (excludeCategory) {
      const excludeCatId = await resolveCategoryId(excludeCategory)
      if (excludeCatId) filter.category = { $ne: excludeCatId }
    }

    if (subcategory) {
      const subId = await resolveSubcategoryId(subcategory, catId)
      if (!subId) return res.json([])
      filter.subcategory = subId
    }

    if (excludeIds.length) {
      filter._id = { $nin: excludeIds }
    }

    if (featured === 'true') filter.featured = true
    if (headline === 'true') filter.headline = true
    if (latest === 'true') filter.latest = true
    if (popular === 'true') filter.popular = true
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { excerpt: { $regex: q, $options: 'i' } },
      ]
    }

    const articles = await populateArticle(
      Article.find(filter)
        .select(ARTICLE_LIST_SELECT)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skipN)
        .limit(lim),
    ).lean()

    if (!usePaging) cacheSet(cacheKey, articles, 45_000)
    res.set('Cache-Control', usePaging ? 'no-store' : 'public, max-age=5, s-maxage=15')
    res.json(articles)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/all', requireAuth, requirePermission('post', 'allpost'), async (req, res) => {
  try {
    const filter = {}
    if (!canSeeAllPosts(req.user)) filter.authorUser = req.user._id
    const articles = await populateArticle(
      Article.find(filter).select(`${ARTICLE_LIST_SELECT} body`).sort({ createdAt: -1 }),
    ).lean()
    res.json(articles)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/:id', requireAuth, requirePermission('post', 'allpost'), async (req, res) => {
  try {
    const article = await populateArticle(
      Article.findById(req.params.id).select(ARTICLE_DETAIL_SELECT),
    ).lean()
    if (!article) return res.status(404).json({ message: 'Article not found' })
    if (!canEditArticle(req.user, article)) {
      return res.status(403).json({ message: 'You can only view your own posts' })
    }
    res.json(article)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params
    const isId = /^[0-9a-fA-F]{24}$/.test(idOrSlug)
    let article = await populateArticle(
      isId
        ? Article.findOne({ _id: idOrSlug, isPublished: true }).select(ARTICLE_DETAIL_SELECT)
        : Article.findOne({ slug: idOrSlug, isPublished: true }).select(ARTICLE_DETAIL_SELECT),
    ).lean()

    if (!article && isId) {
      const opinion = await Opinion.findById(idOrSlug).lean()
      if (opinion) {
        article = {
          _id: opinion._id,
          title: opinion.title,
          titleEn: '',
          slug: String(opinion._id),
          body: opinion.details || '',
          bodyEn: '',
          excerpt: opinion.details ? opinion.details.slice(0, 160) : '',
          excerptEn: '',
          image: opinion.image || '',
          author: opinion.name,
          authorImage: opinion.image || '',
          category: { name: 'মতামত', nameEn: 'Opinion', slug: 'motamot' },
          subcategory: { nameBn: 'মতামত', slug: 'motamot' },
          publishedAt: opinion.createdAt,
          createdAt: opinion.createdAt,
          isPublished: opinion.status === 'published',
          views: 1,
        }
      }
    }

    if (!article) return res.status(404).json({ message: 'Article not found' })

    if (article._id && !article.category?.nameEn) {
      Article.updateOne({ _id: article._id }, { $inc: { views: 1 } }).exec().catch(() => {})
    }

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')
    res.set('Surrogate-Control', 'no-store')
    res.json({ ...article, views: (article.views || 0) + 1 })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('post'), async (req, res) => {
  try {
    let data = applyArticleSeoDefaults(pickWriteFields(req.body), { isCreate: true })
    data.authorUser = req.user._id
    if (!data.category) return res.status(400).json({ message: 'Category is required' })
    data.subcategory = (await assertSubcategoryBelongs(data.category, data.subcategory || null)) || undefined
    if (!data.subcategory) delete data.subcategory

    const article = await Article.create(data)
    const populated = await populateArticle(Article.findById(article._id)).lean()
    bustCaches()
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('post'), async (req, res) => {
  try {
    const existing = await Article.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Article not found' })
    if (!canEditArticle(req.user, existing)) {
      return res.status(403).json({ message: 'You can only edit your own posts' })
    }

    const data = applyArticleSeoDefaults(pickWriteFields(req.body), { isCreate: false })
    if (!data.excerpt && !existing.excerpt && (data.body || existing.body)) {
      data.excerpt = applyArticleSeoDefaults(
        { body: data.body || existing.body },
        { isCreate: false },
      ).excerpt
    }
    // Keep slug stable on edit unless explicitly provided
    if (!data.slug) delete data.slug
    const categoryId = data.category || existing.category
    if (Object.prototype.hasOwnProperty.call(data, 'subcategory')) {
      if (data.subcategory === '' || data.subcategory === null) {
        data.subcategory = null
      } else if (data.subcategory) {
        data.subcategory = await assertSubcategoryBelongs(categoryId, data.subcategory)
      }
    }

    const article = await populateArticle(
      Article.findByIdAndUpdate(req.params.id, data, { new: true, runValidators: true }),
    ).lean()

    bustCaches()
    res.json(article)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('post'), async (req, res) => {
  try {
    const existing = await Article.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Article not found' })
    if (!canEditArticle(req.user, existing)) {
      return res.status(403).json({ message: 'You can only delete your own posts' })
    }
    await Article.findByIdAndDelete(req.params.id)
    bustCaches()
    res.json({ message: 'Article deleted', id: existing._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

function stripHtml(html) {
  if (!html) return ''
  return String(html)
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

router.post('/admin/:id/facebook-post', requireAuth, requirePermission('post', 'allpost'), async (req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean()
    const pageId = settings?.facebookPageId || process.env.FACEBOOK_PAGE_ID || ''
    const accessToken = settings?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || ''

    if (!pageId || !accessToken) {
      return res.status(400).json({
        message: 'Facebook Page ID অথবা Page Access Token কনফিগার করা নেই। অনুগ্রহ করে Admin Panel > Facebook Settings-এ গিয়ে অথবা সার্ভার .env ফাইলে Page ID ও Access Token যুক্ত করুন।',
      })
    }

    const article = await Article.findById(req.params.id).populate('category subcategory')
    if (!article) {
      return res.status(404).json({ message: 'Article not found' })
    }

    if (!canEditArticle(req.user, article)) {
      return res.status(403).json({ message: 'You can only publish your own posts to Facebook' })
    }

    if (article.isPublished === false) {
      return res.status(400).json({ message: 'ড্রাফট পোস্ট ফেসবুকে প্রকাশ করা যাবে না। প্রথমে পোস্টটি পাবলিশ করুন।' })
    }

    const rawHost = req.get('x-forwarded-host') || req.get('host') || 'localhost:5050'
    const proto = req.get('x-forwarded-proto') || req.protocol || 'http'
    const defaultSiteUrl = `${proto}://${rawHost}`
    const siteUrl = (process.env.SITE_URL || process.env.VITE_SITE_URL || defaultSiteUrl).replace(/\/$/, '')
    const articleUrl = `${siteUrl}/news/${article.slug || article._id}`

    const excerpt = article.excerpt || stripHtml(article.body).slice(0, 220)
    let caption = `${article.title}`
    if (excerpt) {
      caption += `\n\n${excerpt}`
    }
    caption += `\n\nপুরো article পড়তে:\n${articleUrl}\n\n#কৃষিকাগজ #কৃষি`

    let imageUrl = article.image || ''
    if (imageUrl && !imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      imageUrl = `${siteUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`
    }

    let fbRes
    let fbData
    let postedSuccess = false

    // If there is an absolute image URL, try photo post
    if (imageUrl && (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
      try {
        const fbEndpoint = `https://graph.facebook.com/v19.0/${pageId}/photos`
        fbRes = await fetch(fbEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: imageUrl,
            caption: caption,
            access_token: accessToken,
          }),
        })
        fbData = await fbRes.json().catch(() => ({}))
        if (fbRes.ok && !fbData?.error && (fbData?.id || fbData?.post_id)) {
          postedSuccess = true
        }
      } catch (err) {
        console.warn('Photo post request error, trying feed link post:', err.message)
      }
    }

    // Fallback to feed link post if photo post wasn't successful or no image
    if (!postedSuccess) {
      const fbEndpoint = `https://graph.facebook.com/v19.0/${pageId}/feed`
      fbRes = await fetch(fbEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: caption,
          link: articleUrl,
          access_token: accessToken,
        }),
      })
      fbData = await fbRes.json().catch(() => ({}))
      if (fbRes.ok && !fbData?.error && (fbData?.id || fbData?.post_id)) {
        postedSuccess = true
      }
    }

    if (!postedSuccess || fbData?.error) {
      const errMsg = fbData?.error?.message || fbData?.error?.error_user_msg || 'Facebook API request failed'
      await Article.findByIdAndUpdate(article._id, {
        facebookPostStatus: 'failed',
      })
      return res.status(400).json({
        message: `Facebook-এ পোস্ট করা যায়নি। Page connection/token/API configuration পরীক্ষা করুন। (${errMsg})`,
        error: fbData?.error,
      })
    }

    const fbPostId = String(fbData.id || fbData.post_id || '')
    const updated = await Article.findByIdAndUpdate(
      article._id,
      {
        facebookPostId: fbPostId,
        facebookPostStatus: 'posted',
        facebookPostedAt: new Date(),
      },
      { new: true },
    )

    bustCaches()

    return res.json({
      success: true,
      message: 'Facebook-এ সফলভাবে পোস্ট হয়েছে',
      facebookPostId: updated.facebookPostId,
      facebookPostStatus: updated.facebookPostStatus,
      facebookPostedAt: updated.facebookPostedAt,
    })
  } catch (err) {
    console.error('Facebook post error:', err)
    return res.status(500).json({ message: err.message || 'ফেসবুক পোস্ট করার সময় অভ্যন্তরীণ সমস্যা হয়েছে' })
  }
})

export default router
