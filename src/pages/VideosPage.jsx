import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import SafeImage from '../components/SafeImage'
import { useLang } from '../context/LanguageContext'

function getEmbedUrl(url) {
  if (!url) return ''
  const m = String(url).match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`
  return url
}

export default function VideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const { t, text } = useLang()

  useEffect(() => {
    api.getVideos()
      .then(data => setVideos(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container py-5 text-center">{t.loading}</div>

  return (
    <div className="container mt-4">
      <div className="common-border-box">
        <div className="section-title-flex">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-play" style={{ color: '#c62828', fontSize: 22 }} />
            <h3>{t.videoGallery}</h3>
          </div>
        </div>
        <div className="row g-3">
          {videos.map(video => (
            <div className="col-lg-3 col-md-4 col-sm-6" key={video._id}>
              <a href={video.embedCode || '#'} target={video.embedCode ? "_blank" : "_self"} rel="noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className="video-item position-relative">
                  <SafeImage className="img-fluid rounded" src={video.thumbnail || '/placeholder-news.svg'} alt={text(video.title, video.titleEn)} style={{ aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
                  <span className="position-absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, color: '#fff', fontSize: '40px' }}>
                    <i className="fa-solid fa-circle-play" />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 style={{ fontSize: '18px', fontWeight: 600 }}>{text(video.title, video.titleEn)}</h4>
                </div>
              </a>
            </div>
          ))}
          {videos.length === 0 && <div className="col-12 text-center text-muted">{t.noResults}</div>}
        </div>
      </div>
    </div>
  )
}
