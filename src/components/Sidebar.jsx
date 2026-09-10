import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { useLang } from '../context/LanguageContext'

const BN_NUM = ['১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯', '১০', '১১', '১২']

export default function Sidebar({
  latest: latestProp,
  popular: popularProp,
  settings: settingsProp,
  compact = false,
}) {
  const site = useSiteData()
  const { t, text, isEn } = useLang()
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
    fajr: isEn ? '5:30 AM' : '৫:৩০',
    johor: isEn ? '1:30 PM' : '১:৩০',
    asor: isEn ? '4:00 PM' : '৪:০০',
    magrib: isEn ? '6:00 PM' : '৬:০০',
    esha: isEn ? '7:30 PM' : '৭:৩০',
    jummah: isEn ? '1:40 PM' : '১:৪০',
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
              {t.latest}
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link${tab === 'popular' ? ' active' : ''}`}
              onClick={() => setTab('popular')}
            >
              {t.popular}
            </button>
          </li>
        </ul>
        <div className={`scroll-height-area${compact ? ' scroll-height-compact' : ''}`}>
          {items.map((item, i) => (
            <div className="news-list" key={item.id}>
              <Link to={item.path || `/news/${item.slug || item.id}`}>
                <div className="d-flex">
                  <div className="number-badge">{isEn ? i + 1 : (BN_NUM[i] || i + 1)}</div>
                  <div className="ms-2">
                    <h4 className="title">{text(item.title, item.titleEn)}</h4>
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
                  {t.topics}
                </h3>
              </div>
              <div className="p-2" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {site.layoutTopics
                  .filter((t) => t.isActive !== false)
                  .map((tItem) => {
                    const toUrl =
                      tItem.url ||
                      (tItem.category?.slug
                        ? `/category/${tItem.category.slug}`
                        : tItem.slug
                          ? `/category/${tItem.slug}`
                          : '#')
                    return (
                      <Link
                        key={tItem._id}
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
                        <i className={tItem.icon || 'fa-solid fa-leaf'} style={{ color: '#16a34a', fontSize: '11px' }} />
                        {text(tItem.title, tItem.titleEn)}
                      </Link>
                    )
                  })}
              </div>
            </div>
          )}

          {settings?.facebookPage && (
            <div className="common-border-box mb-3 p-3 d-none d-lg-block">
              <a href={settings.facebookPage} target="_blank" rel="noreferrer" className="fb-link-btn">
                {t.visitFacebook}
              </a>
            </div>
          )}
          <div className="common-border-box mb-3 d-none d-md-block">
            <div className="section-title-flex">
              <h3>{t.namazSchedule}</h3>
            </div>
            <div className="p-2">
              <table className="namaz-table">
                <tbody>
                  <tr>
                    <td>{t.fajr}</td>
                    <td>{namaz.fajr}</td>
                  </tr>
                  <tr>
                    <td>{t.johor}</td>
                    <td>{namaz.johor}</td>
                  </tr>
                  <tr>
                    <td>{t.asor}</td>
                    <td>{namaz.asor}</td>
                  </tr>
                  <tr>
                    <td>{t.magrib}</td>
                    <td>{namaz.magrib}</td>
                  </tr>
                  <tr>
                    <td>{t.esha}</td>
                    <td>{namaz.esha}</td>
                  </tr>
                  <tr>
                    <td>{t.jummah}</td>
                    <td>{namaz.jummah}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="common-border-box">
            <div className="section-title-flex">
              <h3>{t.hotlineTitle}</h3>
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
