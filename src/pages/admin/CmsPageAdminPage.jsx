import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import { useLang } from '../../context/LanguageContext'

const empty = {
  language: 'bn',
  photo: '',
  videoUrl: '',
  title: '',
  slug: '',
  body: '',
  metaKeyword: '',
  metaDescription: '',
  status: 'published',
}

export default function CmsPageAdminPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  if (id || pathname.endsWith('/new')) return <PageForm id={id} />
  return <PageList />
}

function PageList() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [q, setQ] = useState('')

  useEffect(() => {
    api.getCmsPages().then(setItems).catch((err) => setError(err.message))
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => [it.title, it.slug].some((v) => String(v || '').toLowerCase().includes(s)))
  }, [items, q])

  async function remove(itemId) {
    if (!confirm(t.confirmDelete)) return
    await api.deleteCmsPage(itemId)
    setItems(await api.getCmsPages())
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Page List</h3>
          <Link to="/admin/pages/new" className="admin-btn admin-btn-primary">
            + Add New Page
          </Link>
        </div>
        <div className="admin-card-body">
          <label className="pl-search">
            Search:
            <input value={q} onChange={(e) => setQ(e.target.value)} />
          </label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SI</th>
                  <th>Title</th>
                  <th>Slug</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No data available in table</td>
                  </tr>
                ) : (
                  rows.map((item, i) => (
                    <tr key={item._id}>
                      <td>{i + 1}</td>
                      <td>{item.title}</td>
                      <td>{item.slug}</td>
                      <td>{item.language === 'en' ? 'English' : 'Bengali/Bangla'}</td>
                      <td>{item.status}</td>
                      <td className="admin-table-actions">
                        <a className="admin-btn admin-btn-sm" href={`/page/${item.slug}`} target="_blank" rel="noreferrer">
                          View
                        </a>
                        <Link className="admin-btn admin-btn-sm admin-btn-primary" to={`/admin/pages/${item._id}`}>
                          Edit
                        </Link>
                        <button type="button" className="admin-btn admin-btn-sm admin-btn-danger" onClick={() => remove(item._id)}>
                          {t.delete}
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

function PageForm({ id }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (isEdit) api.getCmsPage(id).then(setForm).catch((err) => setError(err.message))
  }, [id, isEdit])

  async function onSubmit(e) {
    e.preventDefault()
    try {
      if (isEdit) await api.updateCmsPage(id, form)
      else await api.createCmsPage(form)
      navigate('/admin/pages')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEdit ? 'Edit Page' : 'Add New Page'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={onSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Language *</label>
                <select value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                  <option value="en">English</option>
                  <option value="bn">Bengali/Bangla</option>
                </select>
              </div>
              <ImageUploadField label="Photo" hint="Note: jpg, png, jpeg and max size is 1mb" value={form.photo} onChange={(photo) => setForm({ ...form, photo })} />
              <div className="admin-form-group">
                <label>Video url</label>
                <input value={form.videoUrl} placeholder="Video url" onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} />
              </div>
            </div>
            <div className="admin-form-group">
              <label>Title *</label>
              <input value={form.title} placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>Page slug</label>
              <input value={form.slug} placeholder="page-slug" onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Details</label>
              <textarea rows={12} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Meta keyword</label>
              <input value={form.metaKeyword} placeholder="Meta keyword" onChange={(e) => setForm({ ...form, metaKeyword: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Meta description</label>
              <textarea rows={3} value={form.metaDescription} placeholder="Meta description" onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} />
            </div>
            <div className="admin-form-group">
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="published">Publish</option>
                <option value="draft">Draft</option>
              </select>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
