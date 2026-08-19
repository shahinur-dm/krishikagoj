import { Router } from 'express'
import Subcategory from '../models/Subcategory.js'
import Category from '../models/Category.js'
import Article from '../models/Article.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'

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
    const item = await Subcategory.create(req.body)
    const populated = await Subcategory.findById(item._id).populate('category', 'name slug').lean()
    cacheDel('home:')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const item = await Subcategory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('category', 'name slug')
      .lean()
    if (!item) return res.status(404).json({ message: 'Subcategory not found' })
    cacheDel('home:')
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
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
