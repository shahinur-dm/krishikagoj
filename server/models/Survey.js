import mongoose from 'mongoose'

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    type: { type: String, enum: ['single', 'multiple', 'text'], default: 'single' },
    options: { type: [String], default: [] },
  },
  { _id: false },
)

const surveySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    questions: { type: [questionSchema], default: [] },
    language: { type: String, default: 'bn' },
    status: { type: String, enum: ['draft', 'published'], default: 'published' },
    isActive: { type: Boolean, default: true },
    responseCount: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model('Survey', surveySchema)
