import { Router } from 'express'
import Subcategory from '../models/Subcategory.js'
import Category from '../models/Category.js'
import Article from '../models/Article.js'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'
import { makeSlug } from '../utils/slug.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const { category } = req.query
    const filter = { isActive: true }
    if (category) {
      const cat = category.match(/^[0-9a-fA-F]{24}$/)
        ? await Category.findById(category).select('_id').lean()
        : await Category.findOne({ slug: category }).select('_id').lean()
      if (cat) filter.category = cat._id
    }
    const items = await Subcategory.find(filter)
      .populate('category', 'name slug')
      .sort({ order: 1, nameBn: 1 })
      .lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/grid-config', requireAuth, requirePermission('category', 'setting'), async (req, res) => {
  try {
    const topicGridLimit = Math.min(16, Math.max(1, Number(req.body?.topicGridLimit) || 8))
    const topicGridSlug = String(req.body?.topicGridSlug || 'motso').trim() || 'motso'
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: { topicGridLimit, topicGridSlug } },
      { new: true, upsert: true },
    )
      .select('topicGridLimit topicGridSlug')
      .lean()
    cacheDel('home:')
    cacheDel('settings')
    res.json({
      topicGridLimit: settings.topicGridLimit || 8,
      topicGridSlug: settings.topicGridSlug || 'motso',
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/all', requireAuth, requirePermission('category', 'post'), async (_req, res) => {
  try {
    const items = await Subcategory.find()
      .populate('category', 'name slug')
      .sort({ order: 1, nameBn: 1 })
      .lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/by-category/:catId', async (req, res) => {
  try {
    const items = await Subcategory.find({ category: req.params.catId, isActive: true })
      .sort({ order: 1 })
      .lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const body = req.body || {}
    const nameBn = String(body.nameBn || body.name || '').trim()
    const categoryId = body.category?._id || body.category
    if (!nameBn || !categoryId) {
      return res.status(400).json({ message: 'নাম ও ক্যাটাগরি আবশ্যক' })
    }
    const slug = String(body.slug || '').trim().toLowerCase() || makeSlug(body.nameEn, nameBn, 'sub')
    const item = await Subcategory.create({
      nameBn,
      nameEn: String(body.nameEn || '').trim(),
      slug,
      category: categoryId,
      order: Number(body.order) || 0,
      isActive: body.isActive !== false && body.isActive !== 'false',
      showOnHome: body.showOnHome === true || body.showOnHome === 'true',
      homeOrder: Number(body.homeOrder) || 0,
      homeFeatured: String(body.homeFeatured || ''),
      homeSecondary: (Array.isArray(body.homeSecondary) ? body.homeSecondary : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean),
    })
    const populated = await Subcategory.findById(item._id).populate('category', 'name slug').lean()
    cacheDel('home:')
    cacheDel('categories:')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: subcategoryError(err) })
  }
})

function subcategoryError(err) {
  if (err?.code === 11000) return 'এই ক্যাটাগরিতে একই স্লাগ আগে থেকেই আছে। অন্য স্লাগ দিন।'
  return err.message || 'সাবক্যাটাগরি সংরক্ষণ করা যায়নি'
}

router.put('/:id', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const body = req.body || {}
    const nameBn = String(body.nameBn || body.name || '').trim()
    const slug = String(body.slug || '').trim().toLowerCase() || makeSlug(body.nameEn, nameBn, 'sub')
    const categoryId = body.category?._id || body.category
    if (!nameBn || !categoryId) {
      return res.status(400).json({ message: 'নাম ও ক্যাটাগরি আবশ্যক' })
    }

    const item = await Subcategory.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Subcategory not found' })

    item.nameBn = nameBn
    item.nameEn = String(body.nameEn || '').trim()
    item.slug = slug
    item.category = categoryId
    if (body.order !== undefined) item.order = Number(body.order) || 0
    if (body.isActive !== undefined) item.isActive = body.isActive !== false && body.isActive !== 'false'
    if (body.showOnHome !== undefined) item.showOnHome = body.showOnHome === true || body.showOnHome === 'true'
    if (body.homeOrder !== undefined) item.homeOrder = Number(body.homeOrder) || 0
    if (body.homeFeatured !== undefined) item.homeFeatured = String(body.homeFeatured || '')
    if (body.homeSecondary !== undefined) {
      item.homeSecondary = (Array.isArray(body.homeSecondary) ? body.homeSecondary : [])
        .map((id) => String(id || '').trim())
        .filter(Boolean)
    }
    await item.save()

    const populated = await Subcategory.findById(item._id).populate('category', 'name slug').lean()
    cacheDel('home:')
    cacheDel('categories:')
    res.json(populated)
  } catch (err) {
    res.status(400).json({ message: subcategoryError(err) })
  }
})

router.delete('/:id', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const item = await Subcategory.findById(req.params.id)
    if (!item) return res.status(404).json({ message: 'Subcategory not found' })

    const articleCount = await Article.countDocuments({ subcategory: item._id })
    if (articleCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${articleCount} article(s) linked. Clear subcategory on those posts first.`,
      })
    }

    await Subcategory.findByIdAndDelete(item._id)
    cacheDel('home:')
    res.json({ message: 'Subcategory deleted', id: item._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
