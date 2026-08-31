import mongoose from 'mongoose'

const opinionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    details: { type: String, default: '' },
    image: { type: String, default: '' },
    language: { type: String, default: 'bn' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Opinion', opinionSchema)
