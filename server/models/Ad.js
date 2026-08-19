import mongoose from 'mongoose'

const POSITIONS = ['navbar', 'bottom', 'mid_a', 'mid_b', 'sidebar']
const MEDIA_TYPES = ['image', 'video', 'html']

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    titleEn: { type: String, default: '', trim: true },
    description: { type: String, default: '', trim: true },
    descriptionEn: { type: String, default: '', trim: true },
    mediaType: {
      type: String,
      enum: MEDIA_TYPES,
      default: 'image',
    },
    image: { type: String, default: '' },
    videoUrl: { type: String, default: '', trim: true },
    videoEmbed: { type: String, default: '' },
    htmlCode: { type: String, default: '' },
    altText: { type: String, default: '', trim: true },
    linkUrl: { type: String, default: '#', trim: true },
    ctaText: { type: String, default: 'বিস্তারিত', trim: true },
    ctaTextEn: { type: String, default: 'Learn more', trim: true },
    badge: { type: String, default: '', trim: true },
    badgeEn: { type: String, default: '', trim: true },
    sponsorName: { type: String, default: '', trim: true },
    sponsorPhone: { type: String, default: '', trim: true },
    sponsorEmail: { type: String, default: '', trim: true },
    position: {
      type: String,
      enum: POSITIONS,
      default: 'navbar',
      index: true,
    },
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    openInNewTab: { type: Boolean, default: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    notes: { type: String, default: '', trim: true },
  },
  { timestamps: true },
)

adSchema.index({ position: 1, isActive: 1, order: 1 })
adSchema.index({ startAt: 1, endAt: 1 })

export const AD_POSITIONS = POSITIONS
export const AD_MEDIA_TYPES = MEDIA_TYPES
export default mongoose.model('Ad', adSchema)
