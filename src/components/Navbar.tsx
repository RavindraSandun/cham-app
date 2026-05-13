import { useState, useEffect } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { LogOut, LayoutDashboard, ShoppingBag, Menu, X, User as UserIcon, Sun, Moon, LogIn } from 'lucide-react'
import logo from '../assets/logo.png'
import { useAuth } from '../contexts/AuthContext'

const Navbar = () => {
  const { user, profile, signOut } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme')
    return saved || 'dark'
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light')
  
  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const isAdmin = profile?.role === 'admin'

  return (
    <nav className={`glass navbar ${isScrolled ? 'scrolled' : ''}`}>
      <Link to="/market" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }} onClick={() => setIsMenuOpen(false)}>
        <img 
          src={logo} 
          alt="Cham Creations Logo" 
          style={{ width: isScrolled ? '42px' : '56px', height: isScrolled ? '42px' : '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent-primary)', transition: 'var(--transition-smooth)' }} 
        />
        <span className="brand-font" style={{ fontSize: isScrolled ? '1.4rem' : '1.8rem', color: 'var(--accent-secondary)', fontWeight: 'bold', transition: 'var(--transition-smooth)' }}>Cham Creations</span>
      </Link>

      <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
        {isAdmin && (
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`} onClick={() => setIsMenuOpen(false)}>
            <LayoutDashboard size={20} /> Dashboard
          </NavLink>
        )}
        <NavLink to="/market" className={({ isActive }) => `nav-link ${isActive ? 'active-link' : ''}`} onClick={() => setIsMenuOpen(false)}>
          <ShoppingBag size={20} /> Market
        </NavLink>
        
        {/* Theme Toggle (Mobile) */}
        <div className="mobile-only" style={{ marginTop: '10px' }}>
          <button onClick={toggleTheme} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', gap: '10px' }}>
            {theme === 'light' ? <><Moon size={18} /> Dark Mode</> : <><Sun size={18} /> Light Mode</>}
          </button>
        </div>
        {/* Mobile Auth (only visible in mobile menu) */}
        <div className="mobile-only" style={{ marginTop: '20px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
          {user ? (
            <button onClick={handleLogout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <LogOut size={16} /> Logout
            </button>
          ) : (
            <button onClick={() => navigate('/login')} className="btn-premium" style={{ width: '100%', justifyContent: 'center' }}>
              <LogIn size={16} /> Login / Sign Up
            </button>
          )}
        </div>
      </div>

      <div className="nav-user-info">
        <button 
          onClick={toggleTheme} 
          title="Toggle Theme"
          style={{ 
            background: 'none', 
            border: 'none', 
            color: 'var(--text-primary)', 
            cursor: 'pointer', 
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            transition: 'var(--transition-smooth)',
            borderRadius: '50%'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.05)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'none'}
        >
          {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
        </button>

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link to="/profile" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              padding: isScrolled ? '4px 14px' : '6px 20px', 
              background: 'rgba(137, 207, 240, 0.1)', 
              borderRadius: '100px',
              border: '1px solid rgba(137, 207, 240, 0.2)',
              transition: 'var(--transition-smooth)',
              textDecoration: 'none',
              color: 'inherit'
            }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-contrast)' }}>
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserIcon size={18} />
                )}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: '700', lineHeight: 1.2 }}>{profile?.full_name || 'Guest User'}</p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{isAdmin ? 'Admin' : 'Member'}</p>
              </div>
            </Link>
            <button 
              onClick={handleLogout} 
              title="Logout"
              style={{ 
                background: 'none', 
                border: 'none', 
                color: '#ef4444', 
                cursor: 'pointer', 
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'var(--transition-smooth)'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <LogOut size={20} />
            </button>
          </div>
        ) : (
          <button onClick={() => navigate('/login')} className="btn-premium" style={{ height: '44px', padding: '0 24px' }}>
            <LogIn size={18} /> Sign In
          </button>
        )}
      </div>

      <button className="mobile-menu-btn" onClick={toggleMenu}>
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>
    </nav>
  )
}

export default Navbar
