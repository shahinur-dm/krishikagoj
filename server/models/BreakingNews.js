import mongoose from 'mongoose'

const breakingNewsSchema = new mongoose.Schema(
  {
    titleBn: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '', trim: true },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 1 },
    publishedAt: { type: Date, default: Date.now },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

breakingNewsSchema.index({ isActive: 1, status: 1, order: 1, publishedAt: -1 })

export default mongoose.model('BreakingNews', breakingNewsSchema)
