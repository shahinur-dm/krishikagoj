import { Router } from 'express'
import User from '../models/User.js'
import { requireAuth, requirePermission } from '../middleware/auth.js'
import { ROLE_META, ROLES, defaultsForRole, defaultActionsForRole, PERMISSION_MODULES } from '../lib/permissions.js'

const router = Router()

function normalizeUsername(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '')
}

function pickPermissions(body, role) {
  const base = defaultsForRole(role)
  const incoming = body.permissions && typeof body.permissions === 'object' ? body.permissions : {}
  const next = { ...base }
  for (const key of Object.keys(base)) {
    if (typeof incoming[key] === 'boolean') next[key] = incoming[key]
  }
  next.actions = incoming.actions && typeof incoming.actions === 'object' ? incoming.actions : defaultActionsForRole(role)
  return next
}

async function guardSuperAdmin(actor, target, { nextRole, nextActive, deleting } = {}) {
  if (!target) return { ok: true }
  if (target.role !== 'superadmin') return { ok: true }
  if (actor.role !== 'superadmin') {
    return { ok: false, status: 403, message: 'Cannot change a Super Admin account' }
  }
  if (deleting) {
    if (String(actor._id) === String(target._id)) {
      return { ok: false, status: 400, message: 'Cannot delete your own account' }
    }
    const others = await User.countDocuments({ role: 'superadmin', _id: { $ne: target._id } })
    if (!others) return { ok: false, status: 400, message: 'Cannot delete the last Super Admin' }
  }
  if (nextActive === false) {
    const others = await User.countDocuments({
      role: 'superadmin',
      isActive: true,
      _id: { $ne: target._id },
    })
    if (!others) return { ok: false, status: 400, message: 'Cannot deactivate the last Super Admin' }
  }
  if (nextRole && nextRole !== 'superadmin') {
    const others = await User.countDocuments({ role: 'superadmin', _id: { $ne: target._id } })
    if (!others) return { ok: false, status: 400, message: 'Cannot downgrade the last Super Admin' }
  }
  return { ok: true }
}

function canManageUsers(user) {
  return user?.role === 'superadmin' || user?.permissions?.users === true || user?.permissions?.role === true
}

router.use(requireAuth, requirePermission('users', 'role'))

router.get('/meta', (_req, res) => {
  res.json({ roles: ROLE_META, modules: PERMISSION_MODULES })
})

router.get('/', async (req, res) => {
  try {
    if (!canManageUsers(req.user)) return res.status(403).json({ message: 'Permission denied' })
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean()
    res.json(users)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, role, isActive, username } = req.body
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password required' })
    }
    if (passwordConfirm != null && password !== passwordConfirm) {
      return res.status(400).json({ message: 'Password confirmation does not match' })
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }
    const nextRole = ROLES.includes(role) ? role : 'writer'
    if (nextRole === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only Super Admin can create Super Admin' })
    }
    const uname = normalizeUsername(username)
    if (uname) {
      const taken = await User.findOne({ username: uname })
      if (taken) return res.status(400).json({ message: 'Username already taken' })
    }
    const user = await User.create({
      name: String(name).trim(),
      username: uname,
      email: String(email).toLowerCase().trim(),
      password,
      role: nextRole,
      isActive: isActive !== false,
      permissions: pickPermissions(req.body, nextRole),
    })
    res.status(201).json(user.toSafeJSON())
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email or username already exists' })
    res.status(400).json({ message: err.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const target = await User.findById(req.params.id)
    if (!target) return res.status(404).json({ message: 'User not found' })

    const nextRole = req.body.role && ROLES.includes(req.body.role) ? req.body.role : target.role
    const nextActive = req.body.isActive === undefined ? target.isActive : !!req.body.isActive
    const guard = await guardSuperAdmin(req.user, target, { nextRole, nextActive })
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message })

    if (nextRole === 'superadmin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only Super Admin can assign Super Admin' })
    }
    if (req.user.role !== 'superadmin' && target.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot change a Super Admin account' })
    }

    if (req.body.name !== undefined) target.name = String(req.body.name).trim()
    if (req.body.email !== undefined) target.email = String(req.body.email).toLowerCase().trim()
    if (req.body.username !== undefined) {
      const uname = normalizeUsername(req.body.username)
      if (uname && uname !== target.username) {
        const taken = await User.findOne({ username: uname, _id: { $ne: target._id } })
        if (taken) return res.status(400).json({ message: 'Username already taken' })
      }
      target.username = uname
    }
    if (req.body.role !== undefined) target.role = nextRole
    if (req.body.isActive !== undefined) target.isActive = nextActive
    if (req.body.permissions) target.permissions = pickPermissions(req.body, target.role)
    if (req.body.password) {
      if (req.body.passwordConfirm != null && req.body.password !== req.body.passwordConfirm) {
        return res.status(400).json({ message: 'Password confirmation does not match' })
      }
      target.password = req.body.password
    }
    await target.save()
    res.json(target.toSafeJSON())
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Email or username already exists' })
    res.status(400).json({ message: err.message })
  }
})

router.delete('/:id', requirePermission('users', 'role'), async (req, res) => {
  try {
    const target = await User.findById(req.params.id)
    if (!target) return res.status(404).json({ message: 'User not found' })
    const guard = await guardSuperAdmin(req.user, target, { deleting: true })
    if (!guard.ok) return res.status(guard.status).json({ message: guard.message })
    if (req.user.role !== 'superadmin' && target.role === 'superadmin') {
      return res.status(403).json({ message: 'Cannot delete a Super Admin account' })
    }
    await target.deleteOne()
    res.json({ message: 'User deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

export default router
