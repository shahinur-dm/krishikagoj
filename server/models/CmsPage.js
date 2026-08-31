import mongoose from 'mongoose'

const cmsPageSchema = new mongoose.Schema(
  {
    language: { type: String, default: 'bn' },
    photo: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    body: { type: String, default: '' },
    metaKeyword: { type: String, default: '' },
    metaDescription: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
  },
  { timestamps: true },
)

export default mongoose.model('CmsPage', cmsPageSchema)
