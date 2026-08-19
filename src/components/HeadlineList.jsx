import { Link } from 'react-router-dom'
import SafeImage from './SafeImage'

export default function HeadlineList({ items = [] }) {
  if (!items.length) return null

  const half = Math.ceil(items.length / 2)
  const col1 = items.slice(0, half)
  const col2 = items.slice(half)

  return (
    <div className="headline-list-block">
      <ul className="headline-list">
        {col1.map((item) => (
          <li key={item.id}>
            <Link to={item.path || `/news/${item.slug || item.id}`}>
              <SafeImage src={item.image} alt="" />
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
      <ul className="headline-list">
        {col2.map((item) => (
          <li key={item.id}>
            <Link to={item.path || `/news/${item.slug || item.id}`}>
              <SafeImage src={item.image} alt="" />
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
