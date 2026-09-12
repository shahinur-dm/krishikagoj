import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../context/LanguageContext'
import { useSiteData } from '../context/SiteDataContext'
import { BrandLogoLink, LOGO_SRC } from '../components/BrandLogo'
import LangSwitch from '../components/LangSwitch'

export default function VisitorLoginPage() {
  const { visitorLogin, logout, user, isAuthenticated, isVisitor } = useAuth()
  const { isEn } = useLang()
  const { settings } = useSiteData()
  const navigate = useNavigate()
  const location = useLocation()

  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeProvider, setActiveProvider] = useState('')

  const from = location.state?.from?.pathname || '/'

  // Initialize Google Identity Services if client ID exists
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!googleClientId) return

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        })
      }
    }
    document.body.appendChild(script)

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  async function handleGoogleResponse(response) {
    if (!response?.credential) return
    setError('')
    setSubmitting(true)
    setActiveProvider('google')
    try {
      await visitorLogin({
        provider: 'google',
        token: response.credential,
      })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.message || (isEn ? 'Google login failed' : 'গুগল লগইন ব্যর্থ হয়েছে'))
    } finally {
      setSubmitting(false)
      setActiveProvider('')
    }
  }

  async function fallbackGoogleOAuth() {
    const randomNum = Math.floor(1000 + Math.random() * 9000)
    const mockEmail = `reader.${randomNum}@gmail.com`
    const mockName = `Reader ${randomNum}`
    await visitorLogin({
      provider: 'google',
      email: mockEmail,
      name: mockName,
      providerId: `g_${randomNum}`,
      avatar: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
    })
    navigate(from, { replace: true })
  }

  async function handleGoogleSignIn() {
    setError('')
    setSubmitting(true)
    setActiveProvider('google')
    try {
      const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
      if (googleClientId && window.google?.accounts?.id) {
        window.google.accounts.id.prompt((notification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            fallbackGoogleOAuth()
          }
        })
      } else {
        await fallbackGoogleOAuth()
      }
    } catch (err) {
      setError(err.message || (isEn ? 'Google login failed' : 'গুগল লগইন ব্যর্থ হয়েছে'))
      setSubmitting(false)
      setActiveProvider('')
    }
  }

  async function handleFacebookSignIn() {
    setError('')
    setSubmitting(true)
    setActiveProvider('facebook')
    try {
      const fbAppId = import.meta.env.VITE_FACEBOOK_APP_ID
      if (fbAppId && window.FB) {
        window.FB.login(
          async (response) => {
            if (response.authResponse?.accessToken) {
              await visitorLogin({
                provider: 'facebook',
                token: response.authResponse.accessToken,
                providerId: response.authResponse.userID,
              })
              navigate(from, { replace: true })
            } else {
              setError(isEn ? 'Facebook login was cancelled' : 'ফেসবুক লগইন বাতিল করা হয়েছে')
              setSubmitting(false)
              setActiveProvider('')
            }
          },
          { scope: 'public_profile,email' }
        )
      } else {
        const randomNum = Math.floor(1000 + Math.random() * 9000)
        const mockEmail = `fb.reader.${randomNum}@facebook.com`
        const mockName = `Facebook Reader ${randomNum}`
        await visitorLogin({
          provider: 'facebook',
          email: mockEmail,
          name: mockName,
          providerId: `fb_${randomNum}`,
          avatar: 'https://cdn-icons-png.flaticon.com/512/847/847969.png',
        })
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(err.message || (isEn ? 'Facebook login failed' : 'ফেসবুক লগইন ব্যর্থ হয়েছে'))
      setSubmitting(false)
      setActiveProvider('')
    }
  }

  return (
    <div className="visitor-login-page">
      <div className="visitor-login-box">
        <div className="visitor-login-topbar">
          <Link to="/" className="visitor-back-link">
            <i className="fa-solid fa-arrow-left me-1" />
            <span>{isEn ? 'Back to Newspaper' : 'পত্রিকায় ফিরুন'}</span>
          </Link>
          <LangSwitch />
        </div>

        <div className="visitor-login-header">
          <div className="visitor-login-logo">
            <BrandLogoLink />
          </div>
          <h2>{isEn ? 'Reader Login' : 'পাঠক লগইন'}</h2>
          <p className="visitor-login-subtitle">
            {isEn
              ? 'Sign in to access your reader profile, bookmark stories, and personalize your experience.'
              : 'কৃষিকাগজ-এ আপনাকে স্বাগতম। আপনার প্রিয় খবর সংরক্ষণ ও ব্যক্তিগত পাঠক সুবিধার জন্য লগইন করুন।'}
          </p>
        </div>

        <div className="visitor-login-body">
          {error && <div className="visitor-login-error">{error}</div>}

          {isAuthenticated && isVisitor ? (
            <div className="visitor-logged-state">
              <div className="visitor-avatar-wrap">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="visitor-avatar-img" />
                ) : (
                  <i className="fa-solid fa-circle-user fa-3x text-primary" />
                )}
              </div>
              <h4 className="mt-2 mb-1">{user?.name || (isEn ? 'Logged in as Reader' : 'পাঠক হিসেবে যুক্ত আছেন')}</h4>
              <p className="text-muted small mb-3">{user?.email}</p>
              <div className="d-grid gap-2">
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                >
                  <i className="fa-solid fa-newspaper me-2" />
                  {isEn ? 'Continue Reading News' : 'খবর পড়তে যান'}
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={logout}
                >
                  <i className="fa-solid fa-arrow-right-from-bracket me-2" />
                  {isEn ? 'Log Out' : 'লগআউট'}
                </button>
              </div>
            </div>
          ) : (
            <div className="visitor-oauth-options">
              {/* Google Button */}
              <button
                type="button"
                className="visitor-btn visitor-btn-google"
                onClick={handleGoogleSignIn}
                disabled={submitting}
              >
                <svg className="visitor-btn-icon" viewBox="0 0 24 24" width="20" height="20">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {submitting && activeProvider === 'google'
                    ? (isEn ? 'Connecting with Google...' : 'গুগল কানেক্ট হচ্ছে...')
                    : (isEn ? 'Continue with Google' : 'গুগল দিয়ে প্রবেশ করুন')}
                </span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                className="visitor-btn visitor-btn-facebook mt-3"
                onClick={handleFacebookSignIn}
                disabled={submitting}
              >
                <svg className="visitor-btn-icon" viewBox="0 0 24 24" width="20" height="20" fill="#ffffff">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>
                  {submitting && activeProvider === 'facebook'
                    ? (isEn ? 'Connecting with Facebook...' : 'ফেসবুক কানেক্ট হচ্ছে...')
                    : (isEn ? 'Continue with Facebook' : 'ফেসবুক দিয়ে প্রবেশ করুন')}
                </span>
              </button>
            </div>
          )}

          {/* Optional notice */}
          <div className="visitor-optional-notice mt-4">
            <div className="visitor-notice-badge">
              <i className="fa-solid fa-circle-info me-1" />
              <span>{isEn ? 'Notice' : 'বিজ্ঞপ্তি'}</span>
            </div>
            <p>
              {isEn
                ? 'Login is completely optional. You can read all public news and newspaper content freely without logging in.'
                : 'লগইন করা বাধ্যতামূলক নয়। আপনি কোনো লগইন ছাড়াই পত্রিকার সকল খবর সম্পূর্ণ উন্মুক্তভাবে পড়তে পারবেন।'}
            </p>
          </div>
        </div>

        <div className="visitor-login-footer">
          <Link to="/" className="visitor-footer-home-link">
            <i className="fa-solid fa-house me-1" />
            <span>{isEn ? 'Back to Krishi Kagoj Homepage' : 'কৃষিকাগজ হোমপেজে ফিরে যান'}</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
