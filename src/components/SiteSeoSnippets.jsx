import { useEffect, useRef } from 'react'
import { useSiteData } from '../context/SiteDataContext'

/** Applies site-wide SEO snippets: verification, GA, favicon, default keywords/author. */
export default function SiteSeoSnippets() {
  const { settings } = useSiteData()
  const gaDone = useRef('')

  useEffect(() => {
    if (!settings) return
    const seo = settings.seo || {}

    if (seo.googleVerification) {
      let el = document.head.querySelector('meta[name="google-site-verification"]')
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', 'google-site-verification')
        document.head.appendChild(el)
      }
      el.setAttribute('content', seo.googleVerification)
    }

    if (seo.metaAuthor) {
      let el = document.head.querySelector('meta[name="author"]')
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', 'author')
        document.head.appendChild(el)
      }
      el.setAttribute('content', seo.metaAuthor)
    }

    if (seo.metaKeyword) {
      let el = document.head.querySelector('meta[name="keywords"]')
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute('name', 'keywords')
        document.head.appendChild(el)
      }
      el.setAttribute('content', seo.metaKeyword)
    }

    const favicon = settings.favicon || settings.logo || '/logo.png'
    let icon = document.head.querySelector('link[rel="icon"]')
    if (!icon) {
      icon = document.createElement('link')
      icon.setAttribute('rel', 'icon')
      document.head.appendChild(icon)
    }
    icon.setAttribute('href', favicon)

    const ga = (seo.googleAnalytics || '').trim()
    if (ga && ga !== gaDone.current) {
      gaDone.current = ga
      if (ga.startsWith('G-') || ga.startsWith('UA-')) {
        const s1 = document.createElement('script')
        s1.async = true
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${ga}`
        document.head.appendChild(s1)
        const s2 = document.createElement('script')
        s2.id = 'kk-ga'
        s2.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${ga}');`
        document.head.appendChild(s2)
      } else if (ga.includes('<script')) {
        const wrap = document.createElement('div')
        wrap.innerHTML = ga
        Array.from(wrap.childNodes).forEach((node) => {
          if (node.tagName === 'SCRIPT') {
            const s = document.createElement('script')
            if (node.src) s.src = node.src
            s.textContent = node.textContent
            document.head.appendChild(s)
          }
        })
      }
    }
  }, [settings])

  return null
}
