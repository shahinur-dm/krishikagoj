import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'

const MODULES = [
  ['post', 'Posts / খবর'],
  ['allpost', 'All posts / সব পোস্ট'],
  ['category', 'Categories / ক্যাটাগরি'],
  ['breaking', 'Breaking News / ব্রেকিং নিউজ'],
  ['gallery', 'Gallery / গ্যালারি'],
  ['setting', 'Settings / সেটিংস'],
  ['ads', 'Ads / বিজ্ঞাপন'],
  ['users', 'Users / ইউজার'],
  ['role', 'Roles / রোল'],
]

const ACTIONS = {
  posts: ['view', 'create', 'edit', 'delete', 'publish'],
  categories: ['view', 'create', 'edit', 'delete'],
  subcategories: ['view', 'create', 'edit', 'delete'],
  breaking: ['view', 'create', 'edit', 'delete', 'publish'],
  gallery: ['view', 'upload', 'edit', 'delete'],
  users: ['view', 'create', 'edit', 'delete'],
  roles: ['view', 'create', 'edit', 'delete'],
  permissions: ['view', 'edit'],
}

function emptyPerms() {
  return {
    post: true,
    allpost: false,
    category: false,
    breaking: false,
    gallery: false,
    setting: false,
    ads: false,
    users: false,
    role: false,
    district: false,
    actions: Object.fromEntries(Object.entries(ACTIONS).map(([k, acts]) => [k, Object.fromEntries(acts.map((a) => [a, false]))])),
  }
}

const ROLE_PRESETS = {
  superadmin: {
    post: true,
    allpost: true,
    category: true,
    breaking: true,
    gallery: true,
    setting: true,
    ads: true,
    users: true,
    role: true,
    district: true,
  },
  admin: {
    post: true,
    allpost: true,
    category: true,
    breaking: true,
    gallery: true,
    setting: true,
    ads: true,
    users: false,
    role: false,
    district: true,
  },
  editor: {
    post: true,
    allpost: true,
    category: true,
    breaking: true,
    gallery: true,
    setting: false,
    ads: false,
    users: false,
    role: false,
    district: false,
  },
  news_editor: {
    post: true,
    allpost: false,
    category: false,
    breaking: true,
    gallery: false,
    setting: false,
    ads: false,
    users: false,
    role: false,
    district: false,
  },
  writer: {
    post: true,
    allpost: false,
    category: false,
    breaking: false,
    gallery: false,
    setting: false,
    ads: false,
    users: false,
    role: false,
    district: false,
  },
}

