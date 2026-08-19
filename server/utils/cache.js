const store = new Map()

export function cacheGet(key) {
  const hit = store.get(key)
  if (!hit) return null
  if (Date.now() > hit.expires) {
    store.delete(key)
    return null
  }
  return hit.value
}

export function cacheSet(key, value, ttlMs = 45000) {
  store.set(key, { value, expires: Date.now() + ttlMs })
  return value
}

export function cacheDel(prefix = '') {
  if (!prefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key)
  }
}
