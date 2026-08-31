import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth, requireSuperAdmin, signToken } from '../middleware/auth.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { email, password, username } = req.body
    const ident = String(email || username || '')
      .toLowerCase()
      .trim()
    if (!ident || !password) return res.status(400).json({ message: 'Email and password required' })

    const user = await User.findOne({
      $or: [{ email: ident }, { username: ident }],
    })
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }
    if (!user.isActive) return res.status(403).json({ message: 'Account disabled or awaiting approval' })

    const token = signToken(user)
    res.json({ token, user: user.toSafeJSON() })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, facebookId } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' })
    }
    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    if (exists) return res.status(400).json({ message: 'Email already registered' })

    const user = await User.create({
      name,
      email,
      password,
      facebookId: facebookId || '',
      role: 'writer',
      isActive: false,
      permissions: { post: true },
    })
    res.status(201).json({
      message: 'Registration successful. Await admin approval before login.',
      user: user.toSafeJSON(),
    })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/me', requireAuth, (req, res) => {
  res.json(req.user.toSafeJSON())
})

router.put('/password', requireAuth, async (req, res) => {
  try {
    const { oldpass, password, password_confirmation } = req.body
    if (!oldpass || !password) return res.status(400).json({ message: 'All password fields required' })
    if (password !== password_confirmation) {
      return res.status(400).json({ message: 'Password confirmation does not match' })
    }
    const ok = await req.user.comparePassword(oldpass)
    if (!ok) return res.status(400).json({ message: 'Old password is incorrect' })

    req.user.password = password
    await req.user.save()
    res.json({ message: 'Password updated successfully' })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.get('/writers', requireAuth, requireSuperAdmin, async (_req, res) => {
  try {
    const users = await User.find({ role: { $in: ['writer', 'superadmin'] } })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/writers', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { name, email, password, facebookId, permissions, role, isActive } = req.body
    const user = await User.create({
      name,
      email,
      password,
      facebookId: facebookId || '',
      role: role === 'superadmin' ? 'superadmin' : 'writer',
      permissions: permissions || { post: true },
      isActive: isActive !== false,
    })
    res.status(201).json(user.toSafeJSON())
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.put('/writers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    const existing = await User.findById(req.params.id)
    if (!existing) return res.status(404).json({ message: 'User not found' })
    if (existing.role === 'superadmin' && String(req.user._id) !== String(existing._id)) {
      if (req.body.role && req.body.role !== 'superadmin') {
        const others = await User.countDocuments({ role: 'superadmin', _id: { $ne: existing._id } })
        if (!others) return res.status(400).json({ message: 'Cannot downgrade the last Super Admin' })
      }
      if (req.body.isActive === false) {
        const others = await User.countDocuments({
          role: 'superadmin',
          isActive: true,
          _id: { $ne: existing._id },
        })
        if (!others) return res.status(400).json({ message: 'Cannot deactivate the last Super Admin' })
      }
    }
    const update = { ...req.body }
    delete update.password
    if (req.body.password) {
      existing.password = req.body.password
      Object.assign(existing, update)
      await existing.save()
      return res.json(existing.toSafeJSON())
    }
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-password')
    if (!user) return res.status(404).json({ message: 'User not found' })
    res.json(user)
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

router.delete('/writers/:id', requireAuth, requireSuperAdmin, async (req, res) => {
  try {
    if (String(req.user._id) === String(req.params.id)) {
      return res.status(400).json({ message: 'Cannot delete your own account' })
    }
    const user = await User.findById(req.params.id)
    if (!user) return res.status(404).json({ message: 'User not found' })
    if (user.role === 'superadmin') {
      const others = await User.countDocuments({ role: 'superadmin', _id: { $ne: user._id } })
      if (!others) return res.status(400).json({ message: 'Cannot delete the last Super Admin' })
    }
    await user.deleteOne()
    res.json({ message: 'Writer deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
