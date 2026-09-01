import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import SafeImage from '../../components/SafeImage'
import { useLang } from '../../context/LanguageContext'
import { refreshSiteData } from '../../context/SiteDataContext'

const empty = { name: '', title: '', details: '', image: '', language: 'bn', status: 'published' }

export default function OpinionAdminPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  const isForm = Boolean(id) || pathname.endsWith('/new')
  return isForm ? <OpinionForm id={id} /> : <OpinionList />
}

function usePager(items, keys) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => keys.some((k) => String(it[k] || '').toLowerCase().includes(s)))
  }, [items, q, keys])
  const pages = Math.max(1, Math.ceil(filtered.length / 10))
  const safe = Math.min(page, pages)
  return {
    q,
    setQ,
    page: safe,
    setPage,
    pages,
    rows: filtered.slice((safe - 1) * 10, safe * 10),
    total: filtered.length,
  }
}

function OpinionList() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const pager = usePager(items, ['name', 'title', 'language', 'status'])

  async function load() {
    try {
      const data = await api.getOpinions()
      setItems(data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function remove(itemId) {
    if (!confirm(t.confirmDelete || 'মুছে ফেলতে চান?')) return
    try {
      await api.deleteOpinion(itemId)
      setMessage('মতামত মুছে ফেলা হয়েছে')
      setTimeout(() => setMessage(''), 2500)
      await load()
      await refreshSiteData().catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {message ? <div className="admin-alert admin-alert-success">{message}</div> : null}
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Opinion List</h3>
          <Link to="/admin/opinions/new" className="admin-btn admin-btn-primary">
            + Add new opinion
          </Link>
        </div>
        <div className="admin-card-body">
          <div className="pl-controls">
            <label className="pl-search">
              Search:
              <input value={pager.q} onChange={(e) => pager.setQ(e.target.value)} />
            </label>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SI</th>
                  <th>Name</th>
                  <th>Person image</th>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pager.rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No data available in table</td>
                  </tr>
                ) : (
                  pager.rows.map((item, i) => (
                    <tr key={item._id}>
                      <td>{(pager.page - 1) * 10 + i + 1}</td>
                      <td>{item.name}</td>
                      <td>{item.image ? <SafeImage src={item.image} alt="" className="thumb" style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: '50%' }} /> : '—'}</td>
                      <td>{item.title}</td>
                      <td>{item.language === 'en' ? 'English' : 'Bengali/Bangla'}</td>
                      <td>{item.status}</td>
                      <td className="admin-table-actions">
                        <Link className="admin-btn admin-btn-sm admin-btn-primary" to={`/admin/opinions/${item._id}`}>
                          Edit
                        </Link>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => remove(item._id)}>
                          {t.delete || 'Delete'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function OpinionForm({ id }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) api.getOpinion(id).then(setForm).catch((err) => setError(err.message))
  }, [id, isEdit])

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (isEdit) await api.updateOpinion(id, form)
      else await api.createOpinion(form)
      await refreshSiteData().catch(() => {})
      navigate('/admin/opinions')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isEdit ? 'Edit opinion' : 'Add New Opinion'}</h3>
          <Link to="/admin/opinions" className="admin-btn admin-btn-secondary">
            Back
          </Link>
        </div>
        <div className="admin-card-body">
          <form onSubmit={onSubmit}>
            <ImageUploadField label="Person image / লেখক ছবি" value={form.image} onChange={(image) => setForm({ ...form, image })} />
            <div className="admin-form-group">
              <label>Name (লেখক নাম) *</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>Title (মতামত শিরোনাম) *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>Details (বিস্তারিত)</label>
              <textarea rows={6} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Language</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option value="bn">Bengali/Bangla</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>Status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="published">Publish</option>
                  <option value="draft">Draft</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
              <button type="submit" className="admin-btn admin-btn-primary">
                Save
              </button>
              <Link to="/admin/opinions" className="admin-btn admin-btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