export default function UserFormPage() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { isEn } = useLang()
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'writer',
    isActive: true,
    permissions: emptyPerms(),
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    api
      .getUsers()
      .then((users) => {
        const item = users.find((u) => String(u._id) === String(id))
        if (!item) throw new Error(isEn ? 'User not found' : 'ইউজার পাওয়া যায়নি')
        setForm({
          name: item.name || '',
          username: item.username || '',
          email: item.email || '',
          password: '',
          passwordConfirm: '',
          role: item.role || 'writer',
          isActive: item.isActive !== false,
          permissions: {
            ...emptyPerms(),
            ...(item.permissions || {}),
            actions: { ...emptyPerms().actions, ...(item.permissions?.actions || {}) },
          },
        })
      })
      .catch((err) => setError(err.message))
  }, [id, isNew, isEn])

  function applyRole(role) {
    const preset = ROLE_PRESETS[role] || ROLE_PRESETS.writer
    setForm((f) => ({
      ...f,
      role,
      permissions: { ...f.permissions, ...preset },
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password || isNew) {
      if (form.password !== form.passwordConfirm) {
        setError(isEn ? 'Passwords do not match' : 'পাসওয়ার্ড মিলছে না')
        return
      }
    }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        username: form.username,
        email: form.email,
        role: form.role,
        isActive: form.isActive,
        permissions: form.permissions,
      }
      if (form.password) {
        payload.password = form.password
        payload.passwordConfirm = form.passwordConfirm
      }
      if (isNew) await api.createUser(payload)
      else await api.updateUser(id, payload)
      navigate('/admin/users')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>{isNew ? (isEn ? 'Add new user' : 'নতুন ইউজার') : isEn ? 'Edit user' : 'ইউজার সম্পাদনা'}</h3>
        <Link to="/admin/users" className="admin-btn admin-btn-sm admin-btn-secondary">
          {isEn ? 'Back' : 'ফিরে যান'}
        </Link>
      </div>
      <div className="admin-card-body">
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>{isEn ? 'Name' : 'নাম'} *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>{isEn ? 'Username' : 'ইউজারনেম'}</label>
              <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>{isEn ? 'Email' : 'ইমেইল'} *</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>{isEn ? 'Role' : 'রোল'}</label>
              <select value={form.role} onChange={(e) => applyRole(e.target.value)}>
                <option value="superadmin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
                <option value="news_editor">News Editor</option>
                <option value="writer">Writer</option>
              </select>
            </div>
          </div>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>
                {isEn ? 'Password' : 'পাসওয়ার্ড'} {isNew ? '*' : isEn ? '(blank = keep)' : '(খালি = অপরিবর্তিত)'}
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required={isNew}
                autoComplete="new-password"
              />
            </div>
            <div className="admin-form-group">
              <label>{isEn ? 'Confirm password' : 'পাসওয়ার্ড নিশ্চিত'}</label>
              <input
                type="password"
                value={form.passwordConfirm}
                onChange={(e) => setForm({ ...form, passwordConfirm: e.target.value })}
                required={isNew}
                autoComplete="new-password"
              />
            </div>
            <div className="admin-form-group">
              <label>{isEn ? 'Status' : 'স্ট্যাটাস'}</label>
              <select
                value={form.isActive ? '1' : '0'}
                onChange={(e) => setForm({ ...form, isActive: e.target.value === '1' })}
              >
                <option value="1">{isEn ? 'Active' : 'সক্রিয়'}</option>
                <option value="0">{isEn ? 'Inactive' : 'নিষ্ক্রিয়'}</option>
              </select>
            </div>
          </div>

          <h4 style={{ margin: '16px 0 8px' }}>{isEn ? 'Module permissions' : 'মডিউল পারমিশন'}</h4>
          <div className="admin-checkboxes">
            {MODULES.map(([key, label]) => (
              <label key={key}>
                <input
                  type="checkbox"
                  checked={!!form.permissions[key]}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      permissions: { ...form.permissions, [key]: e.target.checked },
                    })
                  }
                />
                {label}
              </label>
            ))}
          </div>

          <h4 style={{ margin: '16px 0 8px' }}>{isEn ? 'Custom actions' : 'কাস্টম অ্যাকশন'}</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <tbody>
                {Object.entries(ACTIONS).map(([mod, acts]) => (
                  <tr key={mod}>
                    <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{mod}</td>
                    <td>
                      {acts.map((act) => (
                        <label key={act} style={{ marginRight: 12 }}>
                          <input
                            type="checkbox"
                            checked={!!form.permissions.actions?.[mod]?.[act]}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                permissions: {
                                  ...form.permissions,
                                  actions: {
                                    ...form.permissions.actions,
                                    [mod]: {
                                      ...(form.permissions.actions?.[mod] || {}),
                                      [act]: e.target.checked,
                                    },
                                  },
                                },
                              })
                            }
                          />{' '}
                          {act}
                        </label>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button type="submit" className="admin-btn admin-btn-primary" disabled={saving} style={{ marginTop: 16 }}>
            {saving ? (isEn ? 'Saving...' : 'সেভ হচ্ছে...') : isNew ? (isEn ? 'Create user' : 'ইউজার তৈরি') : isEn ? 'Save' : 'সেভ করুন'}
          </button>
        </form>
      </div>
    </div>
  )
}
