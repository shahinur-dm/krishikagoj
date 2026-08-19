import mongoose from 'mongoose'

const importantWebsiteSchema = new mongoose.Schema(
  {
    websiteName: { type: String, required: true, trim: true },
    websiteLink: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

importantWebsiteSchema.index({ order: 1 })
importantWebsiteSchema.index({ isActive: 1 })

export default mongoose.model('ImportantWebsite', importantWebsiteSchema)
