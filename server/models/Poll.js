import mongoose from 'mongoose'

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: { type: [String], default: [] },
    votes: { type: [Number], default: [] },
    votePermission: { type: String, default: 'all' },
    language: { type: String, default: 'bn' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Poll', pollSchema)
