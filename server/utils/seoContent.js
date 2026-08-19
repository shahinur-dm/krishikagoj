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

export function slugify(text) {
  return (
    String(text)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\u0980-\u09FFa-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || `news-${Date.now()}`
  )
}

export function applyArticleSeoDefaults(data, { isCreate = false } = {}) {
  const out = { ...data }
  if (isCreate && !out.slug && out.title) {
    out.slug = `${slugify(out.title)}-${Date.now().toString().slice(-4)}`
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
  return out
}
