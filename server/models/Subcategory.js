import mongoose from 'mongoose'

const subcategorySchema = new mongoose.Schema(
  {
    nameBn: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '', trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    showOnHome: { type: Boolean, default: false },
    homeOrder: { type: Number, default: 0 },
    homeFeatured: { type: String, default: '' },
    homeSecondary: { type: [String], default: () => [] },
  },
  { timestamps: true },
)

// Unique slug per category (not globally)
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true })
subcategorySchema.index({ category: 1, order: 1 })
subcategorySchema.index({ isActive: 1 })

export default mongoose.model('Subcategory', subcategorySchema)
