import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client'
import { refreshSiteData } from '../../context/SiteDataContext'

const empty = {
  nameBn: '',
  nameEn: '',
  slug: '',
  category: '',
  order: 0,
  isActive: true,
  showOnHome: false,
  homeOrder: 0,
  homeFeatured: '',
  homeSecondary: ['', ''],
}

export default function SubcategoriesPage() {
  const [items, setItems] = useState([])
  const [categories, setCategories] = useState([])
  const [posts, setPosts] = useState([])
  const [gridLimit, setGridLimit] = useState(8)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const formRef = useRef(null)

  async function load() {
    const [subs, cats, settings, allPosts] = await Promise.all([
      api.getAllSubcategories(),
      api.getAllCategories(),
      api.getSettings().catch(() => null),
      api.getAdminArticles().catch(() => []),
    ])
    setItems(subs)
    setCategories(cats.filter((c) => c.slug !== 'home'))
    setGridLimit(Number(settings?.topicGridLimit) > 0 ? Number(settings.topicGridLimit) : 8)
    setPosts(allPosts || [])
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
      showOnHome: item.showOnHome === true,
      homeOrder: item.homeOrder || 0,
      homeFeatured: item.homeFeatured || '',
      homeSecondary: [item.homeSecondary?.[0] || '', item.homeSecondary?.[1] || ''],
    })
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function resetForm() {
    setEditingId(null)
    setForm(empty)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        homeSecondary: (form.homeSecondary || []).map((id) => String(id || '').trim()).filter(Boolean),
      }
      if (!String(payload.slug || '').trim()) {
        payload.slug = String(payload.nameEn || '')
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
      }
      if (editingId) {
        await api.updateSubcategory(editingId, payload)
        flash('সাবক্যাটাগরি আপডেট হয়েছে')
      } else {
        await api.createSubcategory(payload)
        flash('সাবক্যাটাগরি যোগ হয়েছে')
      }
      resetForm()
      await load()
      await refreshSiteData().catch(() => {})
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
      await refreshSiteData().catch(() => {})
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
          <h3>হোমপেজ টপিক গ্রিড</h3>
        </div>
        <div className="admin-card-body">
          <p style={{ marginTop: 0, color: '#64748b', fontSize: 14 }}>
            হোমপেজের ৪×২ ক্যাটাগরি কার্ডগুলো এখান থেকে নিয়ন্ত্রণ করুন। নতুন কার্ড যোগ করতে নিচের ফর্মে
            সাবক্যাটাগরি তৈরি করে “হোমপেজ গ্রিডে দেখান” টিক দিন। নিষ্ক্রিয় বা টিকহীন কার্ড খালি ঘর রেখে যাবে না।
          </p>
          <div className="admin-form-row">
            <div className="admin-form-group">
              <label>হোমপেজে সর্বোচ্চ কার্ড (ডিফল্ট ৮)</label>
              <input
                type="number"
                min={1}
                max={16}
                value={gridLimit}
                onChange={(e) => setGridLimit(Number(e.target.value) || 8)}
              />
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-primary"
            onClick={async () => {
              try {
                await api.updateTopicGridConfig({ topicGridLimit: gridLimit })
                flash('গ্রিড লিমিট সংরক্ষণ হয়েছে')
                await refreshSiteData().catch(() => {})
              } catch (err) {
                setError(err.message)
              }
            }}
          >
            লিমিট সেভ করুন
          </button>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'সাবক্যাটাগরি সম্পাদনা' : 'নতুন সাবক্যাটাগরি'}</h3>
        </div>
        <div className="admin-card-body" ref={formRef}>
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
                <label>স্লাগ</label>
                <input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="খালি রাখলে স্বয়ংক্রিয় তৈরি হবে"
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
              <div className="admin-form-group">
                <label>হোমপেজ পজিশন</label>
                <input
                  type="number"
                  min={1}
                  value={form.homeOrder}
                  onChange={(e) => setForm({ ...form, homeOrder: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>ফিচার্ড খবর</label>
                <select
                  value={form.homeFeatured}
                  onChange={(e) => setForm({ ...form, homeFeatured: e.target.value })}
                >
                  <option value="">স্বয়ংক্রিয় / সর্বশেষ</option>
                  {posts
                    .filter((p) => !form.category || String(p.category?._id || p.category) === String(form.category))
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>সেকেন্ডারি খবর ১</label>
                <select
                  value={form.homeSecondary[0] || ''}
                  onChange={(e) =>
                    setForm({ ...form, homeSecondary: [e.target.value, form.homeSecondary[1] || ''] })
                  }
                >
                  <option value="">স্বয়ংক্রিয়</option>
                  {posts
                    .filter((p) => !form.category || String(p.category?._id || p.category) === String(form.category))
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                </select>
              </div>
              <div className="admin-form-group">
                <label>সেকেন্ডারি খবর ২</label>
                <select
                  value={form.homeSecondary[1] || ''}
                  onChange={(e) =>
                    setForm({ ...form, homeSecondary: [form.homeSecondary[0] || '', e.target.value] })
                  }
                >
                  <option value="">স্বয়ংক্রিয়</option>
                  {posts
                    .filter((p) => !form.category || String(p.category?._id || p.category) === String(form.category))
                    .map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title}
                      </option>
                    ))}
                </select>
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
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8, marginLeft: 16 }}>
              <input
                type="checkbox"
                checked={form.showOnHome}
                onChange={(e) => setForm({ ...form, showOnHome: e.target.checked })}
              />
              হোমপেজ গ্রিডে দেখান
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
                <th>হোম</th>
                <th>পজিশন</th>
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
                  <td>{item.showOnHome ? 'হ্যাঁ' : 'না'}</td>
                  <td>{item.homeOrder || item.order || 0}</td>
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
