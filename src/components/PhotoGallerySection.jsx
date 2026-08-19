import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

/** Kept for admin or legacy imports */
export function PhotoGallerySection({ photos = [] }) {
  if (!photos.length) return null
  return (
    <section className="mt-4">
      <div className="container">
        <div className="common-border-box">
          <div className="section-title-flex">
            <h3>ফটো গ্যালারি</h3>
          </div>
          <div className="row">
            {photos.slice(0, 4).map((p) => (
              <div key={p._id} className="col-lg-3 col-6 mb-3">
                <div className="img-zoom-hover">
                  <SafeImage src={p.photo} alt={p.title} />
                </div>
                <h4 className="mt-2" style={{ fontSize: 16, fontWeight: 600 }}>
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

export default PhotoGallerySection
