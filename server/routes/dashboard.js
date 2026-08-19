import { Router } from 'express'
import Category from '../models/Category.js'
import Subcategory from '../models/Subcategory.js'
import Article from '../models/Article.js'
import PhotoGallery from '../models/PhotoGallery.js'
import VideoGallery from '../models/VideoGallery.js'
import Staff from '../models/Staff.js'
import ImportantWebsite from '../models/ImportantWebsite.js'
import User from '../models/User.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (_req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const [
      categories,
      subcategories,
      posts,
      published,
      drafts,
      staff,
      photos,
      videos,
      writers,
      pendingWriters,
      websites,
      headlines,
      featured,
      popular,
      viewsAgg,
      recentPosts,
      topPosts,
      byCategory,
      postsThisWeek,
      postsToday,
    ] = await Promise.all([
      Category.countDocuments(),
      Subcategory.countDocuments(),
      Article.countDocuments(),
      Article.countDocuments({ isPublished: true }),
      Article.countDocuments({ isPublished: false }),
      Staff.countDocuments(),
      PhotoGallery.countDocuments(),
      VideoGallery.countDocuments(),
      User.countDocuments({ role: 'writer' }),
      User.countDocuments({ role: 'writer', isActive: false }),
      ImportantWebsite.countDocuments(),
      Article.countDocuments({ headline: true, isPublished: true }),
      Article.countDocuments({ featured: true, isPublished: true }),
      Article.countDocuments({ popular: true, isPublished: true }),
      Article.aggregate([{ $group: { _id: null, total: { $sum: '$views' } } }]),
      Article.find()
        .select('title image views isPublished publishedAt createdAt category author')
        .populate('category', 'name slug')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      Article.find({ isPublished: true })
        .select('title image views publishedAt category')
        .populate('category', 'name slug')
        .sort({ views: -1 })
        .limit(6)
        .lean(),
      Article.aggregate([
        { $match: { isPublished: true } },
        { $group: { _id: '$category', count: { $sum: 1 }, views: { $sum: '$views' } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'cat',
          },
        },
        { $unwind: { path: '$cat', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            count: 1,
            views: 1,
            name: { $ifNull: ['$cat.name', 'অজানা'] },
            slug: { $ifNull: ['$cat.slug', ''] },
          },
        },
      ]),
      Article.countDocuments({ createdAt: { $gte: weekAgo } }),
      Article.countDocuments({ createdAt: { $gte: dayAgo } }),
    ])

    res.json({
      categories,
      subcategories,
      posts,
      published,
      drafts,
      staff,
      photos,
      videos,
      writers,
      pendingWriters,
      websites,
      headlines,
      featured,
      popular,
      totalViews: viewsAgg[0]?.total || 0,
      postsThisWeek,
      postsToday,
      recentPosts,
      topPosts,
      byCategory,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
