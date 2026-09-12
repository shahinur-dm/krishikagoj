import { useEffect, useState } from 'react'
import { api } from '../api/client'
import SafeImage from '../components/SafeImage'
import { useLang } from '../context/LanguageContext'

export default function PhotosPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const { t, text } = useLang()

  useEffect(() => {
    api.getPhotos()
      .then(data => setPhotos(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container py-5 text-center">{t.loading}</div>

  return (
    <div className="container mt-4">
      <div className="common-border-box">
        <div className="section-title-flex">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-camera" style={{ color: 'var(--bs-primary)' }} />
            <h3>{t.photoGallery}</h3>
          </div>
        </div>
        <div className="row g-3">
          {photos.map(photo => (
            <div className="col-lg-3 col-md-4 col-sm-6" key={photo._id}>
              <div className="img-zoom-hover">
                <SafeImage src={photo.photo} alt={text(photo.title, photo.titleEn)} className="img-fluid" />
              </div>
              <h4 className="title mt-2" style={{ fontSize: 16, fontWeight: 600 }}>
                {text(photo.title, photo.titleEn)}
              </h4>
            </div>
          ))}
          {photos.length === 0 && <div className="col-12 text-center text-muted">{t.noResults}</div>}
        </div>
      </div>
    </div>
  )
}
