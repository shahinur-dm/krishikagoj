import { Router } from 'express'
import ImportantWebsite from '../models/ImportantWebsite.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const items = await ImportantWebsite.find({ isActive: { $ne: false } })
      .sort({ order: 1, createdAt: -1 })
      .lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/all', requireAuth, requirePermission('setting'), async (_req, res) => {
  try {
    const items = await ImportantWebsite.find().sort({ order: 1, createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const item = await ImportantWebsite.create(req.body)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const item = await ImportantWebsite.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const item = await ImportantWebsite.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted', id: item._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
