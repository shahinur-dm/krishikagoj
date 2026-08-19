import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export function NewsCard({ article }) {
  return (
    <article className="news-card">
      <Link to={article.path || `/news/${article.slug || article.id}`}>
        <SafeImage src={article.image} alt={article.title} />
      </Link>
      <div className="news-card-body">
        {article.category && (
          <Link className="cat" to={`/category/${article.category}`}>
            {article.categoryName}
          </Link>
        )}
        <h3>
          <Link to={article.path || `/news/${article.slug || article.id}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
        <div className="meta">
          {article.date} · {article.views} ভিউ
        </div>
      </div>
    </article>
  )
}

export function ListItem({ article }) {
  return (
    <article className="list-item">
      <Link to={article.path || `/news/${article.slug || article.id}`}>
        <SafeImage src={article.image} alt={article.title} />
      </Link>
      <div className="list-item-body">
        {article.category && (
          <Link
            className="cat"
            to={`/category/${article.category}`}
            style={{ color: 'var(--green)', fontWeight: 700, fontSize: '0.8rem' }}
          >
            {article.categoryName}
          </Link>
        )}
        <h3>
          <Link to={article.path || `/news/${article.slug || article.id}`}>{article.title}</Link>
        </h3>
        <p>{article.excerpt}</p>
      </div>
    </article>
  )
}

export function LoadingBlock({ text = 'লোড হচ্ছে...' }) {
  return <div className="empty-state">{text}</div>
}

export function ErrorBlock({ error }) {
  return (
    <div className="empty-state" style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}>
      {error || 'কিছু সমস্যা হয়েছে'}
    </div>
  )
}
