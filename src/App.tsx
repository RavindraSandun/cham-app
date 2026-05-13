import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Auth/Login'
import Register from './pages/Auth/Register'
import Profile from './pages/Auth/Profile'
import Dashboard from './pages/Dashboard/Dashboard'
import Market from './pages/Market/Market'
import ProductDetail from './pages/Market/ProductDetail'
import Navbar from './components/Navbar'
import NotFound from './pages/NotFound'
import StatusPage from './pages/Status/Status'
import { useAuth } from './contexts/AuthContext'

function App() {
  const { user, profile, loading } = useAuth()

  // Global SEO Engine
  useEffect(() => {
    const applySEO = () => {
      const keywords = localStorage.getItem('seo_keywords') || 'cham creations, handmade toys, crochet, amigurumi'
      const description = localStorage.getItem('seo_description') || 'Premium handmade crochet creations and custom toys from Cham Creations.'
      
      document.title = `Cham Creations | ${description.split('.')[0]}`
      
      let metaKeywords = document.querySelector('meta[name="keywords"]')
      if (!metaKeywords) {
        metaKeywords = document.createElement('meta')
        metaKeywords.setAttribute('name', 'keywords')
        document.head.appendChild(metaKeywords)
      }
      metaKeywords.setAttribute('content', keywords)
      
      let metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc) {
        metaDesc = document.createElement('meta')
        metaDesc.setAttribute('name', 'description')
        document.head.appendChild(metaDesc)
      }
      metaDesc.setAttribute('content', description)

      const updateOG = (property: string, content: string) => {
        let tag = document.querySelector(`meta[property="${property}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute('property', property)
          document.head.appendChild(tag)
        }
        tag.setAttribute('content', content)
      }

      updateOG('og:title', `Cham Creations | ${description.split('.')[0]}`)
      updateOG('og:description', description)
      updateOG('og:type', 'website')
      updateOG('og:url', window.location.origin)

      const updateTwitter = (name: string, content: string) => {
        let tag = document.querySelector(`meta[name="${name}"]`)
        if (!tag) {
          tag = document.createElement('meta')
          tag.setAttribute('name', name)
          document.head.appendChild(tag)
        }
        tag.setAttribute('content', content)
      }
      updateTwitter('twitter:card', 'summary_large_image')
      updateTwitter('twitter:title', `Cham Creations | ${description.split('.')[0]}`)
      updateTwitter('twitter:description', description)
    }

    applySEO()
    
    window.addEventListener('seoUpdated', applySEO)
    return () => window.removeEventListener('seoUpdated', applySEO)
  }, [])

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }}></div>
      </div>
    )
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <Routes>
          <Route path="/" element={<Navigate to="/market" />} />
          <Route path="/market" element={<Market />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          
          <Route path="/login" element={user ? (isAdmin ? <Navigate to="/dashboard" /> : <Navigate to="/market" />) : <Login />} />
          <Route path="/register" element={user ? (isAdmin ? <Navigate to="/dashboard" /> : <Navigate to="/market" />) : <Register />} />
          
          <Route path="/dashboard" element={isAdmin ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
