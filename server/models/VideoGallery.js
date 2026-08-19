import mongoose from 'mongoose'

const videoGallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    embedCode: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    type: { type: String, enum: ['Video News', 'Entertainment'], default: 'Video News' },
  },
  { timestamps: true },
)

export default mongoose.model('VideoGallery', videoGallerySchema)
