import handler from './index.js'

export default function pathHandler(req, res) {
  const parts = req.query?.path
  const suffix = Array.isArray(parts) ? parts.filter(Boolean).join('/') : String(parts || '')
  const raw = String(req.url || '')
  const qs = raw.includes('?') ? raw.slice(raw.indexOf('?')) : ''
  if (suffix) req.url = `/api/${suffix}${qs}`
  return handler(req, res)
}
