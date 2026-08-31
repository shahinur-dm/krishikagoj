export function makeSlug(nameEn = '', name = '', prefix = 'item') {
  const fromEn = String(nameEn || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (fromEn) return fromEn
  const fromName = String(name || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (fromName) return fromName
  return `${prefix}-${Date.now().toString(36)}`
}
