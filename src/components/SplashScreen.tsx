import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import logo from '../assets/logo.png'

const SplashScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onComplete, 1000) // Wait for exit animation
    }, 5000)

    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'var(--bg-primary)',
            zIndex: 10000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          {/* Background Ambient Glow */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            style={{
              position: 'absolute',
              width: '600px',
              height: '600px',
              background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 70%)',
              filter: 'blur(80px)',
              zIndex: -1
            }}
          />

          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ 
              type: 'spring',
              stiffness: 100,
              damping: 15,
              delay: 0.2
            }}
            style={{ position: 'relative' }}
          >
            <img
              src={logo}
              alt="Logo"
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                border: '8px solid white',
                boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                objectFit: 'cover'
              }}
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
              style={{
                position: 'absolute',
                top: -15,
                left: -15,
                right: -15,
                bottom: -15,
                border: '2px dashed var(--accent-secondary)',
                borderRadius: '50%',
                opacity: 0.5
              }}
            />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="brand-font"
            style={{ 
              fontSize: '3.5rem', 
              marginTop: '32px', 
              color: 'var(--accent-secondary)',
              letterSpacing: '2px'
            }}
          >
            Cham Creations
          </motion.h1>

          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '200px' }}
            transition={{ delay: 1, duration: 3.5, ease: 'linear' }}
            style={{
              height: '3px',
              background: 'var(--accent-primary)',
              marginTop: '20px',
              borderRadius: '10px',
              boxShadow: '0 0 10px var(--accent-primary)'
            }}
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{ 
              marginTop: '16px', 
              color: 'var(--text-secondary)',
              fontWeight: 500,
              letterSpacing: '1px'
            }}
          >
            HANDMADE WITH LOVE
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SplashScreen
