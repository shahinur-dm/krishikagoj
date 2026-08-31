import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api } from '../api/client'
import SafeImage from '../components/SafeImage'
import SeoHead from '../components/SeoHead'

export default function CmsPageView() {
  const { slug } = useParams()
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api.getPublicPage(slug).then(setPage).catch((err) => setError(err.message))
  }, [slug])

  if (error) return <div className="container py-4">{error}</div>
  if (!page) return <div className="container py-4">লোড হচ্ছে...</div>

  return (
    <div className="container py-4">
      <SeoHead title={page.title} description={page.metaDescription} keywords={page.metaKeyword} />
      <h1>{page.title}</h1>
      {page.photo ? <SafeImage src={page.photo} alt={page.title} className="img-fluid mb-3" /> : null}
      {page.videoUrl ? (
        <p>
          <a href={page.videoUrl} target="_blank" rel="noreferrer">
            Video
          </a>
        </p>
      ) : null}
      <div className="entry-content" dangerouslySetInnerHTML={{ __html: page.body || '' }} />
    </div>
  )
}
