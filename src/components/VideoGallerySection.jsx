import { Children, cloneElement } from 'react'
import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

function RtlMarquee({ children, className }) {
  const nodes = Children.toArray(children)
  if (!nodes.length) return null

  return (
    <div className={`kk-rtl-marquee ${className || ''}`.trim()}>
      <div className="kk-rtl-marquee-track">
        <div className="kk-rtl-marquee-group">{nodes}</div>
        <div className="kk-rtl-marquee-group" aria-hidden="true">
          {nodes.map((node, i) => cloneElement(node, { key: `dup-${i}` }))}
        </div>
      </div>
    </div>
  )
}

function VideoCard({ video }) {
  const thumb = video.thumbnail || '/placeholder-news.svg'
  const videoUrl = video.embedCode || '#'

  return (
    <div className="kk-rtl-marquee-item">
      <a
        href={videoUrl}
        target={video.embedCode ? '_blank' : '_self'}
        rel="noreferrer"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
      >
        <div className="video-item">
          <div className="video-poster border-0 p-0 w-100 position-relative">
            <SafeImage className="video-thamb" src={thumb} alt={video.title} width={400} style={{ borderRadius: '8px' }} />
            <span
              className="video-play-icon"
              aria-hidden
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 5,
                color: '#fff',
                fontSize: '40px',
              }}
            >
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
          <RtlMarquee className="video-rtl-marquee">
            {videos.map((v) => (
              <VideoCard key={v._id} video={v} />
            ))}
          </RtlMarquee>
        </div>
      </div>
    </section>
  )
}

export function PhotoGallerySection({ photos = [] }) {
  if (!photos.length) return null
  return (
    <section className="mt-4 photo-gallery-section">
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
          <RtlMarquee className="photo-rtl-marquee">
            {photos.map((p) => (
              <div key={p._id} className="kk-rtl-marquee-item">
                <div className="img-zoom-hover">
                  <SafeImage src={p.photo} alt={p.title} className="img-fluid" width={400} />
                </div>
                <h4 className="title mt-2" style={{ fontSize: 16, fontWeight: 600 }}>
                  {p.title}
                </h4>
              </div>
            ))}
          </RtlMarquee>
        </div>
      </div>
    </section>
  )
}
