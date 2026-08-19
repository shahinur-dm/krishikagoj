const API_URL = import.meta.env.VITE_API_URL || '/api'
const TOKEN_KEY = 'kk_token'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'same-origin',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`)
  }
  return data
}

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  changePassword: (body) =>
    request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
  getWriters: () => request('/auth/writers'),
  createWriter: (body) => request('/auth/writers', { method: 'POST', body: JSON.stringify(body) }),
  updateWriter: (id, body) =>
    request(`/auth/writers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWriter: (id) => request(`/auth/writers/${id}`, { method: 'DELETE' }),

  getDashboard: () => request('/dashboard'),

  getHome: () => request('/home'),

  getCategories: () => request('/categories'),
  getAllCategories: () => request('/categories/all'),
  getCategory: (idOrSlug) => request(`/categories/${idOrSlug}`),
  createCategory: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) =>
    request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  getSubcategories: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/subcategories${qs ? `?${qs}` : ''}`)
  },
  getAllSubcategories: () => request('/subcategories/all'),
  createSubcategory: (body) =>
    request('/subcategories', { method: 'POST', body: JSON.stringify(body) }),
  updateSubcategory: (id, body) =>
    request(`/subcategories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSubcategory: (id) => request(`/subcategories/${id}`, { method: 'DELETE' }),

  getArticles: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => [k, String(v)]),
    ).toString()
    return request(`/articles${qs ? `?${qs}` : ''}`)
  },
  getAdminArticles: () => request('/articles/admin/all'),
  getAdminArticle: (id) => request(`/articles/admin/${id}`),
  getArticle: (idOrSlug) => request(`/articles/${idOrSlug}`),
  createArticle: (body) => request('/articles', { method: 'POST', body: JSON.stringify(body) }),
  updateArticle: (id, body) =>
    request(`/articles/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteArticle: (id) => request(`/articles/${id}`, { method: 'DELETE' }),

  getSettings: () => request('/settings'),
  updateSettings: (body) => request('/settings', { method: 'PUT', body: JSON.stringify(body) }),

  getPhotos: () => request('/photos'),
  createPhoto: (body) => request('/photos', { method: 'POST', body: JSON.stringify(body) }),
  updatePhoto: (id, body) =>
    request(`/photos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),

  getVideos: () => request('/videos'),
  createVideo: (body) => request('/videos', { method: 'POST', body: JSON.stringify(body) }),
  updateVideo: (id, body) =>
    request(`/videos/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteVideo: (id) => request(`/videos/${id}`, { method: 'DELETE' }),

  getStaff: () => request('/staff'),
  getAdminStaff: () => request('/staff/admin/all'),
  createStaff: (body) => request('/staff', { method: 'POST', body: JSON.stringify(body) }),
  updateStaff: (id, body) =>
    request(`/staff/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteStaff: (id) => request(`/staff/${id}`, { method: 'DELETE' }),

  getWebsites: () => request('/websites'),
  getAdminWebsites: () => request('/websites/admin/all'),
  createWebsite: (body) => request('/websites', { method: 'POST', body: JSON.stringify(body) }),
  updateWebsite: (id, body) =>
    request(`/websites/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteWebsite: (id) => request(`/websites/${id}`, { method: 'DELETE' }),

  getAds: () => request('/ads/public'),
  getAdminAds: () => request('/ads/admin/all'),
  createAd: (body) => request('/ads', { method: 'POST', body: JSON.stringify(body) }),
  updateAd: (id, body) => request(`/ads/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAd: (id) => request(`/ads/${id}`, { method: 'DELETE' }),

  uploadImage: async (file) => {
    const form = new FormData()
    form.append('file', file)
    const headers = {}
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
    const res = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: form,
      credentials: 'same-origin',
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || `Upload failed (${res.status})`)
    return data
  },
}

export function articlePath(article) {
  if (!article) return '/news'
  const slug = article.slug || article.id || article._id
  return `/news/${slug}`
}

export function formatBnDate(value) {
  if (!value) return ''
  try {
    return new Intl.DateTimeFormat('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value))
  } catch {
    return ''
  }
}

export function mapArticle(a) {
  if (!a) return null
  const id = a._id
  const slug = a.slug || id
  return {
    id,
    title: a.title,
    titleEn: a.titleEn || '',
    slug,
    path: `/news/${slug}`,
    excerpt: a.excerpt,
    excerptEn: a.excerptEn || '',
    body: a.body,
    bodyEn: a.bodyEn || '',
    image: a.image,
    author: a.author,
    tags: a.tags || '',
    category: a.category?.slug || a.category,
    categoryName: a.category?.name || '',
    categoryNameEn: a.category?.nameEn || '',
    categoryId: a.category?._id || a.category,
    views: a.views || 0,
    featured: a.featured,
    headline: a.headline,
    latest: a.latest,
    popular: a.popular,
    date: formatBnDate(a.publishedAt || a.createdAt),
    publishedAt: a.publishedAt || a.createdAt,
    raw: a,
  }
}
