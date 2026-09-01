import { useEffect, useState } from 'react'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { refreshSiteData } from '../../context/SiteDataContext'

const empty = {
  titleBn: '',
  titleEn: '',
  status: 'published',
  isActive: true,
  order: 1,
}

export default function BreakingNewsPage() {
  const { t, isEn } = useLang()
  const [items, setItems] = useState([])
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)
  const [headingForm, setHeadingForm] = useState({
    breakingTitle: '',
    breakingTitleEn: '',
  })
  const [savingHeading, setSavingHeading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const [breakingData, settingsData] = await Promise.all([
      api.getBreaking(),
      api.getSettings().catch(() => ({})),
    ])
    setItems(breakingData || [])
    if (settingsData) {
      setHeadingForm({
        breakingTitle: settingsData.breakingTitle || settingsData.breakingTitleBn || '',
        breakingTitleEn: settingsData.breakingTitleEn || '',
      })
    }
  }

  useEffect(() => {
    load().catch((err) => setError(err.message))
  }, [])

  function flash(msg) {
    setMessage(msg)
    setTimeout(() => setMessage(''), 2500)
  }

  async function handleHeadingSubmit(e) {
    e.preventDefault()
    setError('')
    setSavingHeading(true)
    try {
      await api.updateSettings({
        breakingTitle: headingForm.breakingTitle,
        breakingTitleBn: headingForm.breakingTitle,
        breakingTitleEn: headingForm.breakingTitleEn,
      })
      flash(isEn ? 'Heading updated' : 'শিরোনাম আপডেট হয়েছে')
      refreshSiteData().catch(() => {})
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingHeading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      if (editingId) {
        await api.updateBreaking(editingId, form)
        flash(isEn ? 'Updated' : 'আপডেট হয়েছে')
      } else {
        await api.createBreaking(form)
        flash(isEn ? 'Added' : 'যোগ হয়েছে')
      }
      setEditingId(null)
      setForm({ ...empty, order: (items[items.length - 1]?.order || 0) + 1 })
      await load()
      refreshSiteData().catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm(t.confirmDelete)) return
    try {
      await api.deleteBreaking(id)
      flash(isEn ? 'Deleted' : 'মুছে ফেলা হয়েছে')
      await load()
      refreshSiteData().catch(() => {})
    } catch (err) {
      setError(err.message)
    }
  }

  async function patch(item, fields) {
    try {
      await api.updateBreaking(item._id, fields)
      await load()
      refreshSiteData().catch(() => {})
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
          <h3>{isEn ? 'Section Heading' : 'সেকশন শিরোনাম'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleHeadingSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>{isEn ? 'Heading (Bangla)' : 'শিরোনাম (বাংলা)'}</label>
                <input
                  value={headingForm.breakingTitle}
                  onChange={(e) =>
                    setHeadingForm({ ...headingForm, breakingTitle: e.target.value })
                  }
                  placeholder="ব্রেকিং নিউজ"
                />
              </div>
              <div className="admin-form-group">
                <label>{isEn ? 'Heading (English)' : 'শিরোনাম (ইংরেজি)'}</label>
                <input
                  value={headingForm.breakingTitleEn}
                  onChange={(e) =>
                    setHeadingForm({ ...headingForm, breakingTitleEn: e.target.value })
                  }
                  placeholder="Breaking News"
                />
              </div>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={savingHeading}>
              {savingHeading
                ? (isEn ? 'Saving...' : 'সংরক্ষণ হচ্ছে...')
                : (isEn ? 'Save Heading' : 'শিরোনাম সংরক্ষণ')}
            </button>
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>
            {editingId
              ? (isEn ? 'Edit breaking news' : 'খবর সম্পাদনা')
              : (headingForm.breakingTitle || t.navBreaking)}
          </h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={handleSubmit}>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>{isEn ? 'Bangla title' : 'বাংলা শিরোনাম'} *</label>
                <input
                  value={form.titleBn}
                  onChange={(e) => setForm({ ...form, titleBn: e.target.value })}
                  required
                />
              </div>
              <div className="admin-form-group">
                <label>{isEn ? 'English title' : 'ইংরেজি শিরোনাম'}</label>
                <input
                  value={form.titleEn}
                  onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                />
              </div>
              <div className="admin-form-group">
                <label>{isEn ? 'Status' : 'স্ট্যাটাস'}</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="published">{isEn ? 'Published' : 'প্রকাশিত'}</option>
                  <option value="draft">{isEn ? 'Unpublished / Draft' : 'অপ্রকাশিত'}</option>
                </select>
              </div>
              <div className="admin-form-group">
                <label>{isEn ? 'Priority / Order' : 'অগ্রাধিকার / অর্ডার'}</label>
                <input
                  type="number"
                  min="1"
                  value={form.order}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 1 })}
                />
              </div>
            </div>
            <div className="admin-checkboxes">
              <label>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                {isEn ? 'Active (show on ticker)' : 'সক্রিয় (টিকারে দেখাবে)'}
              </label>
            </div>
            <button type="submit" className="admin-btn admin-btn-primary">
              {editingId ? (isEn ? 'Update' : 'আপডেট') : isEn ? 'Add' : 'যোগ করুন'}
            </button>
            {editingId ? (
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                style={{ marginLeft: 8 }}
                onClick={() => {
                  setEditingId(null)
                  setForm(empty)
                }}
              >
                {isEn ? 'Cancel' : 'বাতিল'}
              </button>
            ) : null}
          </form>
        </div>
      </div>

      <div className="admin-card">
        <div className="admin-card-header">
          <h3>
            {(headingForm.breakingTitle || t.navBreaking)} ({items.length})
          </h3>
        </div>
        <div className="admin-card-body admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{isEn ? 'Bangla' : 'বাংলা'}</th>
                <th>English</th>
                <th>{isEn ? 'Order' : 'অর্ডার'}</th>
                <th>{isEn ? 'Status' : 'স্ট্যাটাস'}</th>
                <th>{isEn ? 'Active' : 'সক্রিয়'}</th>
                <th>{isEn ? 'Actions' : 'অ্যাকশন'}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={item._id}>
                  <td>{i + 1}</td>
                  <td>{item.titleBn}</td>
                  <td>{item.titleEn || '—'}</td>
                  <td>{item.order}</td>
                  <td>{item.status === 'published' ? (isEn ? 'Published' : 'প্রকাশিত') : isEn ? 'Draft' : 'অপ্রকাশিত'}</td>
                  <td>{item.isActive ? (isEn ? 'Yes' : 'হ্যাঁ') : isEn ? 'No' : 'না'}</td>
                  <td className="admin-table-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() =>
                        patch(item, {
                          status: item.status === 'published' ? 'draft' : 'published',
                        })
                      }
                    >
                      {item.status === 'published' ? (isEn ? 'Unpublish' : 'আনপাবলিশ') : isEn ? 'Publish' : 'প্রকাশ'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-secondary"
                      onClick={() => patch(item, { isActive: !item.isActive })}
                    >
                      {item.isActive ? (isEn ? 'Inactive' : 'নিষ্ক্রিয়') : isEn ? 'Active' : 'সক্রিয়'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-primary"
                      onClick={() => {
                        setEditingId(item._id)
                        setForm({
                          titleBn: item.titleBn,
                          titleEn: item.titleEn || '',
                          status: item.status || 'published',
                          isActive: item.isActive !== false,
                          order: item.order || 1,
                        })
                      }}
                    >
                      {isEn ? 'Edit' : 'সম্পাদনা'}
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => handleDelete(item._id)}
                    >
                      {t.delete}
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
