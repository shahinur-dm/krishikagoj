import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import ImageUploadField from '../../components/admin/ImageUploadField'
import SafeImage from '../../components/SafeImage'

const empty = {
  name: '',
  designation: '',
  image: '',
  link: '',
  type: 'Staff',
  order: 0,
  isActive: true,
}

export default function StaffPage() {
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    setItems(await api.getAdminStaff())
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
        await api.updateStaff(editingId, form)
        flash('আপডেট হয়েছে')
      } else {
        await api.createStaff(form)
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
    await api.deleteStaff(id)
    flash('মুছে ফেলা হয়েছে')
    await load()
  }

  return (
    <div>
      {message && <div className="admin-alert admin-alert-success">{message}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{editingId ? 'স্টাফ সম্পাদনা' : 'স্টাফ যোগ'}</h3>
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
                <label>পদবি</label>
                <input
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                />
              </div>
              <ImageUploadField
                label="ছবি"
                value={form.image}
                onChange={(url) => setForm({ ...form, image: url })}
              />
              <div className="admin-form-group">
                <label>প্রোফাইল / লিংক</label>
                <input
                  value={form.link}
                  onChange={(e) => setForm({ ...form, link: e.target.value })}
                  placeholder="https://"
                />
              </div>
              <div className="admin-form-group">
                <label>টাইপ</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                >
                  <option>Staff</option>
                  <option>Management</option>
                  <option>Advertisement</option>
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
          <h3>স্টাফ তালিকা ({items.length})</h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ছবি</th>
                <th>নাম</th>
                <th>পদবি</th>
                <th>টাইপ</th>
                <th>স্ট্যাটাস</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.image ? <SafeImage src={item.image} alt="" className="thumb" /> : '—'}</td>
                  <td>
                    {item.name}
                    {item.link ? (
                      <div>
                        <a href={item.link} target="_blank" rel="noreferrer" className="small">
                          লিংক
                        </a>
                      </div>
                    ) : null}
                  </td>
                  <td>{item.designation}</td>
                  <td>{item.type}</td>
                  <td>{item.isActive !== false ? 'সক্রিয়' : 'নিষ্ক্রিয়'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({
                          name: item.name,
                          designation: item.designation || '',
                          image: item.image || '',
                          link: item.link || '',
                          type: item.type,
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
