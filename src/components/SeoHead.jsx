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
 * Page title/description/JSON-LD only. Open Graph and Twitter tags live in
 * index.html so crawlers can read them without JavaScript.
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
    const fullTitle = title || siteName
    const desc = (description || '').replace(/\s+/g, ' ').trim().slice(0, 160)
    const url = canonical || window.location.href.split('?')[0]

    document.title = fullTitle
    upsertMeta('name', 'description', desc)
    if (keywords) upsertMeta('name', 'keywords', keywords)
    if (author) upsertMeta('name', 'author', author)
    upsertMeta('name', 'robots', noIndex ? 'noindex,nofollow' : 'index,follow')

    upsertLink('canonical', url)
    upsertJsonLd('kk-jsonld', jsonLd || null)
  }, [title, description, keywords, author, image, type, canonical, noIndex, jsonLd, siteName])

  return null
}

export function absoluteUrlExport(pathOrUrl) {
  if (typeof window === 'undefined') return pathOrUrl
  return absoluteUrl(pathOrUrl)
}
