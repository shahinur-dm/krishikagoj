import { useContext } from 'react'
import { Link } from 'react-router-dom'
import { SiteDataContext } from '../context/SiteDataContext'

export const LOGO_SRC = '/logo.png'

export function LogoMark({ className = 'logo-img', alt = 'কৃষিকাগজ', src }) {
  return (
    <img
      className={className}
      src={src || LOGO_SRC}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.getAttribute('src') === LOGO_SRC) return
        e.currentTarget.src = LOGO_SRC
      }}
    />
  )
}

function useLogoSrc() {
  const ctx = useContext(SiteDataContext)
  return ctx?.settings?.logo || LOGO_SRC
}

export function BrandLogo({ className = 'logo-img' }) {
  const logo = useLogoSrc()
  return <LogoMark className={className} src={logo} />
}

export function BrandLogoLink({ className = 'logo-link' }) {
  const logo = useLogoSrc()
  return (
    <Link to="/" className={className} aria-label="কৃষিকাগজ প্রচ্ছদ">
      <LogoMark className="logo-img img-fluid" src={logo} />
    </Link>
  )
}
