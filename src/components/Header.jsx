import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'
import { BrandLogoLink, LogoMark, LOGO_SRC } from './BrandLogo'
import LangSwitch from './LangSwitch'

const DHAKA_TZ = 'Asia/Dhaka'

function formatDateStamp(date, locale, extra = {}) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: DHAKA_TZ,
    calendar: 'gregory',
    ...extra,
  }).format(date)
}

function StaticDateStrip({ now }) {
  const bn = formatDateStamp(now, 'bn-BD')
  const en = formatDateStamp(now, 'en-GB')
  const ar = formatDateStamp(now, 'ar', { numberingSystem: 'arab' })

  return (
    <div className="live-date-strip d-print-none">
      <div className="container">
        <div className="live-date-strip-inner">
          <span className="live-date-item" lang="bn">
            <span className="live-date-flag">বাংলা</span>
            {bn}
          </span>
          <span className="live-date-sep" aria-hidden="true" />
          <span className="live-date-item" lang="en">
            <span className="live-date-flag">EN</span>
            {en}
          </span>
          <span className="live-date-sep" aria-hidden="true" />
          <span className="live-date-item" lang="ar" dir="rtl">
            <span className="live-date-flag">عربي</span>
            {ar}
          </span>
        </div>
      </div>
    </div>
  )
}

