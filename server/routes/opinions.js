import { Router } from 'express'
import Opinion from '../models/Opinion.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'

const router = Router()
const guard = requirePermission('setting', 'post', 'category')

router.get('/public', async (_req, res) => {
  try {
    const items = await Opinion.find({ status: 'published', isActive: { $ne: false } })
      .sort({ createdAt: -1 })
      .limit(40)
      .lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/', requireAuth, guard, async (_req, res) => {
  try {
    const items = await Opinion.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Opinion.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/', requireAuth, guard, async (req, res) => {
  try {
    const { name, title, details, image, language, status } = req.body
    if (!name?.trim() || !title?.trim()) {
      return res.status(400).json({ message: 'নাম এবং শিরোনাম আবশ্যক' })
    }
    const item = await Opinion.create({
      name: String(name).trim(),
      title: String(title).trim(),
      details: String(details || ''),
      image: String(image || ''),
      language: language === 'en' ? 'en' : 'bn',
      status: status === 'draft' ? 'draft' : 'published',
    })
    cacheDel('home')
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, guard, async (req, res) => {
  try {
    const update = {}
    ;['name', 'title', 'details', 'image'].forEach((k) => {
      if (req.body[k] !== undefined) update[k] = String(req.body[k] || '').trim()
    })
    if (req.body.language !== undefined) update.language = req.body.language === 'en' ? 'en' : 'bn'
    if (req.body.status !== undefined) update.status = req.body.status === 'draft' ? 'draft' : 'published'
    if (update.name !== undefined && !update.name) {
      return res.status(400).json({ message: 'নাম আবশ্যক' })
    }
    if (update.title !== undefined && !update.title) {
      return res.status(400).json({ message: 'শিরোনাম আবশ্যক' })
    }
    const item = await Opinion.findByIdAndUpdate(req.params.id, { $set: update }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home')
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Opinion.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home')
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
