import mongoose from 'mongoose'

const layoutTopicSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '', trim: true },
    slug: { type: String, default: '', trim: true },
    icon: { type: String, default: 'fa-solid fa-leaf', trim: true },
    image: { type: String, default: '', trim: true },
    url: { type: String, default: '', trim: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    subcategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

layoutTopicSchema.index({ order: 1, createdAt: 1 })

export default mongoose.model('LayoutTopic', layoutTopicSchema)
