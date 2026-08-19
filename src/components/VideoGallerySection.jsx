import { useState } from 'react'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'
import { useSiteData } from '../context/SiteDataContext'

function getEmbedUrl(url) {
  if (!url) return ''
  const m = String(url).match(/(?:embed\/|v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1`
  return url
}

function VideoCard({ video }) {
  const thumb = video.thumbnail || '/placeholder-news.svg'
  const videoUrl = video.embedCode || '#'

  return (
    <div className="col">
      <a href={videoUrl} target={video.embedCode ? "_blank" : "_self"} rel="noreferrer" style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}>
        <div className="video-item">
          <div className="video-poster border-0 p-0 w-100 position-relative">
            <SafeImage className="video-thamb" src={thumb} alt={video.title} width={400} style={{ borderRadius: '8px' }} />
            <span className="video-play-icon" aria-hidden style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 5, color: '#fff', fontSize: '40px' }}>
              <i className="fa-solid fa-circle-play" />
            </span>
          </div>
        </div>
        <div className="video-title mt-2">
          <h4>{video.title}</h4>
        </div>
      </a>
    </div>
  )
}

export default function VideoGallerySection({ videos = [] }) {
  if (!videos.length) return null

  return (
    <section className="video-gallery mt-3" id="videos">
      <div className="container">
        {videos.length > 0 && (
          <div className="common-border-box">
            <div className="section-title-flex">
              <div className="d-flex align-items-center">
                <i className="fa-solid fa-circle-play" style={{ color: '#c62828', fontSize: 22 }} />
                <h3>ভিডিও সংবাদ</h3>
              </div>
              <Link to="/videos">
                আরো দেখুন <i className="fa-solid fa-circle-chevron-right ms-1" />
              </Link>
            </div>
            <div className="row row-cols-2 row-cols-md-4 row-cols-lg-5 g-2 video-news-grid">
              {videos.slice(0, 5).map((v) => (
                <VideoCard key={v._id} video={v} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export function PhotoGallerySection({ photos = [] }) {
  if (!photos.length) return null
  return (
    <section className="mt-4">
      <div className="container">
        <div className="common-border-box">
          <div className="section-title-flex">
            <div className="d-flex align-items-center">
              <i className="fa-solid fa-camera" style={{ color: 'var(--bs-primary)' }} />
              <h3>ফটো গ্যালারি</h3>
            </div>
            <Link to="/photos">
              আরো দেখুন <i className="fa-solid fa-circle-chevron-right ms-1" />
            </Link>
          </div>
          <div className="row">
            {photos.slice(0, 4).map((p, i) => (
              <div key={p._id} className={`col-lg-3 col-6 mb-2${i < 3 ? ' border-right' : ''}`}>
                <div className="img-zoom-hover">
                  <SafeImage src={p.photo} alt={p.title} className="img-fluid" width={400} />
                </div>
                <h4 className="title mt-2" style={{ fontSize: 16, fontWeight: 600 }}>
                  {p.title}
                </h4>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
