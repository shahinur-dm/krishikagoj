import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const ROUTE_RULES = [
  { match: /^\/admin\/home$/, any: true },
  { match: /^\/admin\/home-lead/, perm: ['setting', 'post'] },
  { match: /^\/admin\/password/, any: true },
  { match: /^\/admin\/categories/, perm: 'category' },
  { match: /^\/admin\/subcategories/, perm: 'category' },
  { match: /^\/admin\/posts/, perm: 'post' },
  { match: /^\/admin\/photos/, perm: 'gallery' },
  { match: /^\/admin\/videos/, perm: 'gallery' },
  { match: /^\/admin\/staff/, perm: ['setting', 'role'] },
  { match: /^\/admin\/writers/, role: 'superadmin' },
  { match: /^\/admin\/seo/, perm: ['setting', 'ads'] },
  { match: /^\/admin\/ads/, perm: ['setting', 'ads'] },
  { match: /^\/admin\/(website|livetv|namaz|notice|social|important-websites)/, perm: 'setting' },
]

function allowed(user, pathname) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  if (pathname === '/admin' || pathname === '/admin/') return true
  const rule = ROUTE_RULES.find((r) => r.match.test(pathname))
  if (!rule) return true
  if (rule.any) return true
  if (rule.role && user.role !== rule.role) return false
  if (!rule.perm) return true
  const keys = Array.isArray(rule.perm) ? rule.perm : [rule.perm]
  const perms = user.permissions || {}
  return keys.some((k) => perms[k] === true)
}

export default function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <p>লোড হচ্ছে...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!allowed(user, location.pathname)) {
    return <Navigate to="/admin/home" replace />
  }

  return children
}
