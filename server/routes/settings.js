import { Router } from 'express'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission, requireSuperAdmin } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'

const router = Router()

router.get('/', async (_req, res) => {
  try {
    const cached = cacheGet('settings')
    if (cached) {
      res.set('Cache-Control', 'public, max-age=30, s-maxage=60')
      return res.json(cached)
    }

    let settings = await SiteSetting.findOne({ key: 'site' }).lean()
    if (!settings) {
      const created = await SiteSetting.create({ key: 'site' })
      settings = created.toObject()
    }
    if (settings?.aiWriter) {
      const { aiWriter, ...rest } = settings
      settings = rest
    }
    cacheSet('settings', settings, 120_000)
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60')
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

function isSafeLogoUrl(url) {
  const value = String(url || '').trim()
  if (!value) return true
  if (value.startsWith('/') && !value.includes('..')) return true
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

const emptyAiWriter = {
  apiKey: '',
  model: 'gpt-4o',
  temperature: '0.7',
  maxTokens: '500',
  promptTemplate: '',
}

router.get('/ai-writer', requireAuth, requirePermission('setting'), async (_req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean()
    res.json({ ...emptyAiWriter, ...(settings?.aiWriter || {}) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/ai-writer', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const aiWriter = {
      apiKey: String(req.body.apiKey || ''),
      model: String(req.body.model || 'gpt-4o'),
      temperature: String(req.body.temperature ?? '0.7'),
      maxTokens: String(req.body.maxTokens ?? '500'),
      promptTemplate: String(req.body.promptTemplate || ''),
    }
    await SiteSetting.findOneAndUpdate({ key: 'site' }, { $set: { aiWriter } }, { upsert: true })
    cacheDel('settings')
    res.json(aiWriter)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/login-logo', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const loginLogo = String(req.body.loginLogo || '').trim()
    if (!isSafeLogoUrl(loginLogo)) {
      return res.status(400).json({ message: 'Invalid logo URL' })
    }
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: { loginLogo } },
      { new: true, upsert: true },
    ).lean()
    cacheDel('settings')
    cacheDel('home:')
    res.json({ loginLogo: settings.loginLogo || '' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/', requireAuth, requirePermission('setting', 'ads', 'breaking', 'post'), async (req, res) => {
  try {
    const update = { ...req.body }
    delete update.loginLogo
    delete update.aiWriter
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    ).lean()
    cacheDel('settings')
    cacheDel('home:')
    res.json(settings)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
