import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import SeoHead from '../components/SeoHead'

export default function SurveyView() {
  const { id } = useParams()
  const [survey, setSurvey] = useState(null)
  const [answers, setAnswers] = useState({})
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const data = id ? await api.getPublicSurvey(id) : (await api.getPublicSurveys())[0]
        setSurvey(data || null)
      } catch (err) {
        setError(err.message)
      }
    }
    load()
  }, [id])

  async function onSubmit(e) {
    e.preventDefault()
    if (!survey) return
    const payload = (survey.questions || []).map((q, i) => answers[i] ?? '')
    try {
      await api.respondSurvey(survey._id, payload)
      setDone(true)
    } catch (err) {
      setError(err.message)
    }
  }

  if (error) return <div className="container py-4">{error}</div>
  if (!survey) return <div className="container py-4">এখন কোনো জরিপ নেই।</div>
  if (done) return <div className="container py-4">আপনার উত্তর জমা হয়েছে। ধন্যবাদ।</div>

  return (
    <div className="container py-4">
      <SeoHead title={survey.title} />
      <h1>{survey.title}</h1>
      {survey.description ? <p>{survey.description}</p> : null}
      <form onSubmit={onSubmit}>
        {(survey.questions || []).map((q, i) => (
          <div key={i} className="mb-3">
            <p>
              <strong>{q.text}</strong>
            </p>
            {q.type === 'text' ? (
              <textarea className="form-control" value={answers[i] || ''} onChange={(e) => setAnswers({ ...answers, [i]: e.target.value })} />
            ) : q.type === 'multiple' ? (
              (q.options || []).map((opt) => (
                <label key={opt} className="d-block">
                  <input
                    type="checkbox"
                    checked={Array.isArray(answers[i]) && answers[i].includes(opt)}
                    onChange={(e) => {
                      const cur = Array.isArray(answers[i]) ? answers[i] : []
                      setAnswers({
                        ...answers,
                        [i]: e.target.checked ? [...cur, opt] : cur.filter((x) => x !== opt),
                      })
                    }}
                  />{' '}
                  {opt}
                </label>
              ))
            ) : (
              (q.options || []).map((opt) => (
                <label key={opt} className="d-block">
                  <input
                    type="radio"
                    name={`q-${i}`}
                    checked={answers[i] === opt}
                    onChange={() => setAnswers({ ...answers, [i]: opt })}
                  />{' '}
                  {opt}
                </label>
              ))
            )}
          </div>
        ))}
        <button type="submit" className="admin-btn admin-btn-primary">
          জমা দিন
        </button>
      </form>
    </div>
  )
}
