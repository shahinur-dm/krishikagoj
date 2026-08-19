import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const empty = {
  name: '',
  email: '',
  password: '',
  facebookId: '',
  role: 'writer',
  isActive: true,
  permissions: {
    post: true,
    category: false,
    allpost: false,
    setting: false,
    gallery: false,
    role: false,
    ads: false,
  },
}

export default function WritersPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setItems(await api.getWriters())
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        const payload = { ...form }
        if (!payload.password) delete payload.password
        await api.updateWriter(editingId, payload)
        flash('রাইটার আপডেট হয়েছে')
      } else {
        await api.createWriter(form)
        flash('রাইটার যোগ হয়েছে')
      }
      setEditingId(null)
      setForm(empty)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('রাইটার মুছে ফেলবেন?')) return
    try {
      await api.deleteWriter(id)
      flash('মুছে ফেলা হয়েছে')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function toggleActive(item) {
    try {
      await api.updateWriter(item._id, { isActive: !item.isActive })
      flash(item.isActive ? 'অ্যাকাউন্ট নিষ্ক্রিয়' : 'অ্যাকাউন্ট অনুমোদিত / সক্রিয়')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'রাইটার সম্পাদনা' : 'নতুন রাইটার'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>নাম *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>ইমেইল *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                  disabled={!!editingId}
                />
              </div>
              <div className="admin-form-group">
                <label>পাসওয়ার্ড {editingId && '(খালি = অপরিবর্তিত)'}</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required={!editingId}
                />
              </div>
              <div className="admin-form-group">
                <label>রোল</label>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                >
                  <option value="writer">Writer</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>
            </div>
            <div className="admin-checkboxes">
              {[
                ['post', 'পোস্ট লিখতে পারবে'],
                ['allpost', 'সব পোস্ট দেখতে/এডিট পারবে'],
                ['category', 'ক্যাটাগরি ম্যানেজ'],
                ['gallery', 'গ্যালারি'],
                ['setting', 'সেটিং'],
                ['role', 'স্টাফ ম্যানেজ'],
                ['ads', 'বিজ্ঞাপন/এসইও'],
              ].map(([key, label]) => (
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
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                সক্রিয় (লগইন করতে পারবে)
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editingId ? 'আপডেট' : 'যোগ করুন'}
            </button>
            {editingId && (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setEditingId(null)
                  setForm(empty)
                }}
              >
                বাতিল
              </button>
            )}
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>রাইটার / ইউজার তালিকা ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>নাম</th>
                <th>ইমেইল</th>
                <th>রোল</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.isActive !== false ? 'সক্রিয়' : 'অপেক্ষমাণ/নিষ্ক্রিয়'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive ? 'নিষ্ক্রিয়' : 'অনুমোদন'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({
                          name: item.name,
                          email: item.email,
                          password: '',
                          facebookId: item.facebookId || '',
                          role: item.role,
                          isActive: item.isActive !== false,
                          permissions: {
                            ...empty.permissions,
                            ...(item.permissions || {}),
                          },
                        })
                      }}
                    >
                      সম্পাদনা
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      মুছুন
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
