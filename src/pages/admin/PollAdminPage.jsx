import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api/client'
import { useLang } from '../../context/LanguageContext'

const empty = {
  question: '',
  optionsText: '',
  votePermission: 'all',
  language: 'bn',
  status: 'published',
}

export default function PollAdminPage() {
  const { id } = useParams()
  const { pathname } = useLocation()
  if (pathname.endsWith('/results')) return <PollResults id={id} />
  if (id || pathname.endsWith('/new')) return <PollForm id={id} />
  return <PollList />
}

function PollList() {
  const { t } = useLang()
  const [items, setItems] = useState([])
  const [error, setError] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    api.getPolls().then(setItems).catch((err) => setError(err.message))
  }, [])

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (!s) return items
    return items.filter((it) => String(it.question || '').toLowerCase().includes(s))
  }, [items, q])
  const rows = filtered.slice((page - 1) * 10, page * 10)

  async function remove(itemId) {
    if (!confirm(t.confirmDelete)) return
    await api.deletePoll(itemId)
    setItems(await api.getPolls())
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Poll List</h3>
          <Link to="/admin/polls/new" className="admin-btn admin-btn-primary">
            + New poll
          </Link>
        </div>
        <div className="admin-card-body">
          <label className="pl-search">
            Search:
            <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1) }} />
          </label>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SI</th>
                  <th>Question</th>
                  <th>Vote permission</th>
                  <th>Language</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No data available in table</td>
                  </tr>
                ) : (
                  rows.map((item, i) => (
                    <tr key={item._id}>
                      <td>{(page - 1) * 10 + i + 1}</td>
                      <td>{item.question}</td>
                      <td>{item.votePermission === 'all' ? 'All users can vote' : item.votePermission}</td>
                      <td>{item.language === 'en' ? 'English' : 'Bengali/Bangla'}</td>
                      <td>{item.status}</td>
                      <td className="admin-table-actions">
                        <Link className="admin-btn admin-btn-sm" to={`/admin/polls/${item._id}/results`}>
                          View
                        </Link>
                        <Link className="admin-btn admin-btn-sm admin-btn-primary" to={`/admin/polls/${item._id}`}>
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

function PollForm({ id }) {
  const navigate = useNavigate()
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')
  const isEdit = Boolean(id)

  useEffect(() => {
    if (!isEdit) return
    api
      .getPoll(id)
      .then((item) =>
        setForm({
          question: item.question || '',
          optionsText: (item.options || []).join('\n'),
          votePermission: item.votePermission || 'all',
          language: item.language || 'bn',
          status: item.status || 'published',
        }),
      )
      .catch((err) => setError(err.message))
  }, [id, isEdit])

  async function onSubmit(e) {
    e.preventDefault()
    const payload = {
      question: form.question,
      options: form.optionsText.split('\n'),
      votePermission: form.votePermission,
      language: form.language,
      status: form.status,
    }
    try {
      if (isEdit) await api.updatePoll(id, payload)
      else await api.createPoll(payload)
      navigate('/admin/polls')
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>{isEdit ? 'Edit poll' : 'Add New Poll'}</h3>
        </div>
        <div className="admin-card-body">
          <form onSubmit={onSubmit}>
            <div className="admin-form-group">
              <label>Question *</label>
              <input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
            </div>
            <div className="admin-form-group">
              <label>Options (one per line) *</label>
              <textarea
                rows={5}
                value={form.optionsText}
                onChange={(e) => setForm({ ...form, optionsText: e.target.value })}
                required
              />
            </div>
            <div className="admin-form-row">
              <div className="admin-form-group">
                <label>Vote permission</label>
                <select value={form.votePermission} onChange={(e) => setForm({ ...form, votePermission: e.target.value })}>
                  <option value="all">All users can vote</option>
                </select>
              </div>
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

function PollResults({ id }) {
  const [item, setItem] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPoll(id).then(setItem).catch((err) => setError(err.message))
  }, [id])

  const total = (item?.votes || []).reduce((s, n) => s + (n || 0), 0)

  return (
    <div>
      {error ? <div className="admin-alert admin-alert-error">{error}</div> : null}
      <div className="admin-card">
        <div className="admin-card-header">
          <h3>Poll results</h3>
          <Link to="/admin/polls" className="admin-btn admin-btn-secondary">
            Back
          </Link>
        </div>
        <div className="admin-card-body">
          {!item ? (
            <p>Loading...</p>
          ) : (
            <>
              <p>
                <strong>{item.question}</strong>
              </p>
              <p>Total votes: {total}</p>
              <ul>
                {(item.options || []).map((opt, i) => (
                  <li key={opt}>
                    {opt} — {item.votes?.[i] || 0}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
