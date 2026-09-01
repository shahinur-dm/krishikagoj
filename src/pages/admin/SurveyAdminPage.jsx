import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'
import { refreshSiteData } from '../../context/SiteDataContext'

const emptyQuestion = { text: '', type: 'single', optionsText: '' }
const empty = { title: '', description: '', language: 'bn', status: 'published', questions: [{ ...emptyQuestion }] }

export default function SurveyAdminPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  if (pathname.endsWith('/results')) return <SurveyResults id={id} />
  if (id || pathname.endsWith('/new')) return <SurveyForm id={id} />
  return <SurveyList />
}

function SurveyList() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [q, setQ] = useState('')

  async function load() {
    try {
      const data = await api.getSurveys()
      setItems(data || [])
    } catch (err) {
      setError(err.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => String(it.title || '').toLowerCase().includes(s))
  }, [items, q])

  async function remove(itemId) {
    if (!confirm(t.confirmDelete || 'মুছে ফেলতে চান?')) return
    try {
      await api.deleteSurvey(itemId)
      setMessage('জরিপ মুছে ফেলা হয়েছে')
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
          <h3>Survey List</h3>
          <Link to="/admin/surveys/new" className="admin-btn admin-btn-primary">
            + Add New Survey
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
                  <th>Status</th>
                  <th>Language</th>
                  <th>Created</th>
                  <th>Responses</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No data available in table</td>
                  </tr>
                ) : (
                  rows.map((item, i) => (
                    <tr key={item._id}>
                      <td>{i + 1}</td>
                      <td>{item.title}</td>
                      <td>{item.status}</td>
                      <td>{item.language === 'en' ? 'English' : 'Bengali/Bangla'}</td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}</td>
                      <td>{item.responseCount || 0}</td>
                      <td className="admin-table-actions">
                        <Link className="admin-btn admin-btn-sm" to={`/admin/surveys/${item._id}/results`}>
                          Results
                        </Link>
                        <Link className="admin-btn admin-btn-sm admin-btn-primary" to={`/admin/surveys/${item._id}`}>
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

function SurveyForm({ id }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (!isEdit) return
    api
      .getSurvey(id)
      .then((item) =>
        setForm({
          title: item.title || '',
          description: item.description || '',
          language: item.language || 'bn',
          status: item.status || 'published',
          questions: (item.questions || []).map((q) => ({
            text: q.text || '',
            type: q.type || 'single',
            optionsText: (q.options || []).join('\n'),
          })),
        }),
      )
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  function updateQuestion(index, patch) {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? { ...q, ...patch } : q)),
    }))
  }

  function removeQuestion(index) {
    if (form.questions.length <= 1) return
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    const questions = form.questions
      .map((q) => ({
        text: String(q.text || '').trim(),
        type: q.type || 'single',
        options: (q.optionsText || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
      }))
      .filter((q) => q.text)

    if (questions.length === 0) {
      setError('কমপক্ষে একটি প্রশ্ন যোগ করুন')
      return
    }

    const payload = {
      title: form.title.trim(),
      description: form.description,
      language: form.language,
      status: form.status,
      questions,
    }
    try {
      if (isEdit) await api.updateSurvey(id, payload)
      else await api.createSurvey(payload)
      await refreshSiteData().catch(() => {})
      navigate('/admin/surveys')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isEdit ? 'Edit survey' : 'Add New Survey'}</h3>
          <Link to="/admin/surveys" className="admin-btn admin-btn-secondary">
            Back
          </Link>
        </div>
        <div className="admin-card-body">
          <form onSubmit={onSubmit}>
            <div className="admin-form-group">
              <label>Survey title *</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>Description / instructions</label>
              <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            {form.questions.map((q, i) => (
              <div key={i} className="admin-form-group" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label style={{ margin: 0, fontWeight: 600 }}>Question {i + 1}</label>
                  {form.questions.length > 1 ? (
                    <button
                      type="button"
                      className="admin-btn admin-btn-sm admin-btn-danger"
                      onClick={() => removeQuestion(i)}
                      style={{ padding: '2px 8px', fontSize: '12px' }}
                    >
                      মুছুন
                    </button>
                  ) : null}
                </div>
                <input
                  placeholder="প্রশ্নের বিবরণ লিখুন *"
                  value={q.text}
                  onChange={(e) => updateQuestion(i, { text: e.target.value })}
                  style={{ marginBottom: '0.5rem' }}
                  required
                />
                <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })} style={{ marginBottom: '0.5rem' }}>
                  <option value="single">Single choice (একটি বাছাই)</option>
                  <option value="multiple">Multiple choice (একাধিক বাছাই)</option>
                  <option value="text">Text (লেখা)</option>
                </select>
                {q.type !== 'text' ? (
                  <textarea
                    rows={3}
                    placeholder="অপশন লিখুন (প্রতি লাইনে একটি)"
                    value={q.optionsText}
                    onChange={(e) => updateQuestion(i, { optionsText: e.target.value })}
                  />
                ) : null}
              </div>
            ))}
            <div style={{ marginTop: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className="admin-btn admin-btn-secondary"
                onClick={() => setForm({ ...form, questions: [...form.questions, { ...emptyQuestion }] })}
              >
                + Add question
              </button>
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
              <Link to="/admin/surveys" className="admin-btn admin-btn-secondary">
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function SurveyResults({ id }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getSurveyResults(id).then(setData).catch((err) => setError(err.message))
  }, [id])

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Survey results</h3>
          <Link to="/admin/surveys" className="admin-btn admin-btn-secondary">
            Back
          </Link>
        </div>
        <div className="admin-card-body">
          {!data ? (
            <p>Loading...</p>
          ) : (
            <>
              <p style={{ fontSize: '18px', fontWeight: 600 }}>
                {data.survey.title} — <span style={{ color: '#0284c7' }}>{data.responses.length} responses</span>
              </p>
              {data.survey.description ? <p style={{ color: '#64748b' }}>{data.survey.description}</p> : null}
              {data.responses.length === 0 ? (
                <p>এখনো কোনো রেসপন্স আসেনি।</p>
              ) : (
                (data.responses || []).map((row, idx) => (
                  <div key={row._id} className="admin-form-group" style={{ background: '#f8fafc', padding: '1rem', borderRadius: '6px', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>Response #{idx + 1}</strong>
                      <small style={{ color: '#64748b' }}>{new Date(row.createdAt).toLocaleString()}</small>
                    </div>
                    {(data.survey.questions || []).map((q, qi) => {
                      const ans = row.answers?.[qi]
                      return (
                        <div key={qi} style={{ marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 500 }}>{q.text}: </span>
                          <span style={{ color: '#0f172a' }}>{Array.isArray(ans) ? ans.join(', ') : String(ans ?? '—')}</span>
                        </div>
                      )
                    })}
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
