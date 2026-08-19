import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatBnDate } from '../../api/client'
import SafeImage from '../../components/SafeImage'
import { useAuth } from '../../context/AuthContext'
import { useLang } from '../../context/LanguageContext'

function can(user, perm) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  const keys = Array.isArray(perm) ? perm : [perm]
  return keys.some((k) => user.permissions?.[k] === true)
}

function fmt(n, isEn) {
  try {
    return new Intl.NumberFormat(isEn ? 'en-US' : 'bn-BD').format(n || 0)
  } catch {
    return String(n || 0)
  }
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { t, isEn } = useLang()
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .getDashboard()
      .then(setStats)
      .catch((err) => setError(err.message))
  }, [])

  const links = useMemo(() => {
    const all = [
      { to: '/admin/posts/new', label: t.newPost, desc: t.newPostDesc, icon: '✏️', perm: 'post', tone: 'primary' },
      { to: '/admin/posts', label: t.navAllPosts, desc: t.allPostsDesc, icon: '📰', perm: 'post', tone: 'blue' },
      { to: '/admin/home-lead', label: t.navHomeLead, desc: t.homeLeadDesc, icon: '📌', perm: ['setting', 'post'], tone: 'teal' },
      { to: '/admin/categories', label: t.navCategories, desc: t.catDesc, icon: '📁', perm: 'category', tone: 'teal' },
      { to: '/admin/photos', label: t.navPhotos, desc: t.photoDesc, icon: '🖼️', perm: 'gallery', tone: 'purple' },
      { to: '/admin/videos', label: t.videos, desc: t.videoDesc, icon: '🎬', perm: 'gallery', tone: 'pink' },
      { to: '/admin/website', label: t.navWebsite, desc: t.siteDesc, icon: '⚙️', perm: 'setting', tone: 'slate' },
      { to: '/admin/writers', label: t.navWriters, desc: t.writerDesc, icon: '✍️', role: 'superadmin', tone: 'green' },
      { to: '/', label: t.viewSite, desc: t.siteLiveDesc, icon: '🌐', any: true, tone: 'gold' },
    ]
    return all.filter((l) => {
      if (l.any) return true
      if (l.role) return user?.role === l.role || user?.role === 'superadmin'
      return can(user, l.perm)
    })
  }, [user, t])

  if (error) return <div className="admin-alert admin-alert-error">{error}</div>
  if (!stats) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    )
  }

  const maxCat = Math.max(1, ...(stats.byCategory || []).map((c) => c.count))
  const hour = new Date().getHours()
  const greet = hour < 12 ? t.greetMorning : hour < 18 ? t.greetAfternoon : t.greetEvening

  const heroCards = [
    { label: t.totalPosts, value: stats.posts, sub: `${fmt(stats.published, isEn)} ${t.published}`, icon: '📰', tone: 'blue' },
    { label: t.totalViews, value: stats.totalViews, sub: t.viewsSum, icon: '👁️', tone: 'green' },
    { label: t.todayPosts, value: stats.postsToday, sub: `${t.in7days} ${fmt(stats.postsThisWeek, isEn)}`, icon: '📅', tone: 'orange' },
    { label: t.drafts, value: stats.drafts, sub: `${fmt(stats.pendingWriters, isEn)} ${t.pendingWriters}`, icon: '📝', tone: 'rose' },
  ]

  const miniCards = [
    { label: t.navCategories, value: stats.categories, to: '/admin/categories', icon: '📁' },
    { label: t.navSubcategories, value: stats.subcategories, to: '/admin/subcategories', icon: '📂' },
    { label: t.headlines, value: stats.headlines, to: '/admin/posts', icon: '⚡' },
    { label: t.featured, value: stats.featured, to: '/admin/posts', icon: '⭐' },
    { label: t.popular, value: stats.popular, to: '/admin/posts', icon: '🔥' },
    { label: t.photos, value: stats.photos, to: '/admin/photos', icon: '🖼️' },
    { label: t.videos, value: stats.videos, to: '/admin/videos', icon: '🎬' },
    { label: t.staff, value: stats.staff, to: '/admin/staff', icon: '👥' },
    { label: t.writers, value: stats.writers, to: '/admin/writers', icon: '✍️' },
    { label: t.websites, value: stats.websites, to: '/admin/important-websites', icon: '🔗' },
  ]

  return (
    <div className="dash">
      <section className="dash-hero">
        <div>
          <p className="dash-hero-greet">
            {greet}, {user?.name || 'অ্যাডমিন'}
          </p>
          <h1>{isEn ? 'Krishikagos dashboard' : 'কৃষিকাগজ ড্যাশবোর্ড'}</h1>
          <p className="dash-hero-sub">
            {isEn
              ? `Today · ${fmt(stats.published, isEn)} published · ${fmt(stats.totalViews, isEn)} views`
              : `আজকের সারাংশ · ${fmt(stats.published, isEn)} প্রকাশিত খবর · ${fmt(stats.totalViews, isEn)} ভিউ`}
          </p>
        </div>
        {can(user, 'post') && (
          <Link to="/admin/posts/new" className="dash-hero-cta">
            + {t.newPost}
          </Link>
        )}
      </section>

      <section className="dash-hero-grid">
        {heroCards.map((c) => (
          <article key={c.label} className={`dash-kpi dash-kpi-${c.tone}`}>
            <div className="dash-kpi-icon">{c.icon}</div>
            <div>
              <p className="dash-kpi-label">{c.label}</p>
              <h2>{fmt(c.value, isEn)}</h2>
              <span>{c.sub}</span>
            </div>
          </article>
        ))}
      </section>

      <section className="dash-mini-grid">
        {miniCards.map((c) => (
          <Link key={c.label} to={c.to} className="dash-mini">
            <span className="dash-mini-icon">{c.icon}</span>
            <strong>{fmt(c.value, isEn)}</strong>
            <span>{c.label}</span>
          </Link>
        ))}
      </section>

      <div className="dash-main-grid">
        <section className="admin-card dash-panel">
          <div className="admin-card-header">
            <h3>সাম্প্রতিক পোস্ট</h3>
            <Link to="/admin/posts" className="admin-btn admin-btn-sm admin-btn-secondary">
              সব দেখুন
            </Link>
          </div>
          <div className="admin-card-body dash-table-wrap">
            {(stats.recentPosts || []).length === 0 ? (
              <p className="dash-empty">এখনো কোনো পোস্ট নেই।</p>
            ) : (
              <table className="admin-table dash-table">
                <thead>
                  <tr>
                    <th>শিরোনাম</th>
                    <th>ক্যাটাগরি</th>
                    <th>স্ট্যাটাস</th>
                    <th>ভিউ</th>
                    <th>তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentPosts.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <Link to={`/admin/posts/${p._id}`} className="dash-post-link">
                          {p.image ? <SafeImage src={p.image} alt="" className="thumb" /> : null}
                          <span>{p.title}</span>
                        </Link>
                      </td>
                      <td>{p.category?.name || '—'}</td>
                      <td>
                        <span className={`dash-badge ${p.isPublished !== false ? 'ok' : 'draft'}`}>
                          {p.isPublished !== false ? 'প্রকাশিত' : 'ড্রাফট'}
                        </span>
                      </td>
                      <td>{fmt(p.views)}</td>
                      <td>{formatBnDate(p.publishedAt || p.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <aside className="dash-side">
          <section className="admin-card dash-panel">
            <div className="admin-card-header">
              <h3>ক্যাটাগরি অনুযায়ী</h3>
            </div>
            <div className="admin-card-body">
              {(stats.byCategory || []).length === 0 ? (
                <p className="dash-empty">ডেটা নেই</p>
              ) : (
                <ul className="dash-bars">
                  {stats.byCategory.map((c) => (
                    <li key={c._id || c.slug}>
                      <div className="dash-bars-meta">
                        <span>{c.name}</span>
                        <strong>{fmt(c.count)}</strong>
                      </div>
                      <div className="dash-bars-track">
                        <div
                          className="dash-bars-fill"
                          style={{ width: `${Math.round((c.count / maxCat) * 100)}%` }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section className="admin-card dash-panel">
            <div className="admin-card-header">
              <h3>সর্বাধিক পঠিত</h3>
            </div>
            <div className="admin-card-body">
              <ol className="dash-top-list">
                {(stats.topPosts || []).map((p, i) => (
                  <li key={p._id}>
                    <span className="dash-top-num">{fmt(i + 1)}</span>
                    <div>
                      <Link to={`/admin/posts/${p._id}`}>{p.title}</Link>
                      <small>
                        {p.category?.name || '—'} · {fmt(p.views)} ভিউ
                      </small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </aside>
      </div>

      <section className="admin-card dash-panel">
        <div className="admin-card-header">
          <h3>দ্রুত অ্যাকশন</h3>
        </div>
        <div className="admin-card-body dash-actions">
          {links.map((l) => (
            <Link key={l.to} to={l.to} className={`dash-action dash-action-${l.tone}`}>
              <span className="dash-action-icon">{l.icon}</span>
              <span>
                <strong>{l.label}</strong>
                <small>{l.desc}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
