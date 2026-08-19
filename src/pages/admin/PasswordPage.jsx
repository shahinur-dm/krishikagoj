import { useState } from 'react'
import { api } from '../../api/client'

export default function PasswordPage() {
  const [form, setForm] = useState({
    oldpass: '',
    password: '',
    password_confirmation: '',
  })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    try {
      const res = await api.changePassword(form)
      setMessage(res.message || 'পাসওয়ার্ড পরিবর্তন হয়েছে')
      setForm({ oldpass: '', password: '', password_confirmation: '' })
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="admin-card" style={{ maxWidth: 480 }}>
      <div className="admin-card-header">
        <h3>পাসওয়ার্ড পরিবর্তন</h3>
      </div>
      <div className="admin-card-body">
        {message && <div className="admin-alert admin-alert-success">{message}</div>}
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="admin-form-group">
            <label>পুরাতন পাসওয়ার্ড</label>
            <input
              type="password"
              value={form.oldpass}
              onChange={(e) => setForm({ ...form, oldpass: e.target.value })}
              required
            />
          </div>
          <div className="admin-form-group">
            <label>নতুন পাসওয়ার্ড</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          </div>
          <div className="admin-form-group">
            <label>পাসওয়ার্ড নিশ্চিত করুন</label>
            <input
              type="password"
              value={form.password_confirmation}
              onChange={(e) => setForm({ ...form, password_confirmation: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="admin-btn admin-btn-primary">
            আপডেট করুন
          </button>
        </form>
      </div>
    </div>
  )
}
