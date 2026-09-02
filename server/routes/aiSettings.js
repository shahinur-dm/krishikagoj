import { Router } from 'express'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { generateArticle } from '../utils/aiGenerator.js'

const router = Router()
const guard = requirePermission('setting')

const empty = {
  apiKey: '',
  model: 'gpt-4o',
  temperature: '0.7',
  maxTokens: '500',
  promptTemplate: '',
}

router.get('/', requireAuth, guard, async (_req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean()
    res.json({ ...empty, ...(settings?.aiWriter || {}) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/', requireAuth, guard, async (req, res) => {
  try {
    const aiWriter = {
      apiKey: String(req.body.apiKey || ''),
      model: String(req.body.model || 'gpt-4o'),
      temperature: String(req.body.temperature ?? '0.7'),
      maxTokens: String(req.body.maxTokens ?? '500'),
      promptTemplate: String(req.body.promptTemplate || ''),
    }
    await SiteSetting.findOneAndUpdate({ key: 'site' }, { $set: { aiWriter } }, { upsert: true })
    res.json(aiWriter)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/generate', requireAuth, requirePermission('post'), async (req, res) => {
  try {
    const { title, headline, excerpt, category, subcategory, language } = req.body || {}
    const text = await generateArticle({
      headline: headline || title || '',
      excerpt: excerpt || '',
      category: category || '',
      subcategory: subcategory || '',
      language: language || 'bn',
    })
    res.json({ success: true, content: text })
  } catch (err) {
    res.status(400).json({ message: err.message || 'AI generation failed' })
  }
})

export default router

