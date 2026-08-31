import { Link } from 'react-router-dom'
import { useLang } from '../../context/LanguageContext'

const GROUPS = [
  { title: 'Posts', items: ['View', 'Create', 'Edit', 'Delete', 'Publish'] },
  { title: 'Categories', items: ['View', 'Create', 'Edit', 'Delete'] },
  { title: 'Subcategories', items: ['View', 'Create', 'Edit', 'Delete'] },
  { title: 'Breaking News', items: ['View', 'Create', 'Edit', 'Delete', 'Publish'] },
  { title: 'Gallery', items: ['View', 'Upload', 'Edit', 'Delete'] },
  { title: 'Users', items: ['View', 'Create', 'Edit', 'Delete'] },
  { title: 'Roles', items: ['View', 'Create', 'Edit', 'Delete'] },
  { title: 'Permissions', items: ['View', 'Edit'] },
]

export default function PermissionsPage() {
  const { isEn } = useLang()
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>{isEn ? 'Permissions' : 'পারমিশন'}</h3>
      </div>
      <div className="admin-card-body">
        <p className="text-muted">
          {isEn
            ? 'Assign these actions on each user form. API routes also enforce the same checks — menu hide is not enough.'
            : 'এই অ্যাকশনগুলো প্রতি ইউজার ফর্মে অ্যাসাইন করুন। API-তেও একই চেক আছে — শুধু মেনু হাইড যথেষ্ট নয়।'}
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isEn ? 'Module' : 'মডিউল'}</th>
                <th>{isEn ? 'Actions' : 'অ্যাকশন'}</th>
              </tr>
            </thead>
            <tbody>
              {GROUPS.map((g) => (
                <tr key={g.title}>
                  <td>
                    <strong>{g.title}</strong>
                  </td>
                  <td>{g.items.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/admin/users" className="admin-btn admin-btn-primary" style={{ marginTop: 16 }}>
          {isEn ? 'Customize per user' : 'ইউজার অনুযায়ী কাস্টমাইজ'}
        </Link>
      </div>
    </div>
  )
}
