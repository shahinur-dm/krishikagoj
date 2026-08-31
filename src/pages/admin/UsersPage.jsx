import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

export default function UsersPage() {
  const { isEn } = useLang()
  const { user: me } = useAuth()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    setItems(await api.getUsers())
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function toggleActive(item) {
    if (!confirm(item.isActive ? (isEn ? 'Deactivate this user?' : 'ইউজার নিষ্ক্রিয় করবেন?') : isEn ? 'Activate this user?' : 'ইউজার সক্রিয় করবেন?')) {
      return
    }
    try {
      await api.updateUser(item._id, { isActive: !item.isActive })
      flash(isEn ? 'Updated' : 'আপডেট হয়েছে')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(item) {
    if (!confirm(isEn ? 'Permanently delete this user?' : 'ইউজার স্থায়ীভাবে মুছবেন?')) return
    try {
      await api.deleteUser(item._id)
      flash(isEn ? 'Deleted' : 'মুছে ফেলা হয়েছে')
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
          <h3>
            {isEn ? 'Users' : 'ইউজার'} ({items.length})
          </h3>
          <Link to="/admin/users/new" className="admin-btn admin-btn-sm admin-btn-primary">
            {isEn ? 'Add new user' : 'নতুন ইউজার'}
          </Link>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isEn ? 'Name' : 'নাম'}</th>
                <th>{isEn ? 'Username' : 'ইউজারনেম'}</th>
                <th>{isEn ? 'Email' : 'ইমেইল'}</th>
                <th>{isEn ? 'Role' : 'রোল'}</th>
                <th>{isEn ? 'Status' : 'স্ট্যাটাস'}</th>
                <th>{isEn ? 'Actions' : 'অ্যাকশন'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.name}</td>
                  <td>{item.username || '—'}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.isActive !== false ? (isEn ? 'Active' : 'সক্রিয়') : isEn ? 'Inactive' : 'নিষ্ক্রিয়'}</td>
                  <td className="admin-table-actions">
                    <Link to={`/admin/users/${item._id}`} className="admin-btn admin-btn-sm admin-btn-primary">
                      {isEn ? 'Edit' : 'সম্পাদনা'}
                    </Link>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => toggleActive(item)}
                    >
                      {item.isActive ? (isEn ? 'Deactivate' : 'নিষ্ক্রিয়') : isEn ? 'Activate' : 'সক্রিয়'}
                    </button>
                    {String(me?._id) !== String(item._id) ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn-sm admin-btn-danger"
                        onClick={() => handleDelete(item)}
                      >
                        {isEn ? 'Delete' : 'মুছুন'}
                      </button>
                    ) : null}
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
