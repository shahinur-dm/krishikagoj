import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { Link } from 'react-router-dom'
import SafeImage from '../components/SafeImage'

function getEmbedUrl(url) {
  if (!url) return ''
  const m = String(url).match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`
  return url
}

export default function VideosPage() {
  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getVideos()
      .then(data => setVideos(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container py-5 text-center">লোড হচ্ছে...</div>

  return (
    <div className="container mt-4">
      <div className="common-border-box">
        <div className="section-title-flex">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-circle-play" style={{ color: '#c62828', fontSize: 22 }} />
            <h3>সকল ভিডিও সংবাদ</h3>
          </div>
        </div>
        <div className="row g-3">
          {videos.map(video => (
            <div className="col-lg-3 col-md-4 col-sm-6" key={video._id}>
              <a href={video.embedCode || '#'} target={video.embedCode ? "_blank" : "_self"} rel="noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
                <div className="video-item position-relative">
                  <SafeImage className="img-fluid rounded" src={video.thumbnail || '/placeholder-news.svg'} alt={video.title} style={{ aspectRatio: '16/9', objectFit: 'cover', width: '100%' }} />
                  <span className="position-absolute" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, color: '#fff', fontSize: '40px' }}>
                    <i className="fa-solid fa-circle-play" />
                  </span>
                </div>
                <div className="mt-2">
                  <h4 style={{ fontSize: '18px', fontWeight: 600 }}>{video.title}</h4>
                </div>
              </a>
            </div>
          ))}
          {videos.length === 0 && <div className="col-12 text-center text-muted">কোনো ভিডিও পাওয়া যায়নি</div>}
        </div>
      </div>
    </div>
  )
}
