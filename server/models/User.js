import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    facebookId: { type: String, default: '' },
    role: { type: String, enum: ['superadmin', 'writer'], default: 'writer' },
    permissions: {
      category: { type: Boolean, default: false },
      district: { type: Boolean, default: false },
      post: { type: Boolean, default: true },
      allpost: { type: Boolean, default: false },
      setting: { type: Boolean, default: false },
      gallery: { type: Boolean, default: false },
      ads: { type: Boolean, default: false },
      role: { type: Boolean, default: false },
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

userSchema.pre('save', async function hashPassword() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    facebookId: this.facebookId,
    role: this.role,
    permissions: this.permissions,
    isActive: this.isActive,
    createdAt: this.createdAt,
  }
}

export default mongoose.model('User', userSchema)
