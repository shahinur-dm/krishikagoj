import { Router } from 'express'
import Ad, { AD_POSITIONS, AD_MEDIA_TYPES } from '../models/Ad.js'
import SiteSetting from '../models/SiteSetting.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'
import { isAdsGloballyEnabled } from '../utils/adsEnabled.js'

const router = Router()

const DEMO_ADS = [
  {
    title: 'জাতীয় বিশ্ববিদ্যালয় · অনার্স ভর্তি ২০২৬',
    titleEn: 'National University · Honours Admission 2026',
    description: 'অনলাইনে আবেদন শুরু হয়েছে। যোগ্যতা যাচাই করে দ্রুত ফর্ম পূরণ করুন।',
    descriptionEn: 'Online applications are open. Check eligibility and apply today.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://www.nu.ac.bd/',
    ctaText: 'আবেদন করুন',
    ctaTextEn: 'Apply now',
    badge: 'ভর্তি ২০২৬',
    badgeEn: 'Admission 2026',
    sponsorName: 'জাতীয় বিশ্ববিদ্যালয়',
    position: 'navbar',
    order: 1,
    isActive: true,
  },
  {
    title: 'কৃষি বিশ্ববিদ্যালয় · BSc in Agriculture',
    titleEn: 'Agricultural University · BSc in Agriculture',
    description: 'স্কলারশিপ সুযোগসহ ক্যাম্পাস ভর্তি চলছে। বিস্তারিত জানতে ক্লিক করুন।',
    descriptionEn: 'Campus admission with scholarship options is ongoing.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80',
    linkUrl: 'https://www.bau.edu.bd/',
    ctaText: 'বিস্তারিত',
    ctaTextEn: 'Details',
    badge: 'কৃষি বিশ্ববিদ্যালয়',
    badgeEn: 'Agri University',
    sponsorName: 'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়',
    position: 'bottom',
    order: 1,
    isActive: true,
  },
  {
    title: 'মেডিকেল কলেজ প্রস্তুতি কোর্স',
    titleEn: 'Medical College Admission Prep',
    description: 'মডেল টেস্ট, গাইডলাইন ও অভিজ্ঞ শিক্ষক প্যানেল। এখনই এনরোল করুন।',
    descriptionEn: 'Model tests, guidelines and expert teachers. Enroll now.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80',
    linkUrl: '#',
    ctaText: 'এনরোল করুন',
    ctaTextEn: 'Enroll',
    badge: 'মেডিকেল',
    badgeEn: 'Medical',
    position: 'mid_a',
    order: 1,
    isActive: true,
  },
  {
    title: 'কৃষি ডিপ্লোমা · পলিটেকনিক ভর্তি',
    titleEn: 'Agriculture Diploma · Polytechnic Admission',
    description: 'সীমিত আসন। দ্রুত নিবন্ধন করে আপনার আসন নিশ্চিত করুন।',
    descriptionEn: 'Limited seats. Register quickly to secure your place.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80',
    linkUrl: '#',
    ctaText: 'নিবন্ধন',
    ctaTextEn: 'Register',
    badge: 'ডিপ্লোমা',
    badgeEn: 'Diploma',
    position: 'mid_b',
    order: 1,
    isActive: true,
  },
  {
    title: 'অনলাইন কোর্স · কৃষি প্রযুক্তি',
    titleEn: 'Online Course · Agri Tech',
    description: 'নতুন ব্যাচ শুরু হচ্ছে — এখনই রেজিস্টার করুন।',
    descriptionEn: 'New batch starting — register now.',
    mediaType: 'image',
    image:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=600&q=80',
    linkUrl: '#',
    ctaText: 'রেজিস্টার',
    ctaTextEn: 'Register',
    badge: 'স্পন্সরড',
    badgeEn: 'Sponsored',
    position: 'sidebar',
    order: 1,
    isActive: true,
  },
]

export async function ensureDemoAds() {
  const count = await Ad.countDocuments()
  if (count > 0) return
  await Ad.insertMany(DEMO_ADS)
}

function isLive(a, now = new Date()) {
  if (a.isActive === false) return false
  if (a.startAt && new Date(a.startAt) > now) return false
  if (a.endAt && new Date(a.endAt) < now) return false
  return true
}

export function slimAd(a) {
  return {
    id: String(a._id),
    title: a.title || '',
    titleEn: a.titleEn || '',
    description: a.description || '',
    descriptionEn: a.descriptionEn || '',
    mediaType: a.mediaType || 'image',
    image: a.image || '',
    videoUrl: a.videoUrl || '',
    videoEmbed: a.videoEmbed || '',
    htmlCode: a.htmlCode || '',
    altText: a.altText || '',
    linkUrl: a.linkUrl || '#',
    ctaText: a.ctaText || 'বিস্তারিত',
    ctaTextEn: a.ctaTextEn || 'Learn more',
    badge: a.badge || '',
    badgeEn: a.badgeEn || '',
    sponsorName: a.sponsorName || '',
    sponsorPhone: a.sponsorPhone || '',
    sponsorEmail: a.sponsorEmail || '',
    position: a.position,
    order: a.order || 0,
    openInNewTab: a.openInNewTab !== false,
    startAt: a.startAt || null,
    endAt: a.endAt || null,
  }
}

