import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Mail, Shield, LogOut, Save, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'

const Profile = () => {
  const navigate = useNavigate()
  const { user, profile, signOut } = useAuth()
  const [name, setName] = useState(profile?.full_name || '')
  const [email, setEmail] = useState(profile?.email || '')
  const [isSaving, setIsSaving] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: name, email: email })
        .eq('id', user.id)

      if (error) throw error
      alert('Profile updated successfully! ✨')
    } catch (err: any) {
      alert('Update failed: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (!user) {
    return (
      <div style={{ padding: '100px', textAlign: 'center' }}>
        <h2 className="brand-font">Please login to view your profile</h2>
        <button onClick={() => navigate('/login')} className="btn-premium" style={{ marginTop: '20px' }}>Sign In</button>
      </div>
    )
  }

  return (
    <div className="profile-page" style={{ 
      minHeight: '100vh', 
      padding: '40px 20px',
      background: 'var(--bg-primary)'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '32px', fontSize: '1rem', fontWeight: '600' }}
        >
          <ArrowLeft size={18} /> Back
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass" 
            style={{ padding: '40px', textAlign: 'center', height: 'fit-content' }}
          >
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'var(--accent-primary)', margin: '0 auto 20px', overflow: 'hidden' }}>
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <User size={50} color="white" style={{ marginTop: '25px' }} />
              )}
            </div>
            <h2 className="brand-font" style={{ fontSize: '2.2rem', marginBottom: '8px', color: 'var(--accent-primary)' }}>{name}</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '40px', fontSize: '1.1rem' }}>{email}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <Shield size={18} color="var(--accent-primary)" />
                <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>Account Verified</span>
              </div>
              <button 
                onClick={handleLogout}
                style={{ 
                  width: '100%', 
                  padding: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  color: '#ef4444', 
                  border: 'none', 
                  borderRadius: '12px', 
                  fontWeight: '700', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  marginTop: '12px'
                }}
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </motion.div>

          {/* Edit Settings Card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass" 
            style={{ padding: '40px' }}
          >
            <h3 className="brand-font" style={{ fontSize: '1.5rem', marginBottom: '24px' }}>Profile Settings</h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                  <User size={16} /> Full Name
                </label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                  <Mail size={16} /> Email Address
                </label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div style={{ marginTop: '12px' }}>
                <button type="submit" disabled={isSaving} className="btn-premium" style={{ width: '100%', justifyContent: 'center' }}>
                  {isSaving ? 'Updating...' : <><Save size={18} /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default Profile
