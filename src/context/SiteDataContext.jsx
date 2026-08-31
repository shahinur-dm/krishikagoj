import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { api, mapArticle } from '../api/client'

const SiteDataContext = createContext(null)
export { SiteDataContext }
const CACHE_KEY = 'kk_home_cache_v41'

function clearHomeCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
  try {
    sessionStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}

let siteRefreshFn = null

export function refreshSiteData() {
  return siteRefreshFn ? siteRefreshFn() : Promise.resolve()
}
const FRESH_MS = 120_000
const STALE_MS = 30 * 60_000

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.at || !parsed?.data) return null
    const age = Date.now() - parsed.at
    if (age > STALE_MS) return null
    return { data: parsed.data, fresh: age <= FRESH_MS }
  } catch {
    return null
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
  } catch {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }))
    } catch {
      /* ignore */
    }
  }
}

function mapSlot(a) {
  return a ? mapArticle(a) : null
}

function normalize(data) {
  const categories = (data.categories || []).filter((c) => c.slug && c.slug !== 'home')
  const rawLead = data.leadLayout
  return {
    categories: data.categories || [],
    contentCategories: categories,
    headlines: (data.headlines || []).map(mapArticle),
    featured: (data.featured || []).map(mapArticle),
    latest: (data.latest || []).map(mapArticle),
    popular: (data.popular || []).map(mapArticle),
    recent: (data.recent || data.latest || []).map(mapArticle),
    leadLayout: rawLead
      ? {
          lead: mapSlot(rawLead.lead),
          grid: (rawLead.grid || []).map(mapSlot),
          mid: (rawLead.mid || []).map(mapSlot),
          story: mapSlot(rawLead.story),
          storyList: (rawLead.storyList || []).map(mapSlot),
        }
      : null,
    byCategory: data.byCategory || {},
    photos: data.photos || [],
    videos: data.videos || [],
    websites: data.websites || [],
    staff: data.staff || [],
    ads:
      data.settings?.adsEnabled === false || data.settings?.ads_enabled === false
        ? []
        : data.ads || [],
    settings: data.settings || null,
    categoryBlocks: categories.map((cat) => ({
      cat,
      articles: (data.byCategory?.[cat.slug] || []).map(mapArticle),
    })),
    topicGrid: (data.topicGrid || []).map((col) => ({
      ...col,
      items: (col.items || []).map(mapArticle).filter(Boolean),
    })),
    breakingNews: data.breakingNews || [],
  }
}

const empty = {
  categories: [],
  contentCategories: [],
  headlines: [],
  featured: [],
  latest: [],
  popular: [],
  recent: [],
  leadLayout: null,
  byCategory: {},
  photos: [],
  videos: [],
  websites: [],
  staff: [],
  ads: [],
  settings: null,
  categoryBlocks: [],
  topicGrid: [],
  breakingNews: [],
}

export function SiteDataProvider({ children }) {
  const cached = typeof window !== 'undefined' ? readCache() : null
  const [data, setData] = useState(() => (cached ? normalize(cached.data) : null))
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState('')
  const [subs, setSubs] = useState([])

  useEffect(() => {
    let alive = true

    async function loadHome() {
      try {
        if (!cached) setLoading(true)
        const home = await api.getHome()
        if (!alive) return
        writeCache(home)
        setData(normalize(home))
        setError('')

        const seo = home?.settings?.seo
        // Defaults applied once; page-level SeoHead overrides per route
        if (seo?.metaTitle && window.location.pathname === '/') {
          document.title = seo.metaTitle
        }
        const desc = document.querySelector('meta[name="description"]')
        if (desc && seo?.metaDescription && window.location.pathname === '/') {
          desc.setAttribute('content', seo.metaDescription)
        }
      } catch (err) {
        if (alive && !cached) setError(err.message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    async function loadSubs() {
      try {
        const subcategories = await api.getSubcategories()
        if (alive) setSubs(subcategories || [])
      } catch {
        /* ignore */
      }
    }

    loadHome()
    const t = setTimeout(loadSubs, 50)

    siteRefreshFn = async () => {
      clearHomeCache()
      const home = await api.getHome({ bust: Date.now() })
      writeCache(home)
      setData(normalize(home))
      const subcategories = await api.getSubcategories().catch(() => [])
      setSubs(subcategories || [])
    }

    return () => {
      alive = false
      clearTimeout(t)
      if (siteRefreshFn) siteRefreshFn = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo(
    () => ({
      ...(data || empty),
      subs,
      loading,
      error,
      ready: Boolean(data),
      refresh: refreshSiteData,
    }),
    [data, subs, loading, error],
  )

  return <SiteDataContext.Provider value={value}>{children}</SiteDataContext.Provider>
}

export function useSiteData() {
  const ctx = useContext(SiteDataContext)
  if (!ctx) throw new Error('useSiteData must be used within SiteDataProvider')
  return ctx
}
