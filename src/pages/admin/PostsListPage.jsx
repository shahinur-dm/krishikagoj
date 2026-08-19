import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, formatBnDate } from '../../api/client'
import SafeImage from '../../components/SafeImage'

export default function PostsListPage() {
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function load() {
    const data = await api.getAdminArticles()
    setItems(data)
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  async function handleDelete(id) {
    if (!confirm('পোস্ট মুছে ফেলবেন?')) return
    try {
      await api.deleteArticle(id)
      setMessage('পোস্ট মুছে ফেলা হয়েছে')
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
          <h3>সব পোস্ট ({items.length})</h3>
          <Link to="/admin/posts/new" className="admin-btn admin-btn-primary admin-btn-sm">
            + নতুন পোস্ট
          </Link>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>ছবি</th>
                <th>শিরোনাম</th>
                <th>ক্যাটাগরি</th>
                <th>সাব</th>
                <th>লেখক</th>
                <th>স্ট্যাটাস</th>
                <th>তারিখ</th>
                <th>ভিউ</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.image ? <SafeImage src={item.image} alt="" className="thumb" /> : '—'}</td>
                  <td>{item.title}</td>
                  <td>{item.category?.name || '—'}</td>
                  <td>{item.subcategory?.nameBn || '—'}</td>
                  <td>{item.authorUser?.name || item.author || '—'}</td>
                  <td>{item.isPublished !== false ? 'প্রকাশিত' : 'ড্রাফট'}</td>
                  <td>{formatBnDate(item.publishedAt || item.createdAt)}</td>
                  <td>{item.views || 0}</td>
                  <td className="admin-table-actions">
                    <Link
                      to={`/admin/posts/${item._id}`}
                      className="admin-btn admin-btn-sm admin-btn-primary"
                    >
                      সম্পাদনা
                    </Link>
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
