import { useState, useEffect } from 'react'
import { fetchDbStatus } from '../../api'
import { motion, AnimatePresence } from 'framer-motion'
import { Database, Activity, ShieldCheck, Cpu, RefreshCw } from 'lucide-react'

const StatusPage = () => {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [latency, setLatency] = useState<number | null>(null)

  const check = async () => {
    const start = performance.now()
    setLoading(true)
    try {
      const data = await fetchDbStatus()
      setStatus(data)
      setLatency(Math.round(performance.now() - start))
    } catch (err) {
      setStatus({ connected: false, error: 'Network Disruption Detected' })
      setLatency(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <div style={{ 
      padding: '140px 5% 60px', 
      minHeight: '100vh', 
      background: 'radial-gradient(circle at top right, rgba(137, 207, 240, 0.05), transparent 40%), radial-gradient(circle at bottom left, rgba(255, 105, 180, 0.05), transparent 40%)',
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center' 
    }}>
      <style>{`
        .status-card {
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(25px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 40px;
          padding: 48px;
          width: 100%;
          max-width: 700px;
          box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
        }
        .status-item {
          padding: 24px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }
        .status-item:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .pulse-circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          position: relative;
        }
        .pulse-glow {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(3); opacity: 0; }
        }
        .live-green { background: #4ade80; box-shadow: 0 0 15px #4ade80; }
        .live-red { background: #ef4444; box-shadow: 0 0 15px #ef4444; }
        .latency-badge {
          font-size: 0.75rem;
          padding: 4px 10px;
          background: rgba(255,255,255,0.05);
          border-radius: 6px;
          color: var(--text-secondary);
          font-family: monospace;
        }
      `}</style>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="status-card"
      >
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', background: 'rgba(74, 103, 65, 0.1)', padding: '10px 24px', borderRadius: '100px', marginBottom: '20px' }}>
            <Activity size={20} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--accent-primary)' }}>REAL-TIME DIAGNOSTICS</span>
          </div>
          <h1 className="brand-font" style={{ fontSize: '3rem', margin: '0 0 8px' }}>System Health</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Global Infrastructure & Connectivity Status</p>
        </div>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* API Engine */}
          <div className="status-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(137, 207, 240, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Cpu color="var(--accent-primary)" size={28} />
              </div>
              <div>
                <p style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '4px' }}>API Backend Engine</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{status?.server || 'Vercel Edge Network'} • Operational</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {latency && <span className="latency-badge">{latency}ms</span>}
              <div className="pulse-circle live-green">
                <div className="pulse-glow live-green" style={{ animationDelay: '0.5s' }} />
              </div>
            </div>
          </div>

          {/* Database Engine */}
          <div className="status-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ 
                width: '56px', height: '56px', 
                background: status?.connected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.5s'
              }}>
                <Database color={status?.connected ? "#4ade80" : "#ef4444"} size={28} />
              </div>
              <div>
                <p style={{ fontWeight: '800', fontSize: '1.25rem', marginBottom: '4px' }}>Supabase Cloud DB</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>PostgreSQL • {status?.connected ? 'Database is Live' : 'Connection Error'}</p>
              </div>
            </div>
            <div className="pulse-circle" style={{ background: status?.connected ? '#4ade80' : '#ef4444', boxShadow: `0 0 15px ${status?.connected ? '#4ade80' : '#ef4444'}` }}>
              {status?.connected && <div className="pulse-glow live-green" />}
              {!status?.connected && !loading && <div className="pulse-glow live-red" />}
            </div>
          </div>

          {/* Security Shield */}
          <div className="status-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ width: '56px', height: '56px', background: 'rgba(255, 105, 180, 0.1)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck color="var(--accent-secondary)" size={28} />
              </div>
              <div>
                <p style={{ fontWeight: '700', fontSize: '1.1rem' }}>Security Layer</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>SSL Encryption • AES-256</p>
              </div>
            </div>
            <div className="pulse-circle live-green">
              <div className="pulse-glow live-green" style={{ animationDelay: '1s' }} />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {status && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '32px', overflow: 'hidden' }}
            >
              <div style={{ padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%' }} />
                    <div style={{ width: '10px', height: '10px', background: '#fbbf24', borderRadius: '50%' }} />
                    <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%' }} />
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#a5b4fc', letterSpacing: '2px' }}>SYSTEM_LOG_DUMP.SH</span>
                </div>
                <pre style={{ 
                  overflowX: 'auto', 
                  color: '#4ade80', 
                  fontSize: '0.875rem', 
                  fontFamily: 'monospace',
                  background: 'rgba(0,0,0,0.4)',
                  padding: '16px',
                  borderRadius: '12px',
                  lineHeight: '1.5',
                  border: '1px solid rgba(74, 222, 128, 0.1)'
                }}>
                  {JSON.stringify(status, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button 
          onClick={check} 
          className="btn-premium" 
          style={{ 
            width: '100%', 
            marginTop: '40px', 
            height: '64px', 
            borderRadius: '20px',
            fontSize: '1.1rem',
            background: loading ? 'rgba(255,255,255,0.1)' : 'var(--accent-primary)',
            color: loading ? 'var(--text-secondary)' : 'var(--accent-contrast)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: loading ? 'none' : '0 15px 30px rgba(137, 207, 240, 0.3)'
          }}
          disabled={loading}
        >
          <RefreshCw className={loading ? "spin" : ""} size={22} />
          {loading ? 'RUNNING DIAGNOSTICS...' : 'RE-VERIFY CONNECTION'}
        </button>
      </motion.div>

      <div style={{ marginTop: '40px', display: 'flex', gap: '32px', color: 'var(--text-secondary)', fontSize: '0.875rem', fontWeight: '600' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} /> Operational
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%' }} /> Degraded
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} /> Outage
        </div>
      </div>
    </div>
  )
}

export default StatusPage
