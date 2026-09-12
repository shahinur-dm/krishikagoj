import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    username: { type: String, trim: true, lowercase: true, default: undefined },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: function () {
        return !this.provider || this.provider === 'local'
      },
      minlength: 6,
    },
    facebookId: { type: String, default: '' },
    googleId: { type: String, default: '' },
    avatar: { type: String, default: '' },
    provider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local',
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'editor', 'news_editor', 'writer', 'visitor'],
      default: 'writer',
    },
    permissions: {
      category: { type: Boolean, default: false },
      district: { type: Boolean, default: false },
      post: { type: Boolean, default: true },
      allpost: { type: Boolean, default: false },
      setting: { type: Boolean, default: false },
      gallery: { type: Boolean, default: false },
      ads: { type: Boolean, default: false },
      role: { type: Boolean, default: false },
      users: { type: Boolean, default: false },
      breaking: { type: Boolean, default: false },
      actions: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.index({ username: 1 }, { unique: true, sparse: true })

userSchema.pre('save', async function hashPassword() {
  if (!this.username) this.username = undefined
  if (!this.password || !this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.password) return false
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    username: this.username || '',
    email: this.email,
    avatar: this.avatar || '',
    provider: this.provider || 'local',
    facebookId: this.facebookId,
    googleId: this.googleId,
    role: this.role,
    permissions: this.permissions,
    isActive: this.isActive,
    createdAt: this.createdAt,
  }
}

export default mongoose.model('User', userSchema)
