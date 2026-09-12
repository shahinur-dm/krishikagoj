/** Shared SEO / content helpers (server) */

export function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim()
}

export function makeExcerpt(body, max = 160) {
  const text = stripHtml(body)
  if (!text) return ''
  if (text.length <= max) return text
  return `${text.slice(0, max - 1).trim()}…`
}

export function slugifyLatin(text) {
  return (
    String(text || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
  )
}

export function slugify(text) {
  const latin = slugifyLatin(text)
  if (latin && latin.length >= 3) return latin
  return `news-${Date.now().toString(36)}`
}

export function applyArticleSeoDefaults(data, { isCreate = false } = {}) {
  const out = { ...data }
  if (isCreate && !out.slug) {
    const fromTitle = slugifyLatin(out.titleEn || '')
    if (fromTitle && fromTitle.length >= 3) {
      out.slug = `${fromTitle}-${Date.now().toString().slice(-4)}`
    } else {
      out.slug = `news-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    }
  } else if (out.slug) {
    const clean = slugifyLatin(out.slug)
    if (clean && clean.length >= 3) {
      out.slug = clean
    }
  }
  if (!out.excerpt && out.body) {
    out.excerpt = makeExcerpt(out.body, 160)
  }
  if (out.tags && typeof out.tags === 'string') {
    out.tags = out.tags
      .split(/[,،]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(', ')
  }
  if (Object.prototype.hasOwnProperty.call(out, 'metaDescription')) {
    out.metaDescription = String(out.metaDescription || '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500)
  }
  return out
}
