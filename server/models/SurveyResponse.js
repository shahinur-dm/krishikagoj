import mongoose from 'mongoose'

const surveyResponseSchema = new mongoose.Schema(
  {
    survey: { type: mongoose.Schema.Types.ObjectId, ref: 'Survey', required: true },
    answers: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('SurveyResponse', surveyResponseSchema)
