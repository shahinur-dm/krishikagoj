import { Router } from 'express'
import CmsPage from '../models/CmsPage.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { slugify } from '../utils/seoContent.js'

const router = Router()
const guard = requirePermission('setting', 'post')

router.get('/public/:slug', async (req, res) => {
  try {
    const item = await CmsPage.findOne({ slug: req.params.slug, status: 'published' }).lean()
    if (!item) return res.status(404).json({ message: 'Page not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', requireAuth, guard, async (_req, res) => {
  try {
    const items = await CmsPage.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await CmsPage.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

function pagePayload(body) {
  const title = String(body.title || '').trim()
  const slug = slugify(body.slug || title)
  return {
    language: body.language === 'en' ? 'en' : 'bn',
    photo: String(body.photo || ''),
    videoUrl: String(body.videoUrl || ''),
    title,
    slug,
    body: String(body.body || ''),
    metaKeyword: String(body.metaKeyword || ''),
    metaDescription: String(body.metaDescription || ''),
    status: body.status === 'draft' ? 'draft' : 'published',
  }
}

router.post('/', requireAuth, guard, async (req, res) => {
  try {
    const data = pagePayload(req.body)
    if (!data.title || !data.slug) return res.status(400).json({ message: 'Title required' })
    const item = await CmsPage.create(data)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, guard, async (req, res) => {
  try {
    const data = pagePayload(req.body)
    if (!data.title || !data.slug) return res.status(400).json({ message: 'Title required' })
    const item = await CmsPage.findByIdAndUpdate(req.params.id, { $set: data }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await CmsPage.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