function parseDate(v) {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d
}

function sanitizeBody(body = {}) {
  const mediaType = AD_MEDIA_TYPES.includes(body.mediaType) ? body.mediaType : 'image'
  return {
    title: String(body.title || '').trim(),
    titleEn: String(body.titleEn || '').trim(),
    description: String(body.description || '').trim(),
    descriptionEn: String(body.descriptionEn || '').trim(),
    mediaType,
    image: String(body.image || '').trim(),
    videoUrl: String(body.videoUrl || '').trim(),
    videoEmbed: String(body.videoEmbed || '').trim(),
    htmlCode: String(body.htmlCode || '').trim(),
    altText: String(body.altText || '').trim(),
    linkUrl: String(body.linkUrl || '#').trim() || '#',
    ctaText: String(body.ctaText || 'বিস্তারিত').trim() || 'বিস্তারিত',
    ctaTextEn: String(body.ctaTextEn || 'Learn more').trim() || 'Learn more',
    badge: String(body.badge || '').trim(),
    badgeEn: String(body.badgeEn || '').trim(),
    sponsorName: String(body.sponsorName || '').trim(),
    sponsorPhone: String(body.sponsorPhone || '').trim(),
    sponsorEmail: String(body.sponsorEmail || '').trim(),
    position: AD_POSITIONS.includes(body.position) ? body.position : 'navbar',
    order: Number(body.order) || 0,
    isActive: body.isActive !== false && body.isActive !== 'false',
    openInNewTab: body.openInNewTab !== false && body.openInNewTab !== 'false',
    startAt: parseDate(body.startAt),
    endAt: parseDate(body.endAt),
    notes: String(body.notes || '').trim(),
  }
}

router.get('/public', async (_req, res) => {
  try {
    const settings = await SiteSetting.findOne({ key: 'site' }).select('adsEnabled').lean()
    if (!isAdsGloballyEnabled(settings)) {
      return res.json([])
    }
    await ensureDemoAds()
    const items = await Ad.find({ isActive: { $ne: false } })
      .sort({ position: 1, order: 1, createdAt: -1 })
      .lean()
    const now = new Date()
    res.json(items.filter((a) => isLive(a, now)).map(slimAd))
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/global', requireAuth, requirePermission('setting', 'ads'), async (_req, res) => {
  try {
    let settings = await SiteSetting.findOne({ key: 'site' }).select('adsEnabled').lean()
    if (!settings) {
      const created = await SiteSetting.create({ key: 'site' })
      settings = created.toObject()
    }
    const adsEnabled = isAdsGloballyEnabled(settings)
    res.json({ adsEnabled, ads_enabled: adsEnabled })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/global', requireAuth, requirePermission('setting', 'ads'), async (req, res) => {
  try {
    const raw = req.body?.adsEnabled ?? req.body?.ads_enabled
    if (raw === undefined) {
      return res.status(400).json({ message: 'ads_enabled প্রয়োজন' })
    }
    const adsEnabled = raw === true || raw === 'true' || raw === 1 || raw === '1'
    const settings = await SiteSetting.findOneAndUpdate(
      { key: 'site' },
      { $set: { adsEnabled } },
      { new: true, upsert: true },
    )
      .select('adsEnabled')
      .lean()
    cacheDel('settings')
    cacheDel('home:')
    const value = isAdsGloballyEnabled(settings)
    res.json({ adsEnabled: value, ads_enabled: value })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/admin/all', requireAuth, requirePermission('setting', 'ads'), async (_req, res) => {
  try {
    await ensureDemoAds()
    const items = await Ad.find().sort({ position: 1, order: 1, createdAt: -1 }).lean()
    res.json(items)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/positions', requireAuth, requirePermission('setting', 'ads'), (_req, res) => {
  res.json({ positions: AD_POSITIONS, mediaTypes: AD_MEDIA_TYPES })
})

router.post('/', requireAuth, requirePermission('setting', 'ads'), async (req, res) => {
  try {
    const data = sanitizeBody(req.body)
    if (!data.title) return res.status(400).json({ message: 'শিরোনাম প্রয়োজন' })
    const item = await Ad.create(data)
    cacheDel('home:')
    res.status(201).json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', requireAuth, requirePermission('setting', 'ads'), async (req, res) => {
  try {
    const data = sanitizeBody(req.body)
    if (!data.title) return res.status(400).json({ message: 'শিরোনাম প্রয়োজন' })
    const item = await Ad.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    })
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home:')
    res.json(item)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requireAuth, requirePermission('setting', 'ads'), async (req, res) => {
  try {
    const item = await Ad.findByIdAndDelete(req.params.id)
    if (!item) return res.status(404).json({ message: 'Not found' })
    cacheDel('home:')
    res.json({ message: 'Deleted', id: item._id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export { isLive }
export default router
