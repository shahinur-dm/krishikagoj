import { Router } from 'express'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import Article from '../models/Article.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const cached = cacheGet('categories:active')
    if (cached) {
      res.set('Cache-Control', 'public, max-age=60, s-maxage=120')
      return res.json(cached)
    }
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 }).lean()
    cacheSet('categories:active', categories, 180_000)
    res.set('Cache-Control', 'public, max-age=60, s-maxage=120')
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/all', requireAuth, requirePermission('category', 'post'), async (_req, res) => {
  try {
    const categories = await Category.find().sort({ order: 1, name: 1 }).lean()
    res.json(categories)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params
    const category = idOrSlug.match(/^[0-9a-fA-F]{24}$/)
      ? await Category.findOne({ _id: idOrSlug, isActive: true }).lean()
      : await Category.findOne({ slug: idOrSlug, isActive: true }).lean()
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const category = await Category.create(req.body)
    cacheDel('categories:')
    cacheDel('home:')
    res.status(201).json(category)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
    if (!category) return res.status(404).json({ message: 'Category not found' })
    cacheDel('categories:')
    cacheDel('home:')
    res.json(category)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('category'), async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })

    const [articleCount, subCount] = await Promise.all([
      Article.countDocuments({ category: category._id }),
      Subcategory.countDocuments({ category: category._id }),
    ])
    if (articleCount > 0 || subCount > 0) {
      return res.status(400).json({
        message: `Cannot delete: ${articleCount} article(s) and ${subCount} subcategory(ies) linked. Move or delete them first.`,
      })
    }

    await Category.findByIdAndDelete(category._id)
    cacheDel('categories:')
    cacheDel('home:')
    res.json({ message: 'Category deleted', id: category._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
