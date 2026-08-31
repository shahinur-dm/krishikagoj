import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'

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
  const [q, setQ] = useState('')

  useEffect(() => {
    api.getSurveys().then(setItems).catch((err) => setError(err.message))
  }, [])

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => String(it.title || '').toLowerCase().includes(s))
  }, [items, q])

  async function remove(itemId) {
    if (!confirm(t.confirmDelete)) return
    await api.deleteSurvey(itemId)
    setItems(await api.getSurveys())
  }

  return (
    <div>
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

  async function onSubmit(e) {
    e.preventDefault()
    const payload = {
      title: form.title,
      description: form.description,
      language: form.language,
      status: form.status,
      questions: form.questions.map((q) => ({
        text: q.text,
        type: q.type,
        options: q.optionsText.split('\n'),
      })),
    }
    try {
      if (isEdit) await api.updateSurvey(id, payload)
      else await api.createSurvey(payload)
      navigate('/admin/surveys')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEdit ? 'Edit survey' : 'Add New Survey'}</h3>
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
              <div key={i} className="admin-form-group" style={{ borderTop: '1px solid #e5e7eb', paddingTop: '0.75rem' }}>
                <label>Question {i + 1}</label>
                <input value={q.text} onChange={(e) => updateQuestion(i, { text: e.target.value })} />
                <select value={q.type} onChange={(e) => updateQuestion(i, { type: e.target.value })}>
                  <option value="single">Single choice</option>
                  <option value="multiple">Multiple choice</option>
                  <option value="text">Text</option>
                </select>
                {q.type !== 'text' ? (
                  <textarea
                    rows={3}
                    placeholder="Options, one per line"
                    value={q.optionsText}
                    onChange={(e) => updateQuestion(i, { optionsText: e.target.value })}
                  />
                ) : null}
              </div>
            ))}
            <button
              type="button"
              className="admin-btn admin-btn-secondary"
              onClick={() => setForm({ ...form, questions: [...form.questions, { ...emptyQuestion }] })}
            >
              Add question
            </button>
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
            <button type="submit" className="admin-btn admin-btn-primary">
              Save
            </button>
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
        <div className="admin-card-header">
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
              <p>
                <strong>{data.survey.title}</strong> — {data.responses.length} responses
              </p>
              {(data.responses || []).map((row) => (
                <div key={row._id} className="admin-form-group">
                  <small>{new Date(row.createdAt).toLocaleString()}</small>
                  <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{JSON.stringify(row.answers, null, 2)}</pre>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
