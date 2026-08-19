import { useEffect, useState } from 'react'
import { api } from '../api/client'
import SafeImage from '../components/SafeImage'

export default function PhotosPage() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPhotos()
      .then(data => setPhotos(data || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container py-5 text-center">লোড হচ্ছে...</div>

  return (
    <div className="container mt-4">
      <div className="common-border-box">
        <div className="section-title-flex">
          <div className="d-flex align-items-center">
            <i className="fa-solid fa-camera" style={{ color: 'var(--bs-primary)' }} />
            <h3>সকল ফটো গ্যালারি</h3>
          </div>
        </div>
        <div className="row g-3">
          {photos.map(photo => (
            <div className="col-lg-3 col-md-4 col-sm-6" key={photo._id}>
              <div className="img-zoom-hover">
                <SafeImage src={photo.photo} alt={photo.title} className="img-fluid" />
              </div>
              <h4 className="title mt-2" style={{ fontSize: 16, fontWeight: 600 }}>
                {photo.title}
              </h4>
            </div>
          ))}
          {photos.length === 0 && <div className="col-12 text-center text-muted">কোনো ছবি পাওয়া যায়নি</div>}
        </div>
      </div>
    </div>
  )
}
