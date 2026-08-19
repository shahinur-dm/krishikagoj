import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '', trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '' },
    excerptEn: { type: String, default: '' },
    body: { type: String, required: true },
    bodyEn: { type: String, default: '' },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    tags: { type: String, default: '' },
    author: { type: String, default: 'কৃষি ডেস্ক' },
    authorUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory' },
    printViewLink: { type: String, default: '' },
    views: { type: Number, default: 0 },
    headline: { type: Boolean, default: false },
    bigthumbnail: { type: Boolean, default: false },
    firstSection: { type: Boolean, default: false },
    firstSectionThumbnail: { type: Boolean, default: false },
    categoryHomepage: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    latest: { type: Boolean, default: true },
    popular: { type: Boolean, default: false },
    publishedAt: { type: Date, default: Date.now },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true },
)

articleSchema.index({ category: 1, publishedAt: -1 })
articleSchema.index({ subcategory: 1 })
articleSchema.index({ isPublished: 1, publishedAt: -1 })
articleSchema.index({ isPublished: 1, headline: 1, publishedAt: -1 })
articleSchema.index({ isPublished: 1, featured: 1, publishedAt: -1 })
articleSchema.index({ isPublished: 1, latest: 1, publishedAt: -1 })
articleSchema.index({ isPublished: 1, popular: 1, views: -1 })
articleSchema.index({ authorUser: 1, createdAt: -1 })

export default mongoose.model('Article', articleSchema)
