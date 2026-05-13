import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Home, AlertTriangle } from 'lucide-react'

const NotFound = () => {
  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '20px'
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{
          maxWidth: '500px',
          width: '100%',
          padding: '60px 40px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <motion.div
          animate={{ 
            rotate: [0, -10, 10, -10, 0],
            scale: [1, 1.1, 1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          style={{ marginBottom: '32px', color: 'var(--accent-primary)' }}
        >
          <AlertTriangle size={80} strokeWidth={1.5} />
        </motion.div>

        <h1 className="brand-font" style={{ fontSize: '4rem', marginBottom: '16px', color: 'var(--text-primary)' }}>404</h1>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '24px', fontWeight: '600' }}>Page Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', lineHeight: '1.6' }}>
          Oops! The creation you're looking for seems to have wandered off or hasn't been handmade yet.
        </p>

        <Link to="/" className="btn-premium" style={{ display: 'inline-flex', gap: '10px', alignItems: 'center' }}>
          <Home size={20} />
          Back to Dashboard
        </Link>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--accent-primary)',
          opacity: 0.05,
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '-50px',
          width: '150px',
          height: '150px',
          background: 'var(--accent-secondary)',
          opacity: 0.05,
          borderRadius: '50%',
          filter: 'blur(40px)'
        }} />
      </motion.div>
    </div>
  )
}

export default NotFound
