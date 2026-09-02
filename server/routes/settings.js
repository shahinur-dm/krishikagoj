import { Router } from 'express'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission, requireSuperAdmin } from '../middleware/auth.js'
import { cacheGet, cacheSet, cacheDel } from '../utils/cache.js'
import { generateArticle } from '../utils/aiGenerator.js'

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
    if (settings) {
      delete settings.aiWriter
      delete settings.facebookPageAccessToken
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

router.post('/ai-writer/generate', requireAuth, requirePermission('post'), async (req, res) => {
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

router.get('/facebook', requireAuth, requirePermission('setting'), async (_req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean()
    const pageId = settings?.facebookPageId || process.env.FACEBOOK_PAGE_ID || ''
    const hasToken = Boolean(settings?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN)
    const isEnvFallback = !settings?.facebookPageAccessToken && Boolean(process.env.FACEBOOK_PAGE_ACCESS_TOKEN)
    res.json({
      pageId,
      hasToken,
      isEnvFallback,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/facebook', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const pageId = String(req.body.pageId || '').trim()
    const pageAccessToken = String(req.body.pageAccessToken || '').trim()

    const update = { facebookPageId: pageId }
    if (pageAccessToken) {
      update.facebookPageAccessToken = pageAccessToken
    }

    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { new: true, upsert: true },
    ).lean()

    cacheDel('settings')
    res.json({
      success: true,
      pageId: settings.facebookPageId || '',
      hasToken: Boolean(settings.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN),
      message: 'Facebook সেটিংস সফলভাবে সেভ হয়েছে',
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.post('/facebook/test', requireAuth, requirePermission('setting'), async (req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).lean()
    const bodyPageId = typeof req.body.pageId === 'string' ? req.body.pageId.trim() : null
    const pageId = bodyPageId !== null ? bodyPageId : (settings?.facebookPageId || process.env.FACEBOOK_PAGE_ID || '')

    const bodyAccessToken = typeof req.body.pageAccessToken === 'string' ? req.body.pageAccessToken.trim() : null
    const accessToken =
      bodyAccessToken !== null
        ? bodyAccessToken
        : (settings?.facebookPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '')

    if (!pageId) {
      return res.status(400).json({ connected: false, message: 'Facebook Page ID সেট করা হয়নি' })
    }
    if (!accessToken) {
      return res.status(400).json({ connected: false, message: 'Facebook Page Access Token সেট করা হয়নি' })
    }

    const fbUrl = `https://graph.facebook.com/v19.0/${encodeURIComponent(pageId)}?fields=id,name,link,is_published&access_token=${encodeURIComponent(accessToken)}`
    const fbRes = await fetch(fbUrl)
    const fbData = await fbRes.json().catch(() => ({}))

    if (!fbRes.ok || fbData.error) {
      return res.status(400).json({
        connected: false,
        message: 'Facebook credentials সঠিক নয়',
        details: fbData?.error?.message || 'Connection failed',
      })
    }

    return res.json({
      connected: true,
      pageId: fbData.id || pageId,
      pageName: fbData.name || 'Facebook Page',
      pageLink: fbData.link || '',
      message: 'Facebook Page connection সফল হয়েছে',
    })
  } catch (err) {
    console.error('Facebook test connection error:', err)
    return res.status(500).json({
      connected: false,
      message: 'Facebook Page-এর সাথে connection করা যাচ্ছে না',
      details: err.message,
    })
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
    delete update.facebookPageAccessToken
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: update },
      { new: true, upsert: true, runValidators: true },
    ).lean()
    cacheDel('settings')
    cacheDel('home')
    res.json(settings)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

export default router
