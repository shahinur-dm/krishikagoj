import { Router } from 'express'
import Poll from '../models/Poll.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'

const router = Router()
const guard = requirePermission('setting', 'post', 'category')

function slimPublic(item) {
  return {
    _id: item._id,
    question: item.question,
    options: item.options || [],
    votes: item.votes || [],
    language: item.language,
  }
}

router.get('/public', async (_req, res) => {
  try {
    const item = await Poll.findOne({ status: 'published', isActive: { $ne: false } })
      .sort({ updatedAt: -1 })
      .lean()
    res.json(item ? slimPublic(item) : null)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/:id/vote', async (req, res) => {
  try {
    const item = await Poll.findById(req.params.id)
    if (!item || item.status !== 'published' || item.isActive === false) {
      return res.status(404).json({ message: 'Poll not found' })
    }
    const index = Number(req.body.optionIndex)
    if (!Number.isInteger(index) || index < 0 || index >= item.options.length) {
      return res.status(400).json({ message: 'Invalid option' })
    }
    if (!item.votes || item.votes.length !== item.options.length) {
      item.votes = item.options.map((_, i) => Number(item.votes?.[i]) || 0)
    }
    item.votes[index] = (item.votes[index] || 0) + 1
    item.markModified('votes')
    await item.save()
    cacheDel('home')
    res.json(slimPublic(item))
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/', requireAuth, guard, async (_req, res) => {
  try {
    const items = await Poll.find().sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Poll.findById(req.params.id).lean()
    if (!item) return res.status(404).json({ message: 'Not found' })
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

function normalizePoll(body) {
  const options = (Array.isArray(body.options) ? body.options : String(body.options || '').split('\n'))
    .map((o) => String(o || '').trim())
    .filter(Boolean)
  if (options.length < 2) throw new Error('কমপক্ষে দুটি অপশন প্রয়োজন')
  const votes = options.map((_, i) => Number(body.votes?.[i]) || 0)
  return {
    question: String(body.question || '').trim(),
    options,
    votes,
    votePermission: String(body.votePermission || 'all'),
    language: body.language === 'en' ? 'en' : 'bn',
    status: body.status === 'draft' ? 'draft' : 'published',
  }
}

router.post('/', requireAuth, guard, async (req, res) => {
  try {
    const data = normalizePoll(req.body)
    if (!data.question) return res.status(400).json({ message: 'প্রশ্ন আবশ্যক' })
    const item = await Poll.create(data)
    cacheDel('home')
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, guard, async (req, res) => {
  try {
    const existing = await Poll.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'Not found' })

    const data = normalizePoll(req.body)
    if (!data.question) return res.status(400).json({ message: 'প্রশ্ন আবশ্যক' })

    // Preserve existing votes for matching options
    if (req.body.votes === undefined && existing.options?.length) {
      data.votes = data.options.map((opt) => {
        const oldIndex = existing.options.indexOf(opt)
        return oldIndex >= 0 ? Number(existing.votes?.[oldIndex]) || 0 : 0
      })
    }

    const item = await Poll.findByIdAndUpdate(req.params.id, { $set: data }, { new: true })
    cacheDel('home')
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, guard, async (req, res) => {
  try {
    const item = await Poll.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home')
    res.json({ message: 'Deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
