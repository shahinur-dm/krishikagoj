import { useEffect, useState } from 'react'
import { AdFrame, adsForSlider } from './AdCard'
import AdSlider from './AdSlider'
import { useSiteData } from '../context/SiteDataContext'

const SESSION_KEY = 'kk_bottom_ad_dismissed_v2'

export default function BottomAdBox() {
  const { ads } = useSiteData()
  const list = adsForSlider(ads, 'bottom')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!list.length) return undefined
    try {
      if (sessionStorage.getItem(SESSION_KEY) === '1') return undefined
    } catch {
      /* ignore */
    }
    const t = window.setTimeout(() => setOpen(true), 600)
    return () => window.clearTimeout(t)
  }, [list.length])

  useEffect(() => {
    document.body.classList.toggle('has-bottom-ad', open)
    return () => document.body.classList.remove('has-bottom-ad')
  }, [open])

  if (!list.length) return null

  function dismiss(e) {
    e.preventDefault()
    e.stopPropagation()
    setOpen(false)
    try {
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      /* ignore */
    }
  }

  return (
    <div className={`bottom-ad-sheet${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="bottom-ad-sheet-inner">
        <AdFrame>
          <div className="bottom-ad-card-wrap">
            <button type="button" className="bottom-ad-close" onClick={dismiss} aria-label="বন্ধ">
              <i className="fa-solid fa-xmark" />
            </button>
            <AdSlider ads={ads} position="bottom" variant="bottom" startOffset={2} />
          </div>
        </AdFrame>
      </div>
    </div>
  )
}
