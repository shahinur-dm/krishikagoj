export const ROLES = ['superadmin', 'admin', 'editor', 'news_editor', 'writer']

export const PERMISSION_MODULES = [
  { key: 'post', labelBn: 'পোস্ট', labelEn: 'Posts' },
  { key: 'allpost', labelBn: 'সব পোস্ট', labelEn: 'All posts' },
  { key: 'category', labelBn: 'ক্যাটাগরি / সাবক্যাটাগরি', labelEn: 'Categories / subcategories' },
  { key: 'breaking', labelBn: 'ব্রেকিং নিউজ', labelEn: 'Breaking News' },
  { key: 'gallery', labelBn: 'গ্যালারি', labelEn: 'Gallery' },
  { key: 'setting', labelBn: 'সেটিংস', labelEn: 'Settings' },
  { key: 'ads', labelBn: 'বিজ্ঞাপন / এসইও', labelEn: 'Ads / SEO' },
  { key: 'users', labelBn: 'ইউজার', labelEn: 'Users' },
  { key: 'role', labelBn: 'রোল / স্টাফ', labelEn: 'Roles / staff' },
  { key: 'district', labelBn: 'জেলা', labelEn: 'District' },
]

export const ACTION_MODULES = {
  posts: { flag: 'post', actions: ['view', 'create', 'edit', 'delete', 'publish'] },
  categories: { flag: 'category', actions: ['view', 'create', 'edit', 'delete'] },
  subcategories: { flag: 'category', actions: ['view', 'create', 'edit', 'delete'] },
  breaking: { flag: 'breaking', actions: ['view', 'create', 'edit', 'delete', 'publish'] },
  gallery: { flag: 'gallery', actions: ['view', 'upload', 'edit', 'delete'] },
  users: { flag: 'users', actions: ['view', 'create', 'edit', 'delete'] },
  roles: { flag: 'role', actions: ['view', 'create', 'edit', 'delete'] },
  permissions: { flag: 'role', actions: ['view', 'edit'] },
}

export function defaultsForRole(role) {
  if (role === 'superadmin') {
    return {
      category: true,
      district: true,
      post: true,
      allpost: true,
      setting: true,
      gallery: true,
      ads: true,
      role: true,
      users: true,
      breaking: true,
    }
  }
  if (role === 'admin') {
    return {
      category: true,
      district: true,
      post: true,
      allpost: true,
      setting: true,
      gallery: true,
      ads: true,
      role: false,
      users: false,
      breaking: true,
    }
  }
  if (role === 'editor') {
    return {
      category: true,
      district: false,
      post: true,
      allpost: true,
      setting: false,
      gallery: true,
      ads: false,
      role: false,
      users: false,
      breaking: true,
    }
  }
  if (role === 'news_editor') {
    return {
      category: false,
      district: false,
      post: true,
      allpost: false,
      setting: false,
      gallery: false,
      ads: false,
      role: false,
      users: false,
      breaking: true,
    }
  }
  return {
    category: false,
    district: false,
    post: true,
    allpost: false,
    setting: false,
    gallery: false,
    ads: false,
    role: false,
    users: false,
    breaking: false,
  }
}

export function defaultActionsForRole(role) {
  const allTrue = (actions) => Object.fromEntries(actions.map((a) => [a, true]))
  const none = (actions) => Object.fromEntries(actions.map((a) => [a, false]))
  const out = {}
  for (const [mod, meta] of Object.entries(ACTION_MODULES)) {
    if (role === 'superadmin') out[mod] = allTrue(meta.actions)
    else if (role === 'admin' && !['users', 'roles', 'permissions'].includes(mod)) out[mod] = allTrue(meta.actions)
    else if (role === 'editor' && ['posts', 'categories', 'subcategories', 'breaking', 'gallery'].includes(mod)) {
      out[mod] = allTrue(meta.actions)
    } else if (role === 'news_editor' && ['posts', 'breaking'].includes(mod)) {
      out[mod] = { ...allTrue(meta.actions), delete: false }
    } else if (role === 'writer' && mod === 'posts') {
      out[mod] = { view: true, create: true, edit: true, delete: false, publish: false }
    } else {
      out[mod] = none(meta.actions)
    }
  }
  return out
}

export function hasModulePerm(user, ...keys) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  const perms = user.permissions || {}
  return keys.some((k) => perms[k] === true)
}

export function hasAction(user, module, action) {
  if (!user) return false
  if (user.role === 'superadmin') return true
  const explicit = user.permissions?.actions?.[module]?.[action]
  if (typeof explicit === 'boolean') return explicit
  const meta = ACTION_MODULES[module]
  if (!meta) return false
  if (action === 'delete' || action === 'publish') {
    if (module === 'posts') return user.permissions?.allpost === true || user.permissions?.post === true
  }
  return user.permissions?.[meta.flag] === true
}

export const ROLE_META = [
  {
    id: 'superadmin',
    nameBn: 'সুপার অ্যাডমিন',
    nameEn: 'Super Admin',
    descBn: 'সব মডিউল ও পারমিশন। ইউজার/রোল/পারমিশনসহ পুরো প্যানেল।',
    descEn: 'Full access to every module, including users, roles and permissions.',
  },
  {
    id: 'admin',
    nameBn: 'অ্যাডমিন',
    nameEn: 'Admin',
    descBn: 'কন্টেন্ট, ব্রেকিং নিউজ, গ্যালারি ও সেটিংস। ইউজার/পারমিশন ডিফল্টে নেই।',
    descEn: 'Content, breaking news, gallery and settings. No user/permission management by default.',
  },
  {
    id: 'editor',
    nameBn: 'এডিটর',
    nameEn: 'Editor',
    descBn: 'পোস্ট, ক্যাটাগরি, গ্যালারি ও ব্রেকিং নিউজ।',
    descEn: 'Posts, categories, gallery and breaking news.',
  },
  {
    id: 'news_editor',
    nameBn: 'নিউজ এডিটর',
    nameEn: 'News Editor',
    descBn: 'খবর ও ব্রেকিং নিউজ সম্পর্কিত কাজ।',
    descEn: 'News and breaking news related access.',
  },
  {
    id: 'writer',
    nameBn: 'রাইটার',
    nameEn: 'Writer',
    descBn: 'নিজের পোস্ট লেখা ও সম্পাদনা।',
    descEn: 'Write and edit own posts.',
  },
]
