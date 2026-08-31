import { AdFrame, adsForSlider } from './AdCard'
import AdSlider from './AdSlider'
import { useSiteData } from '../context/SiteDataContext'

export default function NavbarAdBanner() {
  const { ads, settings } = useSiteData()
  if (!adsForSlider(ads, 'navbar', settings).length) return null

  return (
    <div className="navbar-ad-wrap d-print-none">
      <AdFrame>
        <AdSlider ads={ads} position="navbar" variant="banner" />
      </AdFrame>
    </div>
  )
}
