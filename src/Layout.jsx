import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { SiteDataProvider, useSiteData } from './context/SiteDataContext'
import { useLang } from './context/LanguageContext'
import { SiteHeader } from './components/Header'
import Ticker from './components/Ticker'
import Footer from './components/Footer'
import SiteSeoSnippets from './components/SiteSeoSnippets'
import NavbarAdBanner from './components/NavbarAdBanner'
import BottomAdBox from './components/BottomAdBox'

function NoticeBar() {
  const { settings } = useSiteData()
  const notice = settings?.notice?.trim()
  if (!notice) return null
  return (
    <div className="site-notice-bar">
      <div className="container">
        <p className="mb-0">
          <i className="fa-solid fa-bullhorn me-2" />
          {notice}
        </p>
      </div>
    </div>
  )
}

function Shell() {
  const [showTop, setShowTop] = useState(false)
  const { settings } = useSiteData()
  const { t } = useLang()

  useEffect(() => {
    function onScroll() {
      setShowTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      className="site-shell"
      style={
        settings?.themeColor
          ? {
              '--bs-primary': settings.themeColor,
              '--brand-primary': settings.themeColor,
            }
          : {}
      }
    >
      <SiteSeoSnippets />
      <SiteHeader />
      <NavbarAdBanner />
      <NoticeBar />
      <Ticker />
      <main>
        <Outlet />
      </main>
      <Footer />
      <BottomAdBox />
      <button
        type="button"
        className={`back-top${showTop ? ' show' : ''}`}
        aria-label={t.backTop}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <i className="fa-solid fa-arrow-up" />
      </button>
    </div>
  )
}

export default function Layout() {
  return (
    <SiteDataProvider>
      <Shell />
    </SiteDataProvider>
  )
}