export function SiteHeader() {
  const { categories, settings, subs } = useSiteData()
  const { t, text, isEn } = useLang()
  const navigate = useNavigate()
  const location = useLocation()
  const navRailRef = useRef(null)
  const [megaOpen, setMegaOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [q, setQ] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [now] = useState(() => new Date())

  const social = settings?.social || {}

  function runSearch(e) {
    e?.preventDefault?.()
    const term = q.trim()
    if (!term) return
    setSearchOpen(false)
    navigate(`/search?q=${encodeURIComponent(term)}`)
  }

  const navCats = useMemo(
    () => (categories || []).filter((c) => c.slug && c.slug !== 'home'),
    [categories],
  )

  const subMap = useMemo(() => {
    const map = {}
    ;(subs || []).forEach((s) => {
      const cid = s.category?._id || s.category
      if (!map[cid]) map[cid] = []
      map[cid].push(s)
    })
    return map
  }, [subs])

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 90)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const rail = navRailRef.current
    if (!rail) return
    const active = rail.querySelector('.nav-link.active')
    if (!active) return
    const target = active.offsetLeft - (rail.clientWidth - active.offsetWidth) / 2
    rail.scrollTo({ left: Math.max(0, target), behavior: 'smooth' })
  }, [location.pathname, navCats.length])

  useEffect(() => {
    document.body.style.overflow = megaOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [megaOpen])

  const displayDate = new Intl.DateTimeFormat(isEn ? 'en-GB' : 'bn-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: DHAKA_TZ,
  }).format(now)

  return (
    <header className={scrolled ? 'header-scrolled' : ''}>
      <div className="top-header header-desktop d-print-none">
        <div className="container">
          <div className="top-header-flex">
            <div className="main-logo">
              <BrandLogoLink />
            </div>

            <div className="main-links d-flex">
              <div className="nav-item d-none d-xl-block">
                <span className="nav-link">
                  <i className="fa-sharp fa-solid fa-table-list me-2" />
                  {t.todayPaper}
                </span>
              </div>
              <div className="nav-item d-none d-xl-block">
                <span className="nav-link">
                  <i className="fa-regular fa-newspaper me-2" />
                  {t.epaper}
                </span>
              </div>
              <div className="nav-item d-none d-lg-block">
                <span className="nav-link">
                  <i className="fa fa-book me-2" />
                  {t.magazine}
                </span>
              </div>
              <div className="nav-item d-none d-lg-block">
                <a className="nav-link" href={social.facebook || '#'} target="_blank" rel="noreferrer">
                  <i className="fa-solid fa-thumbs-up me-2" />
                  {t.social}
                </a>
              </div>
              <div className="nav-item d-none d-md-block">
                <Link to="/login" className="nav-link">
                  <i className="fa-solid fa-user me-2" />
                  {t.login}
                </Link>
              </div>
            </div>

            <div className="main-others">
              <LangSwitch className="d-none d-md-flex" />
              {searchOpen ? (
                <form className="search-area d-flex align-items-center" onSubmit={runSearch}>
                  <input
                    className="form-control"
                    placeholder={t.search}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary" aria-label="search">
                    <i className="fa-solid fa-magnifying-glass" />
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger ms-2 hide-search"
                    onClick={() => setSearchOpen(false)}
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </form>
              ) : (
                <div className="nav-item">
                  <button
                    type="button"
                    className="nav-link search-toggle-btn border-0"
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                  >
                    <i className="fa-solid fa-magnifying-glass" />
                  </button>
                </div>
              )}
              <div className="nav-item position-relative">
                <span className="nav-link notification-toggle">
                  <i className="fa-solid fa-bell" />
                  <span className="notification-toggle-badge" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="top-header header-mobile d-print-none">
        <div className="container">
          <div className="row align-items-center g-1">
            <div className="col-5 main-logo pe-1">
              <BrandLogoLink />
            </div>
            <div className="col-3 d-flex justify-content-center align-items-center">
              <LangSwitch className="lang-switch--compact" />
            </div>
            <div className="col-2 d-flex justify-content-center">
              <button
                type="button"
                className="nav-link search-toggle-btn border-0"
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
              >
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </div>
            <div className="col-2 d-flex justify-content-end">
              <button
                type="button"
                className="nav-link expend-navbar border-0"
                onClick={() => setMegaOpen(true)}
                aria-label="Menu"
              >
                <i className="fa-solid fa-bars" />
              </button>
            </div>
          </div>
          {searchOpen && (
            <form className="search-area d-flex align-items-center mt-2" onSubmit={runSearch}>
              <input
                className="form-control"
                placeholder={t.search}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <button type="submit" className="btn btn-primary ms-2">
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </form>
          )}
        </div>
      </div>

      <StaticDateStrip now={now} />

      <div className={`main-navbar d-print-none${scrolled ? ' fixed_nav is-sticky' : ''}`}>
        <div className="container">
          <div className="navbar-area d-flex align-items-center">
            <div className={`big-nav-logo${scrolled ? ' show' : ''}`}>
              <Link to="/" className="logo" aria-label="কৃষিকাগজ প্রচ্ছদ">
                <LogoMark src={LOGO_SRC} />
              </Link>
            </div>
            <ul className="navbar-links-area hide-scrollbar" ref={navRailRef}>
              <li className="nav-item nav-home">
                <NavLink
                  to="/"
                  end
                  aria-label={t.home}
                  title={t.home}
                  className={({ isActive }) => `nav-link animated${isActive ? ' active' : ''}`}
                >
                  <i className="fa-solid fa-house" aria-hidden="true" />
                </NavLink>
              </li>
              {navCats.map((cat) => {
                const catSubs = subMap[cat._id] || []
                if (catSubs.length) {
                  return (
                    <li key={cat._id} className="nav-item has-sub">
                      <NavLink
                        to={`/category/${cat.slug}`}
                        className={({ isActive }) => `nav-link animated${isActive ? ' active' : ''}`}
                      >
                        {text(cat.name, cat.nameEn)}
                        <i className="fa-solid fa-chevron-down ms-1 sub-caret" />
                      </NavLink>
                      <ul className="nav-submenu">
                        {catSubs.map((s) => (
                          <li key={s._id}>
                            <Link to={`/category/${cat.slug}?sub=${s.slug}`}>{text(s.nameBn, s.nameEn)}</Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  )
                }
                return (
                  <li key={cat._id} className="nav-item">
                    <NavLink
                      to={`/category/${cat.slug}`}
                      className={({ isActive }) => `nav-link animated${isActive ? ' active' : ''}`}
                    >
                      {text(cat.name, cat.nameEn)}
                    </NavLink>
                  </li>
                )
              })}
              <li className="nav-item d-none d-lg-block">
                <button
                  type="button"
                  className="nav-link border-0 bg-transparent"
                  onClick={() => setMegaOpen(true)}
                  aria-label="সব মেনু"
                >
                  <i className="fa-solid fa-bars" />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {megaOpen && (
        <div className="all-news-overlay" onClick={() => setMegaOpen(false)}>
          <div className="dropdown-menu all-news-links show" onClick={(e) => e.stopPropagation()}>
            <div className="tm-dt-area d-flex align-items-center justify-content-between w-100">
              <div className="small pe-2">{displayDate}</div>
              <button type="button" className="close-mb-nav border-0" onClick={() => setMegaOpen(false)}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="p-3">
              <div className="row g-3">
                {navCats.map((cat) => (
                  <div key={cat._id} className="col-6 col-md-4 col-lg-3">
                    <Link
                      to={`/category/${cat.slug}`}
                      className="fw-bold d-block mb-1"
                      onClick={() => setMegaOpen(false)}
                      style={{ color: 'var(--bs-primary)' }}
                    >
                      {text(cat.name, cat.nameEn)}
                    </Link>
                    <ul className="list-unstyled mb-0">
                      {(subMap[cat._id] || []).map((s) => (
                        <li key={s._id}>
                          <Link
                            to={`/category/${cat.slug}?sub=${s.slug}`}
                            onClick={() => setMegaOpen(false)}
                            className="small text-dark"
                          >
                            {text(s.nameBn, s.nameEn)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="border-top pt-2 mt-3">
                <Link to="/login" onClick={() => setMegaOpen(false)}>
                  {t.login}
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

export function TopBar() {
  return null
}
export function BrandHeader() {
  return null
}
export function MainNav() {
  return null
}
