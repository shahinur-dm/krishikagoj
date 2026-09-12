import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'
import { useLang } from '../context/LanguageContext'
import { formatBnDate } from '../api/client'

export function NewsCard({ article }) {
  const { t, text, lang } = useLang()
  if (!article) return null
  const title = text(article.title, article.titleEn)
  const excerpt = text(article.excerpt, article.excerptEn)
  const catName = text(article.categoryName, article.categoryNameEn)
  const dateStr = article.publishedAt ? formatBnDate(article.publishedAt, lang) : article.date

  return (
    <article className="news-card">
      <Link to={article.path || `/news/${article.slug || article.id}`}>
        <SafeImage src={article.image} alt={title} />
      </Link>
      <div className="news-card-body">
        {article.category && (
          <Link className="cat" to={`/category/${article.category}`}>
            {catName}
          </Link>
        )}
        <h3>
          <Link to={article.path || `/news/${article.slug || article.id}`}>{title}</Link>
        </h3>
        {excerpt ? <p>{excerpt}</p> : null}
        <div className="meta">
          {dateStr ? `${dateStr} · ` : ''}{article.views || 0} {t.views}
        </div>
      </div>
    </article>
  )
}

export function ListItem({ article }) {
  const { text } = useLang()
  if (!article) return null
  const title = text(article.title, article.titleEn)
  const excerpt = text(article.excerpt, article.excerptEn)
  const catName = text(article.categoryName, article.categoryNameEn)

  return (
    <article className="list-item">
      <Link to={article.path || `/news/${article.slug || article.id}`}>
        <SafeImage src={article.image} alt={title} />
      </Link>
      <div className="list-item-body">
        {article.category && (
          <Link
            className="cat"
            to={`/category/${article.category}`}
            style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.8rem' }}
          >
            {catName}
          </Link>
        )}
        <h3>
          <Link to={article.path || `/news/${article.slug || article.id}`}>{title}</Link>
        </h3>
        {excerpt ? <p>{excerpt}</p> : null}
      </div>
    </article>
  )
}

export function LoadingBlock({ text = 'লোড হচ্ছে...' }) {
  const { t } = useLang()
  return <div className="empty-state">{text === 'লোড হচ্ছে...' ? t.loading : text}</div>
}

export function ErrorBlock({ error }) {
  return (
    <div className="empty-state" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
      {error || 'কিছু সমস্যা হয়েছে'}
    </div>
  )
}

