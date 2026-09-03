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
      <div className={`common-border-box${compact ? '' : ' mb-3'}`}>
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
          {site.layoutTopics?.filter((t) => t.isActive !== false).length > 0 && (
            <div className="common-border-box mb-3 d-none d-md-block">
              <div className="section-title-flex">
                <h3>
                  <i className="fa-solid fa-layer-group kk-topic-icon" style={{ marginRight: '6px', color: '#16a34a' }} />
                  টপিক সমূহ
                </h3>
              </div>
              <div className="p-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {site.layoutTopics
                  .filter((t) => t.isActive !== false)
                  .map((t) => {
                    const toUrl =
                      t.url ||
                      (t.category?.slug
                        ? `/category/${t.category.slug}`
                        : t.slug
                          ? `/category/${t.slug}`
                          : '#')
                    return (
                      <Link
                        key={t._id}
                        to={toUrl}
                        style={{
                          background: '#f8fafc',
                          color: '#1e293b',
                          padding: '5px 9px',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          fontWeight: 500,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          border: '1px solid #e2e8f0',
                          textDecoration: 'none',
                        }}
                      >
                        <i className={t.icon || 'fa-solid fa-leaf'} style={{ color: '#16a34a', fontSize: '11px' }} />
                        {t.title}
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}

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
