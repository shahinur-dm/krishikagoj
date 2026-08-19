import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LanguageProvider, useLang } from './context/LanguageContext'
import ProtectedRoute from './components/admin/ProtectedRoute'
import Layout from './Layout'
import HomePage from './pages/HomePage'
import CategoryPage from './pages/CategoryPage'
import ArticlePage from './pages/ArticlePage'
import SearchPage from './pages/SearchPage'
import VideosPage from './pages/VideosPage'
import PhotosPage from './pages/PhotosPage'
import LoginPage from './pages/admin/LoginPage'
import './styles/global.css'

const RegisterPage = lazy(() => import('./pages/admin/RegisterPage'))
const HomeLeadPage = lazy(() => import('./pages/admin/HomeLeadPage'))
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'))
const DashboardPage = lazy(() => import('./pages/admin/DashboardPage'))
const CategoriesPage = lazy(() => import('./pages/admin/CategoriesPage'))
const SubcategoriesPage = lazy(() => import('./pages/admin/SubcategoriesPage'))
const PostFormPage = lazy(() => import('./pages/admin/PostFormPage'))
const PostsListPage = lazy(() => import('./pages/admin/PostsListPage'))
const PhotoGalleryPage = lazy(() => import('./pages/admin/PhotoGalleryPage'))
const VideoGalleryPage = lazy(() => import('./pages/admin/VideoGalleryPage'))
const StaffPage = lazy(() => import('./pages/admin/StaffPage'))
const WritersPage = lazy(() => import('./pages/admin/WritersPage'))
const PasswordPage = lazy(() => import('./pages/admin/PasswordPage'))
const WebsiteSettingsPage = lazy(() => import('./pages/admin/WebsiteSettingsPage'))
const LiveTvPage = lazy(() => import('./pages/admin/LiveTvPage'))
const NamazPage = lazy(() => import('./pages/admin/NamazPage'))
const NoticePage = lazy(() => import('./pages/admin/NoticePage'))
const SocialPage = lazy(() => import('./pages/admin/SocialPage'))
const SeoPage = lazy(() => import('./pages/admin/SeoPage'))
const AdsPage = lazy(() => import('./pages/admin/AdsPage'))
const ImportantWebsitesPage = lazy(() => import('./pages/admin/ImportantWebsitesPage'))

function AdminFallback() {
  const { t } = useLang()
  return (
    <div className="container py-5 text-center text-muted">
      {t.adminLoading}
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/register"
            element={
              <Suspense fallback={<AdminFallback />}>
                <RegisterPage />
              </Suspense>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Suspense fallback={<AdminFallback />}>
                  <AdminLayout />
                </Suspense>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/home" replace />} />
            <Route path="home" element={<DashboardPage />} />
            <Route path="categories" element={<CategoriesPage />} />
            <Route path="subcategories" element={<SubcategoriesPage />} />
            <Route path="posts" element={<PostsListPage />} />
            <Route path="posts/new" element={<PostFormPage />} />
            <Route path="posts/:id" element={<PostFormPage />} />
            <Route path="photos" element={<PhotoGalleryPage />} />
            <Route path="videos" element={<VideoGalleryPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="writers" element={<WritersPage />} />
            <Route path="password" element={<PasswordPage />} />
            <Route path="website" element={<WebsiteSettingsPage />} />
            <Route path="livetv" element={<LiveTvPage />} />
            <Route path="namaz" element={<NamazPage />} />
            <Route path="notice" element={<NoticePage />} />
            <Route path="social" element={<SocialPage />} />
            <Route path="home-lead" element={<HomeLeadPage />} />
            <Route path="seo" element={<SeoPage />} />
            <Route path="ads" element={<AdsPage />} />
            <Route path="important-websites" element={<ImportantWebsitesPage />} />
          </Route>

          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="search" element={<SearchPage />} />
            <Route path="category/:slug" element={<CategoryPage />} />
            <Route path="news/:id" element={<ArticlePage />} />
            <Route path="videos" element={<VideosPage />} />
            <Route path="photos" element={<PhotosPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </LanguageProvider>
  )
}
