import mongoose from 'mongoose'

const photoGallerySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    photo: { type: String, required: true },
    type: { type: String, enum: ['Big Photo', 'Small Photo'], default: 'Big Photo' },
  },
  { timestamps: true },
)

export default mongoose.model('PhotoGallery', photoGallerySchema)
