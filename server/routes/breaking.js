import { Router } from 'express'
import BreakingNews from '../models/BreakingNews.js'
import { requireAuth, requirePermission, requireAction } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'

const router = Router()

function slim(item) {
  return {
    _id: item._id,
    titleBn: item.titleBn,
    titleEn: item.titleEn || '',
    status: item.status,
    isActive: item.isActive !== false,
    order: item.order ?? 1,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

router.get('/public', async (_req, res) => {
  try {
    const items = await BreakingNews.find({ isActive: { $ne: false }, status: 'published' })
      .sort({ order: 1, publishedAt: -1 })
      .limit(20)
      .lean()
    res.json(items.map(slim))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', requireAuth, requirePermission('breaking', 'post', 'setting'), async (_req, res) => {
  try {
    const items = await BreakingNews.find().sort({ order: 1, createdAt: -1 }).lean()
    res.json(items.map(slim))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('breaking', 'post', 'setting'), async (req, res) => {
  try {
    const { titleBn, titleEn, status, isActive, order, publishedAt } = req.body
    if (!titleBn || !String(titleBn).trim()) {
      return res.status(400).json({ message: 'Bangla title required' })
    }
    const item = await BreakingNews.create({
      titleBn: String(titleBn).trim(),
      titleEn: String(titleEn || '').trim(),
      status: status === 'draft' ? 'draft' : 'published',
      isActive: isActive !== false,
      order: Number(order) > 0 ? Number(order) : 1,
      publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
      createdBy: req.user._id,
    })
    cacheDel('home:')
    res.status(201).json(slim(item))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('breaking', 'post', 'setting'), async (req, res) => {
  try {
    const update = {}
    if (req.body.titleBn !== undefined) update.titleBn = String(req.body.titleBn).trim()
    if (req.body.titleEn !== undefined) update.titleEn = String(req.body.titleEn || '').trim()
    if (req.body.status !== undefined) update.status = req.body.status === 'draft' ? 'draft' : 'published'
    if (req.body.isActive !== undefined) update.isActive = !!req.body.isActive
    if (req.body.order !== undefined) update.order = Number(req.body.order) > 0 ? Number(req.body.order) : 1
    if (req.body.publishedAt) update.publishedAt = new Date(req.body.publishedAt)
    if (update.titleBn === '') return res.status(400).json({ message: 'Bangla title required' })

    const item = await BreakingNews.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home:')
    res.json(slim(item))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requireAction('breaking', 'delete', 'breaking', 'post', 'setting'), async (req, res) => {
  try {
    const item = await BreakingNews.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home:')
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
