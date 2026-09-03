import { Router } from 'express'
import LayoutTopic from '../models/LayoutTopic.js'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { cacheDel } from '../utils/cache.js'
import { slugify } from '../utils/seoContent.js'

const router = Router()

// Default seeded topics to ensure instant usability if database is empty
const DEFAULT_LAYOUT_TOPICS = [
  { title: 'কৃষি', slug: 'krishi', icon: 'fa-solid fa-leaf', order: 1, isActive: true },
  { title: 'কৃষি সংবাদ', slug: 'krishi-songbad', icon: 'fa-solid fa-newspaper', order: 2, isActive: true },
  { title: 'কৃষকের কথা', slug: 'krishoker-kotha', icon: 'fa-solid fa-users', order: 3, isActive: true },
  { title: 'বিশেষ প্রতিবেদন', slug: 'bishesh', icon: 'fa-solid fa-award', order: 4, isActive: true },
  { title: 'কৃষি প্রযুক্তি', slug: 'projukti', icon: 'fa-solid fa-microchip', order: 5, isActive: false },
]

export async function ensureDefaultLayoutTopics() {
  try {
    const count = await LayoutTopic.countDocuments()
    if (count === 0) {
      // Find matching categories if available
      const categories = await Category.find().lean()
      const catMap = new Map(categories.map((c) => [c.slug, c._id]))

      const toInsert = DEFAULT_LAYOUT_TOPICS.map((t) => ({
        ...t,
        category: catMap.get(t.slug) || null,
      }))
      await LayoutTopic.insertMany(toInsert)
      console.log('Seeded default LayoutTopics')
    }
  } catch (err) {
    console.warn('ensureDefaultLayoutTopics warning:', err.message)
  }
}

// GET /api/layout-topics - List all or active layout topics
router.get('/', async (req, res) => {
  try {
    await ensureDefaultLayoutTopics()

    const showAll = req.query.all === 'true' || req.query.admin === 'true'
    const filter = showAll ? {} : { isActive: { $ne: false } }

    const topics = await LayoutTopic.find(filter)
      .populate('category', 'name nameEn slug')
      .populate('subcategory', 'nameBn nameEn slug')
      .sort({ order: 1, createdAt: 1 })
      .lean()

    res.json(topics)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/layout-topics - Create new topic
router.post('/', requireAuth, requirePermission('category', 'setting', 'post'), async (req, res) => {
  try {
    const { title, titleEn, slug, icon, image, url, category, subcategory, order, isActive } = req.body || {}

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: 'টপিক শিরোনাম আবশ্যক' })
    }

    const cleanTitle = String(title).trim()
    const cleanSlug = slug && String(slug).trim() ? slugify(String(slug).trim()) : slugify(cleanTitle)

    let topicOrder = Number(order)
    if (Number.isNaN(topicOrder) || topicOrder === undefined) {
      const highest = await LayoutTopic.findOne().sort({ order: -1 }).lean()
      topicOrder = highest ? (highest.order || 0) + 1 : 1
    }

    const created = await LayoutTopic.create({
      title: cleanTitle,
      titleEn: String(titleEn || '').trim(),
      slug: cleanSlug,
      icon: String(icon || 'fa-solid fa-leaf').trim(),
      image: String(image || '').trim(),
      url: String(url || '').trim(),
      category: category && /^[0-9a-fA-F]{24}$/.test(category) ? category : null,
      subcategory: subcategory && /^[0-9a-fA-F]{24}$/.test(subcategory) ? subcategory : null,
      order: topicOrder,
      isActive: isActive !== false,
    })

    const populated = await LayoutTopic.findById(created._id)
      .populate('category', 'name nameEn slug')
      .populate('subcategory', 'nameBn nameEn slug')
      .lean()

    cacheDel('home')
    res.status(201).json(populated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PUT /api/layout-topics/reorder - Bulk reorder & status update
router.put('/reorder', requireAuth, requirePermission('category', 'setting', 'post'), async (req, res) => {
  try {
    const topics = req.body?.topics
    if (!Array.isArray(topics)) {
      return res.status(400).json({ message: 'টপিক তালিকা সঠিক নয়' })
    }

    const updates = topics.map((t, idx) => {
      const id = t._id || t.id
      if (!id || !/^[0-9a-fA-F]{24}$/.test(String(id))) return null
      const updateData = { order: typeof t.order === 'number' ? t.order : idx + 1 }
      if (typeof t.isActive === 'boolean') {
        updateData.isActive = t.isActive
      }
      return LayoutTopic.findByIdAndUpdate(id, { $set: updateData })
    }).filter(Boolean)

    await Promise.all(updates)
    cacheDel('home')

    const list = await LayoutTopic.find()
      .populate('category', 'name nameEn slug')
      .populate('subcategory', 'nameBn nameEn slug')
      .sort({ order: 1, createdAt: 1 })
      .lean()

    res.json({ success: true, message: 'লেআউট টপিক ক্রম সফলভাবে সেভ হয়েছে', topics: list })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// PUT /api/layout-topics/:id - Update topic
router.put('/:id', requireAuth, requirePermission('category', 'setting', 'post'), async (req, res) => {
  try {
    const { title, titleEn, slug, icon, image, url, category, subcategory, order, isActive } = req.body || {}

    const update = {}
    if (title !== undefined) update.title = String(title).trim()
    if (titleEn !== undefined) update.titleEn = String(titleEn).trim()
    if (slug !== undefined) update.slug = String(slug).trim() ? slugify(String(slug).trim()) : ''
    if (icon !== undefined) update.icon = String(icon).trim()
    if (image !== undefined) update.image = String(image).trim()
    if (url !== undefined) update.url = String(url).trim()
    if (category !== undefined) {
      update.category = category && /^[0-9a-fA-F]{24}$/.test(category) ? category : null
    }
    if (subcategory !== undefined) {
      update.subcategory = subcategory && /^[0-9a-fA-F]{24}$/.test(subcategory) ? subcategory : null
    }
    if (order !== undefined) update.order = Number(order) || 0
    if (isActive !== undefined) update.isActive = Boolean(isActive)

    const updated = await LayoutTopic.findByIdAndUpdate(
      req.params.id,
      { $set: update },
      { new: true, runValidators: true },
    )
      .populate('category', 'name nameEn slug')
      .populate('subcategory', 'nameBn nameEn slug')
      .lean()

    if (!updated) return res.status(404).json({ message: 'টপিক পাওয়া যায়নি' })

    cacheDel('home')
    res.json(updated)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

// DELETE /api/layout-topics/:id - Delete topic
router.delete('/:id', requireAuth, requirePermission('category', 'setting', 'post'), async (req, res) => {
  try {
    const deleted = await LayoutTopic.findByIdAndDelete(req.params.id)
    if (!deleted) return res.status(404).json({ message: 'টপিক পাওয়া যায়নি' })

    cacheDel('home')
    res.json({ message: 'টপিক মুছে ফেলা হয়েছে', id: req.params.id })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
