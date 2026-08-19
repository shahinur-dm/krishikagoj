import { Router } from 'express'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
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
    cacheSet('settings', settings, 120_000)
    res.set('Cache-Control', 'public, max-age=30, s-maxage=60')
    res.json(settings)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/', requireAuth, requirePermission('setting', 'ads'), async (req, res) => {
  try {
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: req.body },
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
