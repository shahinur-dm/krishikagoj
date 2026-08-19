import { Router } from 'express'
import VideoGallery from '../models/VideoGallery.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

const router = Router()

function bust() {
  cacheDel('videos')
  cacheDel('home:')
}

router.get('/', async (_req, res) => {
  try {
    const cached = cacheGet('videos')
    if (cached) return res.json(cached)
    const items = await VideoGallery.find().sort({ createdAt: -1 }).limit(24).lean()
    cacheSet('videos', items, 120_000)
    res.set('Cache-Control', 'public, max-age=30')
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await VideoGallery.create(req.body)
    bust()
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await VideoGallery.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    bust()
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await VideoGallery.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    bust()
    res.json({ message: 'Deleted', id: item._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
