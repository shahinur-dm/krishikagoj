import { Router } from 'express'
import PhotoGallery from '../models/PhotoGallery.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

const router = Router()

function bust() {
  cacheDel('photos')
  cacheDel('home:')
}

router.get('/', async (_req, res) => {
  try {
    const cached = cacheGet('photos')
    if (cached) return res.json(cached)
    const items = await PhotoGallery.find().sort({ createdAt: -1 }).limit(48).lean()
    cacheSet('photos', items, 120_000)
    res.set('Cache-Control', 'public, max-age=30')
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await PhotoGallery.create(req.body)
    bust()
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await PhotoGallery.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    bust()
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('gallery'), async (req, res) => {
  try {
    const item = await PhotoGallery.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    bust()
    res.json({ message: 'Deleted', id: item._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
