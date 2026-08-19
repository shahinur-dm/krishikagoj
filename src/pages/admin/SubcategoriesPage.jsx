import { useEffect, useState } from 'react'
import { api } from '../../api/client'

const empty = { nameBn: '', nameEn: '', slug: '', category: '', order: 0, isActive: true }

export default function SubcategoriesPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const [subs, cats] = await Promise.all([api.getAllSubcategories(), api.getAllCategories()])
    setItems(subs)
    setCategories(cats.filter((c) => c.slug !== 'home'))
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      nameBn: item.nameBn,
      nameEn: item.nameEn || '',
      slug: item.slug,
      category: item.category?._id || item.category,
      order: item.order || 0,
      isActive: item.isActive !== false,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.updateSubcategory(editingId, form)
        flash('সাবক্যাটাগরি আপডেট হয়েছে')
      } else {
        await api.createSubcategory(form)
        flash('সাবক্যাটাগরি যোগ হয়েছে')
      }
      resetForm()
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('মুছে ফেলবেন? লিংকড আর্টিকেল থাকলে মুছা যাবে না।')) return
    try {
      await api.deleteSubcategory(id)
      flash('মুছে ফেলা হয়েছে')
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
          <h3>{editingId ? 'সাবক্যাটাগরি সম্পাদনা' : 'নতুন সাবক্যাটাগরি'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>নাম (বাংলা) *</label>
                <input
                  value={form.nameBn}
                  onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>নাম (ইংরেজি)</label>
                <input
                  value={form.nameEn}
                  onChange={(e) => setForm({ ...form, nameEn: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>স্লাগ *</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>ক্যাটাগরি *</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  required
                >
                  <option value="">নির্বাচন করুন</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
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
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              সক্রিয়
            </label>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                {editingId ? 'আপডেট' : 'যোগ করুন'}
              </button>
              {editingId && (
                <button type="button" className="admin-btn admin-btn-secondary" onClick={resetForm}>
                  বাতিল
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>সব সাবক্যাটাগরি ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>নাম</th>
                <th>ক্যাটাগরি</th>
                <th>স্লাগ</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.nameBn}</td>
                  <td>{item.category?.name || '—'}</td>
                  <td>{item.slug}</td>
                  <td>{item.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => startEdit(item)}
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
