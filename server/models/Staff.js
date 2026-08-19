import mongoose from 'mongoose'

const staffSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    designation: { type: String, default: '' },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    type: { type: String, enum: ['Staff', 'Management', 'Advertisement'], default: 'Staff' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

staffSchema.index({ type: 1, order: 1 })
staffSchema.index({ isActive: 1 })

export default mongoose.model('Staff', staffSchema)
