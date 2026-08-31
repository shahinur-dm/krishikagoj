import { useLang } from '../../context/LanguageContext'

const ROLES = [
  {
    id: 'superadmin',
    nameBn: 'সুপার অ্যাডমিন',
    nameEn: 'Super Admin',
    descBn: 'সব পারমিশন। ড্যাশবোর্ড, পোস্ট, ক্যাটাগরি, ব্রেকিং নিউজ, গ্যালারি, ইউজার, রোল, পারমিশন ও সেটিংস।',
    descEn: 'All permissions: dashboard, posts, categories, breaking news, gallery, users, roles, permissions and settings.',
  },
  {
    id: 'admin',
    nameBn: 'অ্যাডমিন',
    nameEn: 'Admin',
    descBn: 'কন্টেন্ট ম্যানেজমেন্ট। ইউজার/পারমিশন ডিফল্টে নেই, সুপার অ্যাডমিন আলাদা করে দিতে পারে।',
    descEn: 'Content management. User/permission access is off unless Super Admin grants it.',
  },
  {
    id: 'editor',
    nameBn: 'এডিটর',
    nameEn: 'Editor',
    descBn: 'পোস্ট, ক্যাটাগরি, গ্যালারি ও ব্রেকিং নিউজ।',
    descEn: 'Posts, categories, gallery and breaking news.',
  },
  {
    id: 'news_editor',
    nameBn: 'নিউজ এডিটর',
    nameEn: 'News Editor',
    descBn: 'খবর ও ব্রেকিং নিউজ সম্পর্কিত পারমিশন।',
    descEn: 'News and breaking news related permissions.',
  },
  {
    id: 'writer',
    nameBn: 'রাইটার',
    nameEn: 'Writer',
    descBn: 'নিজের পোস্ট লেখা ও সম্পাদনা।',
    descEn: 'Write and edit own posts.',
  },
]

export default function RolesPage() {
  const { isEn } = useLang()
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <h3>{isEn ? 'Roles' : 'রোল'}</h3>
      </div>
      <div className="admin-card-body">
        <p className="text-muted">
          {isEn
            ? 'Role templates used when creating a user. Super Admin can still customize permissions per user.'
            : 'ইউজার তৈরির সময় এই রোল টেমপ্লেট ব্যবহার হয়। সুপার অ্যাডমিন চাইলে প্রতি ইউজারে পারমিশন কাস্টমাইজ করতে পারেন।'}
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{isEn ? 'Role' : 'রোল'}</th>
                <th>{isEn ? 'Description' : 'বিবরণ'}</th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => (
                <tr key={r.id}>
                  <td>
                    <strong>{isEn ? r.nameEn : r.nameBn}</strong>
                    <div>
                      <small>{r.id}</small>
                    </div>
                  </td>
                  <td>{isEn ? r.descEn : r.descBn}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
