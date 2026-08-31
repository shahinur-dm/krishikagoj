import { Router } from 'express'
import Survey from '../models/Survey.js'
import SurveyResponse from '../models/SurveyResponse.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'

const router = Router()
const guard = requirePermission('setting', 'post')

function publicSurvey(item) {
  return {
    _id: item._id,
    title: item.title,
    description: item.description || '',
    questions: item.questions || [],
    language: item.language,
  }
}

router.get('/public', async (_req, res) => {
  try {
    const items = await Survey.find({ status: 'published', isActive: { $ne: false } })
      .sort({ updatedAt: -1 })
      .lean()
    res.json(items.map(publicSurvey))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/public/:id', async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id).lean()
    if (!item || item.status !== 'published' || item.isActive === false) {
      return res.status(404).json({ message: 'Survey not found' })
    }
    res.json(publicSurvey(item))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/:id/respond', async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id)
    if (!item || item.status !== 'published' || item.isActive === false) {
      return res.status(404).json({ message: 'Survey not found' })
    }
    const answers = Array.isArray(req.body.answers) ? req.body.answers : []
    await SurveyResponse.create({ survey: item._id, answers })
    item.responseCount = (item.responseCount || 0) + 1
    await item.save()
    res.status(201).json({ ok: true, responseCount: item.responseCount })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', requireAuth, guard, async (_req, res) => {
  try {
    const items = await Survey.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id/results', requireAuth, guard, async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Not found' })
    const responses = await SurveyResponse.find({ survey: item._id }).sort({ createdAt: -1 }).lean()
    res.json({ survey: item, responses })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Survey.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

function normalizeSurvey(body) {
  const questions = (Array.isArray(body.questions) ? body.questions : [])
    .map((q) => ({
      text: String(q.text || '').trim(),
      type: ['single', 'multiple', 'text'].includes(q.type) ? q.type : 'single',
      options: (q.options || []).map((o) => String(o || '').trim()).filter(Boolean),
    }))
    .filter((q) => q.text)
  return {
    title: String(body.title || '').trim(),
    description: String(body.description || ''),
    questions,
    language: body.language === 'en' ? 'en' : 'bn',
    status: body.status === 'draft' ? 'draft' : 'published',
  }
}

router.post('/', requireAuth, guard, async (req, res) => {
  try {
    const data = normalizeSurvey(req.body)
    if (!data.title) return res.status(400).json({ message: 'Title required' })
    const item = await Survey.create(data)
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, guard, async (req, res) => {
  try {
    const data = normalizeSurvey(req.body)
    if (!data.title) return res.status(400).json({ message: 'Title required' })
    const item = await Survey.findByIdAndUpdate(req.params.id, { $set: data }, { new: true })
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Survey.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    await SurveyResponse.deleteMany({ survey: item._id })
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
