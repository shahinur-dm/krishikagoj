import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const empty = { websiteName: '', websiteLink: '', order: 0, isActive: true }

export default function ImportantWebsitesPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setItems(await api.getAdminWebsites())
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
    try {
      if (editingId) {
        await api.updateWebsite(editingId, form)
        flash('আপডেট হয়েছে')
      } else {
        await api.createWebsite(form)
        flash('যোগ হয়েছে')
      }
      setEditingId(null)
      setForm(empty)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('মুছে ফেলবেন?')) return
    await api.deleteWebsite(id)
    flash('মুছে ফেলা হয়েছে')
    await load()
  }

  return (
    <div>
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'ওয়েবসাইট সম্পাদনা' : 'গুরুত্বপূর্ণ ওয়েবসাইট যোগ'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>নাম *</label>
                <input
                  value={form.websiteName}
                  onChange={(e) => setForm({ ...form, websiteName: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>লিংক *</label>
                <input
                  value={form.websiteLink}
                  onChange={(e) => setForm({ ...form, websiteLink: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>অর্ডার</label>
                <input
                  type="number"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                />
              </div>
            </div>
            <label style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              সক্রিয়
            </label>
            <div style={{ marginTop: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingId ? 'আপডেট' : 'যোগ করুন'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>তালিকা ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>নাম</th>
                <th>লিংক</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.websiteName}</td>
                  <td>
                    <a href={item.websiteLink} target="_blank" rel="noreferrer">
                      {item.websiteLink}
                    </a>
                  </td>
                  <td>{item.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({
                          websiteName: item.websiteName,
                          websiteLink: item.websiteLink,
                          order: item.order || 0,
                          isActive: item.isActive !== false,
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
