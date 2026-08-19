import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameEn: { type: String, default: '', trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    layout: { type: String, enum: ['auto', 'default', 'grid4', 'masonry', 'sidebarLeft', 'grid3', 'list', 'overlay'], default: 'auto' },
  },
  { timestamps: true },
)

categorySchema.index({ order: 1, name: 1 })
categorySchema.index({ isActive: 1, order: 1 })

export default mongoose.model('Category', categorySchema)
