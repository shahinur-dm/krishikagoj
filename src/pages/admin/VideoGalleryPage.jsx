import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'

const empty = { title: '', embedCode: '', thumbnail: '', type: 'Video News' }

export default function VideoGalleryPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setItems(await api.getVideos())
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
        await api.updateVideo(editingId, form)
        flash('আপডেট হয়েছে')
      } else {
        await api.createVideo(form)
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
    await api.deleteVideo(id)
    flash('মুছে ফেলা হয়েছে')
    await load()
  }

  return (
    <div>
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'ভিডিও সম্পাদনা' : 'ভিডিও যোগ'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>শিরোনাম *</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>ইউটিউব Embed URL *</label>
                <input
                  value={form.embedCode}
                  onChange={(e) => setForm({ ...form, embedCode: e.target.value })}
                  placeholder="https://www.youtube.com/embed/..."
                  required
                />
              </div>
              <ImageUploadField
                label="থাম্বনেইল"
                value={form.thumbnail}
                onChange={(url) => setForm({ ...form, thumbnail: url })}
                hint="খালি রাখলে ইউটিউব থাম্ব ব্যবহার হবে"
              />
              <div className="admin-form-group">
                <label>টাইপ</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Video News</option>
                  <option>Entertainment</option>
                </select>
              </div>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editingId ? 'আপডেট' : 'যোগ করুন'}
            </button>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>ভিডিও গ্যালারি ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>শিরোনাম</th>
                <th>টাইপ</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({
                          title: item.title,
                          embedCode: item.embedCode,
                          thumbnail: item.thumbnail || '',
                          type: item.type,
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
