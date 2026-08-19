import jwt from 'jsonwebtoken'
import User from '../models/User.js'

const JWT_SECRET = process.env.JWT_SECRET || 'krishikajosh-secret-change-me'

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.warn('[security] JWT_SECRET is not set — using insecure default. Set JWT_SECRET in Vercel env.')
}

export function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
}

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || ''
    const token = header.startsWith('Bearer ') ? header.slice(7) : null
    if (!token) return res.status(401).json({ message: 'Login required' })

    const payload = jwt.verify(token, JWT_SECRET)
    const user = await User.findById(payload.id)
    if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid session' })

    req.user = user
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' })
  }
}

export function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' })
  }
  next()
}

/** Superadmin bypasses; writers need matching permissions flag */
export function requirePermission(...keys) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Login required' })
    if (req.user.role === 'superadmin') return next()
    const perms = req.user.permissions || {}
    const ok = keys.some((k) => perms[k] === true)
    if (!ok) return res.status(403).json({ message: 'Permission denied' })
    next()
  }
}

export function isSuperAdmin(user) {
  return user?.role === 'superadmin'
}

export function canSeeAllPosts(user) {
  return isSuperAdmin(user) || user?.permissions?.allpost === true
}
