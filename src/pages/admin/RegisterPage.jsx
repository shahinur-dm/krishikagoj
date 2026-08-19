import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { LogoMark } from '../../components/BrandLogo'
import '../../styles/admin.css'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', facebookId: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setSubmitting(true)
    try {
      const res = await api.register(form)
      setMessage(res.message || 'রেজিস্ট্রেশন সফল')
      setForm({ name: '', email: '', password: '', facebookId: '' })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-box-header">
          <LogoMark className="login-logo" />
          <h1>রিপোর্টার রেজিস্ট্রেশন</h1>
        </div>
        <div className="login-box-body">
          {error && <div className="login-error">{error}</div>}
          {message && <div className="admin-alert admin-alert-success">{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>নাম</label>
              <input
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>ইমেইল</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>পাসওয়ার্ড</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="form-group">
              <label>ফেসবুক আইডি (ঐচ্ছিক)</label>
              <input
                value={form.facebookId}
                onChange={(e) => update('facebookId', e.target.value)}
              />
            </div>
            <button type="submit" className="login-btn" disabled={submitting}>
              {submitting ? 'জমা হচ্ছে...' : 'রেজিস্টার'}
            </button>
          </form>
          <div className="login-footer">
            <Link to="/login">লগইন পেজে ফিরুন</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
