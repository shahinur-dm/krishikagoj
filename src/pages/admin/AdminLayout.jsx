import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'
import { LogoMark } from '../../components/BrandLogo'
import LangSwitch from '../../components/LangSwitch'
import '../../styles/admin.css'

const navItems = [
  { sectionKey: 'navMain' },
  { to: '/admin/home', labelKey: 'navDashboard', icon: '📊', any: true },
  { sectionKey: 'navContent' },
  { to: '/admin/categories', labelKey: 'navCategories', icon: '📁', perm: 'category' },
  { to: '/admin/subcategories', labelKey: 'navSubcategories', icon: '📂', perm: 'category' },
  { to: '/admin/posts/new', labelKey: 'navNewPost', icon: '✏️', perm: 'post' },
  { to: '/admin/posts', labelKey: 'navAllPosts', icon: '📰', perm: 'post' },
  { to: '/admin/home-lead', labelKey: 'navHomeLead', icon: '📌', perm: ['setting', 'post'] },
  { sectionKey: 'navGallery' },
  { to: '/admin/photos', labelKey: 'navPhotos', icon: '🖼️', perm: 'gallery' },
  { to: '/admin/videos', labelKey: 'navVideos', icon: '🎬', perm: 'gallery' },
  { sectionKey: 'navStaffSec' },
  { to: '/admin/staff', labelKey: 'navStaff', icon: '👥', perm: ['setting', 'role'] },
  { to: '/admin/writers', labelKey: 'navWriters', icon: '✍️', role: 'superadmin' },
  { sectionKey: 'navSettings' },
  { to: '/admin/password', labelKey: 'navPassword', icon: '🔒', any: true },
  { to: '/admin/website', labelKey: 'navWebsite', icon: '⚙️', perm: 'setting' },
  { to: '/admin/namaz', labelKey: 'navNamaz', icon: '🕌', perm: 'setting' },
  { to: '/admin/notice', labelKey: 'navNotice', icon: '📢', perm: 'setting' },
  { to: '/admin/social', labelKey: 'navSocial', icon: '🌐', perm: 'setting' },
  { to: '/admin/seo', labelKey: 'navSeo', icon: '🔍', perm: ['setting', 'ads'] },
  { to: '/admin/ads', labelKey: 'navAds', icon: '📢', perm: ['setting', 'ads'] },
  { to: '/admin/important-websites', labelKey: 'navWebsites', icon: '🔗', perm: 'setting' },
]

function canSee(user, item) {
  if (!user) return false
  if (item.any) return true
  if (user.role === 'superadmin') return true
  if (item.role && user.role !== item.role) return false
  if (!item.perm) return true
  const keys = Array.isArray(item.perm) ? item.perm : [item.perm]
  const perms = user.permissions || {}
  return keys.some((k) => perms[k] === true)
}

export default function AdminLayout() {
  const { user, logout } = useAuth()
  const { t, isEn } = useLang()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isPostEditor = pathname === '/admin/posts/new' || /^\/admin\/posts\/[^/]+$/.test(pathname)

  useEffect(() => {
    if (isPostEditor) setSidebarOpen(false)
  }, [isPostEditor])

  const visibleNav = useMemo(() => {
    const out = []
    let pendingSection = null
    for (const item of navItems) {
      if (item.sectionKey) {
        pendingSection = item
        continue
      }
      if (canSee(user, item)) {
        if (pendingSection) {
          out.push(pendingSection)
          pendingSection = null
        }
        out.push(item)
      }
    }
    return out
  }, [user])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className={`admin-wrapper${isPostEditor ? ' admin-wrapper--composer' : ''}`}>
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/admin/home" className="admin-sidebar-brand" aria-label={t.loginAdmin}>
          <LogoMark className="admin-brand-logo" />
          <p className="admin-brand-tag">{isEn ? 'Editorial desk' : 'সম্পাদকীয় ডেস্ক'}</p>
        </Link>
        <ul className="admin-nav">
          {visibleNav.map((item, i) =>
            item.sectionKey ? (
              <li key={`s-${i}`} className="admin-nav-section">
                {t[item.sectionKey]}
              </li>
            ) : (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) => (isActive ? 'active' : '')}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  {t[item.labelKey]}
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={t.menu}
            >
              ☰
            </button>
            <div className="admin-topbar-title">
              <h2>{t.adminPanel}</h2>
              <small>{isEn ? 'Krishikagos newsroom' : 'কৃষিকাগজ নিউজরুম'}</small>
            </div>
          </div>
          <div className="admin-topbar-actions">
            <LangSwitch />
            <span className="admin-user">
              {user?.name} ({user?.role})
            </span>
            <Link to="/" className="admin-btn admin-btn-sm admin-btn-secondary">
              {t.viewSite}
            </Link>
            <button type="button" className="admin-logout-btn" onClick={handleLogout}>
              {t.logout}
            </button>
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
