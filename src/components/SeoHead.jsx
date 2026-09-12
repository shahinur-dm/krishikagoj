import { useEffect } from 'react'

function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id)
  if (!data) {
    existing?.remove()
    return
  }
  const el = existing || document.createElement('script')
  el.type = 'application/ld+json'
  el.id = id
  el.textContent = JSON.stringify(data)
  if (!existing) document.head.appendChild(el)
}

function getProductionOrigin() {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin
    }
  }
  return 'https://krishikagoj.com'
}

function absoluteUrl(pathOrUrl, origin = getProductionOrigin()) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) {
    if (pathOrUrl.includes('krishikagoj-two.vercel.app')) {
      return pathOrUrl.replace('https://krishikagoj-two.vercel.app', 'https://krishikagoj.com')
    }
    return pathOrUrl
  }
  if (pathOrUrl.startsWith('data:')) return pathOrUrl
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/**
 * Dynamic SEO, Open Graph, and Twitter metadata management for client-side navigation.
 */
export default function SeoHead({
  title,
  description,
  keywords,
  author,
  image,
  type = 'website',
  canonical,
  noIndex = false,
  jsonLd,
  siteName = 'কৃষিকাগজ',
}) {
  useEffect(() => {
    const prodOrigin = getProductionOrigin()
    const fullTitle = title || siteName
    const desc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 200)
    let url = canonical || (typeof window !== 'undefined' ? window.location.href.split('?')[0] : '')
    if (url.includes('krishikagoj-two.vercel.app')) {
      url = url.replace('https://krishikagoj-two.vercel.app', 'https://krishikagoj.com')
    } else if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      url = `${prodOrigin}${window.location.pathname}`
    }
    const absImage = image ? absoluteUrl(image, prodOrigin) : ''

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    if (keywords) upsertMeta('name', 'keywords', keywords)
    if (author) upsertMeta('name', 'author', author)
    upsertMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow')

    // Open Graph
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:title', title || siteName)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:type', type)
    if (absImage) {
      upsertMeta('property', 'og:image', absImage)
      upsertMeta('property', 'og:image:secure_url', absImage)
    }

    // Twitter / X
    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title || siteName)
    upsertMeta('name', 'twitter:description', desc)
    if (absImage) {
      upsertMeta('name', 'twitter:image', absImage)
    }

    upsertLink('canonical', url)
    upsertJsonLd('kk-jsonld', jsonLd || null)
  }, [title, description, keywords, author, image, type, canonical, noIndex, jsonLd, siteName])

  return null
}

export function absoluteUrlExport(pathOrUrl) {
  if (typeof window === 'undefined') return pathOrUrl
  return absoluteUrl(pathOrUrl)
}
