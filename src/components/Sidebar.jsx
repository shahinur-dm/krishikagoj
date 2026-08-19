import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'

const BN_NUM = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '১০', '১১', '১২']

export default function Sidebar({
  latest: latestProp,
  popular: popularProp,
  settings: settingsProp,
  compact = false,
}) {
  const site = useSiteData()
  const [tab, setTab] = useState('latest')

  const latest = latestProp?.length ? latestProp : site.latest || []
  const popular = popularProp?.length
    ? popularProp
    : site.popular?.length
      ? site.popular
      : [...(site.latest || [])].sort((a, b) => (b.views || 0) - (a.views || 0))
  const settings = settingsProp || site.settings
  const items = useMemo(
    () => (tab === 'latest' ? latest : popular).slice(0, compact ? 4 : 10),
    [tab, latest, popular, compact],
  )

  const namaz = settings?.namaz || {
    fajr: '৫:৩০',
    johor: '১:৩০',
    asor: '৪:০০',
    magrib: '৬:০০',
    esha: '৭:৩০',
    jummah: '১:৪০',
  }

  return (
    <aside className="sidebar">
      <div className="common-border-box mb-3">
        <ul className="nav nav-pills mb-2 eb-side-pills" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link${tab === 'latest' ? ' active' : ''}`}
              onClick={() => setTab('latest')}
            >
              সর্বশেষ
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link${tab === 'popular' ? ' active' : ''}`}
              onClick={() => setTab('popular')}
            >
              জনপ্রিয়
            </button>
          </li>
        </ul>
        <div className={`scroll-height-area${compact ? ' scroll-height-compact' : ''}`}>
          {items.map((item, i) => (
            <div className="news-list" key={item.id}>
              <Link to={item.path || `/news/${item.slug || item.id}`}>
                <div className="d-flex">
                  <div className="number-badge">{BN_NUM[i] || i + 1}</div>
                  <div className="ms-2">
                    <h4 className="title">{item.title}</h4>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>

      {!compact && (
        <>
          {settings?.facebookPage && (
            <div className="common-border-box mb-3 p-3 d-none d-lg-block">
              <a href={settings.facebookPage} target="_blank" rel="noreferrer" className="fb-link-btn">
                ফেসবুক পেজ দেখুন
              </a>
            </div>
          )}
          <div className="common-border-box mb-3 d-none d-md-block">
            <div className="section-title-flex">
              <h3>নামাজের সময়সূচী</h3>
            </div>
            <div className="p-2">
              <table className="namaz-table">
                <tbody>
                  <tr>
                    <td>ফজর</td>
                    <td>{namaz.fajr}</td>
                  </tr>
                  <tr>
                    <td>যোহর</td>
                    <td>{namaz.johor}</td>
                  </tr>
                  <tr>
                    <td>আছর</td>
                    <td>{namaz.asor}</td>
                  </tr>
                  <tr>
                    <td>মাগরিব</td>
                    <td>{namaz.magrib}</td>
                  </tr>
                  <tr>
                    <td>এশা</td>
                    <td>{namaz.esha}</td>
                  </tr>
                  <tr>
                    <td>জুম্মা</td>
                    <td>{namaz.jummah}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="common-border-box">
            <div className="section-title-flex">
              <h3>কৃষকের হটলাইন</h3>
            </div>
            <div className="p-3">
              <p className="hotline-num">{settings?.hotline || '১৬১২৩'}</p>
            </div>
          </div>
        </>
      )}
    </aside>
  )
}
