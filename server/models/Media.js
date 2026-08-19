import mongoose from 'mongoose'

const mediaSchema = new mongoose.Schema(
  {
    filename: { type: String, default: '' },
    mimeType: { type: String, required: true },
    size: { type: Number, default: 0 },
    data: { type: Buffer, required: true },
    provider: { type: String, default: 'local' },
    url: { type: String, default: '' },
    secureUrl: { type: String, default: '' },
    publicId: { type: String, default: '' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true },
)

export default mongoose.model('Media', mediaSchema)
