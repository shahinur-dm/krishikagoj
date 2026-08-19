import { adsForSlider } from './AdCard'
import AdSlider from './AdSlider'
import { useSiteData } from '../context/SiteDataContext'

/** After main lead layout: show 2 ads side-by-side */
export default function MidPageAds() {
  const { ads } = useSiteData()
  if (!adsForSlider(ads, 'mid_a').length) return null

  return (
    <div className="mid-page-ads d-print-none">
      <div className="container">
        <div className="mid-page-ads-grid">
          <AdSlider ads={ads} position="mid_a" variant="card" startOffset={0} />
          <AdSlider ads={ads} position="mid_b" variant="card" startOffset={1} />
        </div>
      </div>
    </div>
  )
}
