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

function absoluteUrl(pathOrUrl, origin = window.location.origin) {
  if (!pathOrUrl) return ''
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  if (pathOrUrl.startsWith('data:')) return pathOrUrl
  return `${origin}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`
}

/**
 * On-page SEO snippets: title, description, canonical, Open Graph, Twitter, JSON-LD.
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
    const origin = window.location.origin
    const fullTitle = title || siteName
    const desc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    const url = canonical || window.location.href.split('?')[0]
    const img = absoluteUrl(image || '/logo.png', origin)

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    if (keywords) upsertMeta('name', 'keywords', keywords)
    if (author) upsertMeta('name', 'author', author)
    upsertMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow')

    upsertLink('canonical', url)

    upsertMeta('property', 'og:locale', 'bn_BD')
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', desc)
    upsertMeta('property', 'og:url', url)
    upsertMeta('property', 'og:image', img)

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', fullTitle)
    upsertMeta('name', 'twitter:description', desc)
    upsertMeta('name', 'twitter:image', img)

    upsertJsonLd('kk-jsonld', jsonLd || null)
  }, [title, description, keywords, author, image, type, canonical, noIndex, jsonLd, siteName])

  return null
}

export function absoluteUrlExport(pathOrUrl) {
  if (typeof window === 'undefined') return pathOrUrl
  return absoluteUrl(pathOrUrl)
}
