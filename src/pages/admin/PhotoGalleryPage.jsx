import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import SafeImage from '../../components/SafeImage'

const empty = { title: '', photo: '', type: 'Big Photo' }

export default function PhotoGalleryPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setItems(await api.getPhotos())
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
    if (!form.photo) {
      setError('ফটো আপলোড করুন')
      return
    }
    try {
      if (editingId) {
        await api.updatePhoto(editingId, form)
        flash('আপডেট হয়েছে')
      } else {
        await api.createPhoto(form)
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
    await api.deletePhoto(id)
    flash('মুছে ফেলা হয়েছে')
    await load()
  }

  return (
    <div>
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'ফটো সম্পাদনা' : 'ফটো যোগ'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>শিরোনাম</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>
              <ImageUploadField
                label="ফটো"
                value={form.photo}
                onChange={(url) => setForm({ ...form, photo: url })}
                required
              />
              <div className="admin-form-group">
                <label>টাইপ</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Big Photo</option>
                  <option>Small Photo</option>
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
          <h3>ফটো গ্যালারি ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ছবি</th>
                <th>শিরোনাম</th>
                <th>টাইপ</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>
                    <SafeImage src={item.photo} alt="" className="thumb" />
                  </td>
                  <td>{item.title}</td>
                  <td>{item.type}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({ title: item.title, photo: item.photo, type: item.type })
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
