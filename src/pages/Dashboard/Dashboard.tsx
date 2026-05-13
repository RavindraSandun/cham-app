import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Package, TrendingUp, DollarSign, Image as ImageIcon, X, Pencil, Trash2, Clock, Database, Server, RefreshCw, ChevronDown, ChevronUp, Search, Activity, Target, Sparkles, Send, Globe, CheckCircle } from 'lucide-react'

import { fetchProducts, createProduct, deleteProduct, fetchDbStatus, updateProduct } from '../../api'
import type { Product } from '../../api'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'

const StatCard = ({ icon, label, value }: { icon: React.ReactNode, label: string, value: string | number }) => (
  <div className="glass" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
    <div style={{ padding: '12px', background: 'var(--bg-primary)', borderRadius: '16px' }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{label}</p>
      <p style={{ fontSize: '1.5rem', fontWeight: '700' }}>{value}</p>
    </div>
  </div>
)

const Dashboard = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [dbConnected, setDbConnected] = useState<boolean | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)
  const [detailedStatus, setDetailedStatus] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [loading, setLoading] = useState(true)

  // SEO State
  const [seoKeywords, setSeoKeywords] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [seoHistory, setSeoHistory] = useState<any[]>([])
  const [showSeoHistory, setShowSeoHistory] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [savingSeo, setSavingSeo] = useState(false)

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newProduct, setNewProduct] = useState<{
    name: string;
    price: string;
    offerPrice: string;
    offerExpiry: string;
    description: string;
    images: any[];
    category: string;
    discountPercentage: string;
  }>({
    name: '',
    price: '',
    offerPrice: '',
    offerExpiry: '',
    description: '',
    images: [],
    category: '',
    discountPercentage: ''
  })

  const { user: adminUser } = useAuth()
  const [chatUsers, setChatUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [adminChatMessage, setAdminChatMessage] = useState('')
  const [adminChatHistory, setAdminChatHistory] = useState<any[]>([])
  const [isAdminUploading, setIsAdminUploading] = useState(false)
  const [adminChatImage, setAdminChatImage] = useState<File | null>(null)

  useEffect(() => {
    loadProducts()
    checkStatus()
    fetchChatUsers()

    // Load SEO settings
    const savedKeywords = localStorage.getItem('seo_keywords') || ''
    const savedDesc = localStorage.getItem('seo_description') || ''
    const savedHistory = JSON.parse(localStorage.getItem('seo_history') || '[]')
    setSeoKeywords(savedKeywords)
    setSeoDescription(savedDesc)
    setSeoHistory(savedHistory)

    const interval = setInterval(() => {
      checkStatus()
    }, 10000) // Check every 10s
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedUser) {
      fetchAdminChatHistory(selectedUser.id)
      
      const subscription = supabase
        .channel(`chat_${selectedUser.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          if (payload.new.sender_id === selectedUser.id || payload.new.receiver_id === selectedUser.id) {
            setAdminChatHistory(prev => [...prev, payload.new])
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [selectedUser])

  const fetchChatUsers = async () => {
    // Fetch unique users who have sent messages
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('sender_id')
      .not('sender_id', 'is', null)

    if (messages) {
      const uniqueIds = Array.from(new Set(messages.map(m => m.sender_id)))
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', uniqueIds)
      
      if (profiles) setChatUsers(profiles)
    }
  }

  const fetchAdminChatHistory = async (userId: string) => {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
      .order('created_at', { ascending: true })
    
    if (data) setAdminChatHistory(data)
  }

  const handleAdminSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser || !adminUser || (!adminChatMessage.trim() && !adminChatImage)) return

    let imageUrl = ''
    if (adminChatImage) {
      setIsAdminUploading(true)
      const fileExt = adminChatImage.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, adminChatImage)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName)
        imageUrl = publicUrl
      }
      setIsAdminUploading(false)
    }

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        sender_id: adminUser.id,
        receiver_id: selectedUser.id,
        content: adminChatMessage,
        image_url: imageUrl,
        is_admin_message: true
      }])

    if (!error) {
      setAdminChatMessage('')
      setAdminChatImage(null)
    }
  }

  const checkStatus = async () => {
    setCheckingStatus(true)
    const status = await fetchDbStatus()
    setDbConnected(status.connected)
    setDetailedStatus(status)
    setCheckingStatus(false)
  }

  const loadProducts = async () => {
    try {
      setLoading(true)
      const data = await fetchProducts()
      setProducts(data)
      setError(null)
    } catch (err: any) {
      console.error('Failed to load products:', err)
      setError('Could not connect to database. Please ensure your Supabase environment variables are set correctly in Vercel.')
    } finally {
      setLoading(false)
    }
  }



  const saveSeoSettings = () => {
    setSavingSeo(true)
    localStorage.setItem('seo_keywords', seoKeywords)
    localStorage.setItem('seo_description', seoDescription)

    // Trigger global SEO update
    window.dispatchEvent(new Event('seoUpdated'))

    // Update History
    if (seoKeywords.trim() || seoDescription.trim()) {
      const snapshot = { keywords: seoKeywords, description: seoDescription, date: new Date().toISOString() }
      // Filter out exact matches to avoid duplicates, keep latest 10
      const newHistory = [snapshot, ...seoHistory.filter(h => h.keywords !== seoKeywords || h.description !== seoDescription)].slice(0, 10)
      setSeoHistory(newHistory)
      localStorage.setItem('seo_history', JSON.stringify(newHistory))
    }

    setTimeout(() => {
      setSavingSeo(false)
      setSuccess('SEO Settings updated successfully! 🚀')
      setTimeout(() => setSuccess(null), 3000)
    }, 800)
  }

  const clearSeoHistory = () => {
    setSeoHistory([])
    localStorage.removeItem('seo_history')
    setShowClearConfirm(false)
    setSuccess('SEO History cleared successfully! 🧹')
    setTimeout(() => setSuccess(null), 3000)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    const files = Array.from(e.target.files)
    if (newProduct.images.length + files.length > 10) {
      alert("You can upload a maximum of 10 images.")
      return
    }

    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewProduct(prev => ({
          ...prev,
          images: [...prev.images, reader.result]
        }))
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index: number) => {
    setNewProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newProduct.images.length === 0) {
      alert("Please upload at least one image.")
      return
    }

    try {
      if (editingId) {
        await updateProduct(editingId, newProduct)
        setSuccess('Product updated successfully!')
      } else {
        await createProduct(newProduct)
        setSuccess('Product added successfully!')
      }
      loadProducts()
      setNewProduct({ name: '', price: '', offerPrice: '', offerExpiry: '', description: '', images: [], category: '', discountPercentage: '' })
      setShowAddForm(false)
      setEditingId(null)
      setTimeout(() => setSuccess(null), 5000)
    } catch (err: any) {
      alert(`Failed to ${editingId ? 'update' : 'add'} product: ` + err.message)
    }
  }

  const openEditForm = (product: Product) => {
    setNewProduct({
      name: product.name,
      price: product.price,
      offerPrice: product.offerPrice || '',
      offerExpiry: product.offerExpiry || '',
      description: product.description,
      images: product.images,
      category: product.category || '',
      discountPercentage: product.discountPercentage || ''
    })
    setEditingId(product._id)
    setShowAddForm(true)
  }

  const closeForm = () => {
    setNewProduct({ name: '', price: '', offerPrice: '', offerExpiry: '', description: '', images: [], category: '', discountPercentage: '' })
    setShowAddForm(false)
    setEditingId(null)
  }

  return (
    <div className="dashboard-page" style={{ padding: '140px 5% 40px' }}>
      {/* Integrated System Status Section */}
      <div className="glass" style={{ padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Activity size={20} color="var(--accent-primary)" />
            <span style={{ fontSize: '0.875rem', fontWeight: '900', letterSpacing: '2px', color: 'var(--accent-primary)' }}>INFRASTRUCTURE HEALTH</span>
          </div>
          <button
            onClick={checkStatus}
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)', padding: '6px 14px', borderRadius: '100px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', transition: 'var(--transition-smooth)' }}
            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            {checkingStatus ? <RefreshCw className="spin" size={14} /> : <RefreshCw size={14} />} Refresh Status
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {/* API Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '32px', height: '32px', background: 'rgba(137, 207, 240, 0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Server size={16} color="var(--accent-primary)" />
              </div>
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '2px' }}>API Engine</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{detailedStatus?.server || 'Vercel Edge Network'} • Active</p>
              </div>
            </div>
            <div className="pulse-circle live-green">
              <div className="pulse-glow live-green" />
            </div>
          </div>

          {/* Database Status */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '32px', height: '32px',
                background: dbConnected ? 'rgba(74, 222, 128, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Database size={16} color={dbConnected ? "#4ade80" : "#ef4444"} />
              </div>
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '2px' }}>Supabase DataBase</p>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: '600' }}>{dbConnected ? 'Connected' : 'Sync Error'}</p>
              </div>
            </div>
            <div className="pulse-circle" style={{ background: dbConnected ? '#4ade80' : '#ef4444', boxShadow: `0 0 10px ${dbConnected ? '#4ade80' : '#ef4444'}` }}>
              <div className={`pulse-glow ${dbConnected ? 'live-green' : 'live-red'}`} />
            </div>
          </div>
        </div>

        {detailedStatus && (
          <div style={{ marginTop: '16px' }}>
            <button
              onClick={() => setShowDebug(!showDebug)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem' }}
            >
              {showDebug ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showDebug ? 'Hide Debug Info' : 'Show Debug Info'}
            </button>

            {showDebug && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{ marginTop: '12px', padding: '16px', background: 'rgba(0,0,0,0.15)', borderRadius: '12px', fontSize: '0.875rem', overflowX: 'auto' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '10px' }}>
                  <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }} />
                  <div style={{ width: '8px', height: '8px', background: '#fbbf24', borderRadius: '50%' }} />
                  <div style={{ width: '8px', height: '8px', background: '#4ade80', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#a5b4fc', letterSpacing: '1px', marginLeft: '10px' }}>DEBUG INFO. </span>
                </div>
                <pre style={{
                  color: '#4ade80',
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid rgba(74, 222, 128, 0.1)'
                }}>
                  {JSON.stringify(detailedStatus, null, 2)}
                </pre>
              </motion.div>
            )}
          </div>
        )}

        <style>{`
          .spin { animation: rotate 2s linear infinite; }
          @keyframes rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          
          .pulse-circle {
            width: 10px;
            height: 10px;
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
          .live-green { background: #4ade80; box-shadow: 0 0 10px #4ade80; }
          .live-red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }
        `}</style>
      </div>

      <header style={{ marginBottom: '48px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '24px' }}>
        <div>
          <h1 className="brand-font dashboard-title" style={{ marginBottom: '8px' }}>Store Dashboard</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>Welcome back, here's what's happening today.</p>
        </div>
      </header>

      {/* Connection Warning Banner */}
      {error && (
        <div style={{ padding: '12px 24px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '12px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>⚠️ {error} (Using local temporary storage)</p>
          <button onClick={loadProducts} style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '4px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem' }}>Retry</button>
        </div>
      )}

      {/* Success Banner */}
      {success && (
        <div style={{ padding: '12px 24px', background: 'rgba(74, 103, 65, 0.1)', color: '#4a6741', borderRadius: '12px', marginBottom: '24px' }}>
          <p style={{ fontSize: '0.9rem', fontWeight: '600' }}>✅ {success}</p>
        </div>
      )}

      {/* Stats Section */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        <StatCard icon={<Package color="#4a6741" />} label="Total Products" value={products.length} />
        <StatCard icon={<TrendingUp color="#d4a373" />} label="Active Listings" value={products.length} />
        <StatCard icon={<DollarSign color="#4a6741" />} label="Potential Revenue" value={`Rs. ${products.reduce((acc, p) => acc + parseFloat(p.price || "0"), 0).toLocaleString()}`} />
      </div>

      {/* Inventory Section */}
      <div className="glass" style={{ padding: '32px' }}>
        <section style={{ marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '24px' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <h2 className="brand-font" style={{ fontSize: '2.5rem', color: 'var(--accent-secondary)' }}>Stock Inventory</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Manage your creations and update prices</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '650px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  placeholder="Search inventory..."
                  className="input-field"
                  style={{ paddingLeft: '44px', borderRadius: '12px', height: '48px', fontSize: '0.95rem', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
                />
              </div>
              <button onClick={() => {
                setNewProduct({ name: '', price: '', offerPrice: '', offerExpiry: '', description: '', images: [], category: '', discountPercentage: '' })
                setEditingId(null)
                setShowAddForm(true)
              }} className="btn-premium" style={{ height: '48px', padding: '0 24px' }}>
                <Plus size={18} /> Add New Product
              </button>
            </div>
          </div>

          {loading ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center' }}>
              <p className="loading-dots">Loading your creations</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass" style={{ padding: '60px', textAlign: 'center', borderRadius: '32px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🧶</div>
              <h3>No creations yet!</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>Time to add your first masterpiece to the store.</p>
              <button onClick={() => setShowAddForm(true)} className="btn-premium">Add First Product</button>
            </div>
          ) : (
            <div className="glass" style={{ overflow: 'hidden', borderRadius: '24px', border: '1px solid var(--glass-border)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'rgba(137, 207, 240, 0.03)', textAlign: 'left', borderBottom: '1px solid var(--glass-border)' }}>
                      <th className="label-caps" style={{ padding: '20px 24px', color: 'var(--accent-primary)' }}>Product Details</th>
                      <th className="label-caps" style={{ padding: '20px 24px', color: 'var(--accent-primary)' }}>Category</th>
                      <th className="label-caps" style={{ padding: '20px 24px', color: 'var(--accent-primary)' }}>Pricing</th>
                      <th className="label-caps" style={{ padding: '20px 24px', color: 'var(--accent-primary)' }}>Date Created</th>
                      <th className="label-caps" style={{ padding: '20px 24px', color: 'var(--accent-primary)', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product, idx) => (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        style={{
                          borderBottom: idx === products.length - 1 ? 'none' : '1px solid var(--glass-border)',
                          transition: 'background 0.3s'
                        }}
                        className="inventory-row"
                      >
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                              <img
                                src={product.images[0]}
                                alt=""
                                style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--glass-border)' }}
                              />
                              {product.images.length > 1 && (
                                <div style={{ position: 'absolute', bottom: '-6px', right: '-6px', background: 'var(--accent-secondary)', color: 'white', borderRadius: '50%', width: '20px', height: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '2px solid var(--bg-primary)' }}>
                                  {product.images.length}
                                </div>
                              )}
                            </div>
                            <div>
                              <p style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{product.name}</p>
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <span style={{ padding: '6px 12px', background: 'rgba(137, 207, 240, 0.1)', color: 'var(--accent-primary)', borderRadius: '8px', fontSize: '0.875rem', fontWeight: 'bold' }}>
                            {product.category || 'Standard'}
                          </span>
                        </td>
                        <td style={{ padding: '16px 24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            {product.offerPrice ? (
                              <>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 'bold', fontSize: '1rem' }}>Rs. {parseFloat(product.offerPrice).toLocaleString()}</span>
                                  {product.discountPercentage && (
                                    <span style={{ background: 'var(--accent-secondary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>-{product.discountPercentage}%</span>
                                  )}
                                </div>
                                <span style={{ color: 'var(--text-secondary)', textDecoration: 'line-through', fontSize: '0.875rem' }}>Rs. {parseFloat(product.price).toLocaleString()}</span>
                              </>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>Rs. {parseFloat(product.price).toLocaleString()}</span>
                                {product.discountPercentage && (
                                  <span style={{ background: 'var(--accent-secondary)', color: 'white', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>-{product.discountPercentage}%</span>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                          {new Date(product.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {deletingProductId === product._id ? (
                              <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                style={{ display: 'flex', alignItems: 'center', gap: '15px', background: 'rgba(239, 68, 68, 0.1)', padding: '8px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                              >
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#ef4444' }}>Are you sure to delete?</span>
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteProduct(product._id)
                                      setDeletingProductId(null)
                                      loadProducts()
                                      setSuccess('Product deleted successfully! 🎀')
                                      setTimeout(() => setSuccess(null), 3000)
                                    } catch (err: any) {
                                      alert(`Failed: ${err.message}`)
                                    }
                                  }}
                                  style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 'bold' }}
                                >
                                  delete
                                </button>
                                <button
                                  onClick={() => setDeletingProductId(null)}
                                  style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
                                >
                                  cancel
                                </button>
                              </motion.div>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditForm(product)}
                                  className="action-btn-edit"
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    border: 'none',
                                    color: '#3b82f6',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                  }}
                                  title="Edit Product"
                                >
                                  <Pencil size={18} />
                                </button>
                                <button
                                  onClick={() => setDeletingProductId(product._id)}
                                  className="action-btn-delete"
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: 'none',
                                    color: '#ef4444',
                                    padding: '10px',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                  }}
                                  title="Delete Product"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Live Support Section */}
      <div className="glass" style={{ padding: '32px', marginTop: '32px' }}>
        <h3 style={{ fontSize: '1.5rem', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Sparkles color="var(--accent-secondary)" /> Live Support Chat
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', height: '600px' }}>
          {/* User List */}
          <div style={{ borderRight: '1px solid var(--glass-border)', overflowY: 'auto', paddingRight: '20px' }}>
            <p className="label-caps" style={{ marginBottom: '16px' }}>Active Conversations</p>
            {chatUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => setSelectedUser(user)}
                style={{ 
                  padding: '12px', 
                  borderRadius: '12px', 
                  cursor: 'pointer', 
                  background: selectedUser?.id === user.id ? 'var(--accent-primary)' : 'rgba(255,255,255,0.03)',
                  color: selectedUser?.id === user.id ? 'white' : 'inherit',
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '12px',
                  marginBottom: '10px',
                  transition: 'all 0.3s'
                }}
              >
                <img src={user.avatar_url || 'https://via.placeholder.com/40'} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user.full_name}</p>
                  <p style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user.email}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Chat Window */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {selectedUser ? (
              <>
                <div style={{ padding: '0 0 20px', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={selectedUser.avatar_url} alt="" style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                  <div>
                    <h4 style={{ margin: 0 }}>{selectedUser.full_name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#4ade80' }}>Online</span>
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {adminChatHistory.map((msg, i) => (
                    <div key={i} style={{
                      alignSelf: msg.sender_id === adminUser?.id ? 'flex-end' : 'flex-start',
                      background: msg.sender_id === adminUser?.id ? 'var(--accent-secondary)' : 'var(--bg-secondary)',
                      color: msg.sender_id === adminUser?.id ? 'white' : 'inherit',
                      padding: '10px 16px',
                      borderRadius: '18px',
                      borderBottomRightRadius: msg.sender_id === adminUser?.id ? '4px' : '18px',
                      borderBottomLeftRadius: msg.sender_id !== adminUser?.id ? '4px' : '18px',
                      maxWidth: '70%',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}>
                      {msg.image_url && <img src={msg.image_url} style={{ width: '100%', borderRadius: '12px', marginBottom: '8px' }} />}
                      {msg.content}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAdminSendChat} style={{ display: 'flex', gap: '12px', padding: '20px 0 0', borderTop: '1px solid var(--glass-border)' }}>
                  <label style={{ cursor: 'pointer' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ImageIcon size={20} />
                    </div>
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setAdminChatImage(e.target.files?.[0] || null)} />
                  </label>
                  <input
                    type="text"
                    value={adminChatMessage}
                    onChange={(e) => setAdminChatMessage(e.target.value)}
                    placeholder="Type a response..."
                    className="input-field"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" disabled={isAdminUploading} className="btn-premium" style={{ height: '44px' }}>
                    <Send size={18} />
                  </button>
                </form>
                {adminChatImage && (
                  <div style={{ fontSize: '0.8rem', marginTop: '10px', color: 'var(--accent-secondary)' }}>
                    Image selected: {adminChatImage.name} <button onClick={() => setAdminChatImage(null)} style={{ border: 'none', background: 'none', color: 'red', cursor: 'pointer' }}>Remove</button>
                  </div>
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                <p>Select a conversation to start chatting</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Product Modal – mobile optimised */}
      <style>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.55); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 2000; padding: 12px;
        }
        .modal-card {
          width: 100%; max-width: 700px; max-height: 92vh;
          overflow-y: auto; padding: 36px 32px;
          position: relative; border-radius: 24px;
        }
        .form-title {
          font-size: 1.8rem; margin-bottom: 28px; padding-right: 36px;
        }
        .form-row-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .offer-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: rgba(74,103,65,0.05);
          border-radius: 16px;
          border: 1px solid var(--glass-border);
        }
        .image-upload-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-bottom: 16px;
        }
        .form-label {
          display: block; margin-bottom: 8px; font-weight: 500; font-size: 0.92rem;
        }
        .modal-input { font-size: 1rem; padding: 12px 14px; }
        @media (max-width: 520px) {
          .modal-overlay { padding: 0; align-items: flex-end; }
          .modal-card {
            max-height: 96vh; border-bottom-left-radius: 0;
            border-bottom-right-radius: 0; padding: 24px 16px 32px;
          }
          .form-title { font-size: 1.4rem; margin-bottom: 20px; }
          .form-row-2 { grid-template-columns: 1fr; gap: 12px; margin-bottom: 16px; }
          .offer-grid { grid-template-columns: 1fr; gap: 12px; padding: 14px; }
          .image-upload-grid { grid-template-columns: repeat(4, 1fr); gap: 8px; }
          .modal-input { font-size: 16px; } /* prevent iOS zoom */
        }
        .inventory-row:hover {
          background: rgba(137, 207, 240, 0.05) !important;
        }
        .action-btn-edit:hover {
          background: #3b82f6 !important;
          color: white !important;
          transform: translateY(-2px);
        }
        .action-btn-delete:hover {
          background: #ef4444 !important;
          color: white !important;
          transform: translateY(-2px);
        }

        /* SEO Section - Mobile Responsive */
        .seo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 16px;
        }
        .seo-title { font-size: 1.8rem; display: flex; align-items: center; gap: 12px; letter-spacing: -0.5px; }
        .seo-badges-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.05);
          padding: 12px 24px;
          border-radius: 16px;
          border: 1px solid var(--glass-border);
          flex-wrap: wrap;
        }
        .seo-engines {
          display: flex;
          gap: 24px;
          margin-right: 16px;
          border-right: 1px solid var(--glass-border);
          padding-right: 16px;
          flex-wrap: wrap;
        }
        .seo-engine-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .seo-engine-label {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .seo-status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .seo-cards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
          gap: 24px;
        }
        .seo-card {
          background: rgba(255,255,255,0.02);
          padding: 24px;
          border-radius: 24px;
          border: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .seo-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .seo-actions-row {
          margin-top: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 20px;
        }
        .seo-history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .seo-history-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }
        .seo-history-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
          gap: 20px;
        }

        @media (max-width: 600px) {
          .seo-title { font-size: 1.3rem; gap: 8px; }
          .seo-badges-bar {
            flex-direction: column;
            align-items: flex-start;
            padding: 14px 16px;
            gap: 12px;
            width: 100%;
          }
          .seo-engines {
            gap: 12px;
            margin-right: 0;
            border-right: none;
            padding-right: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--glass-border);
            width: 100%;
            flex-wrap: wrap;
          }
          .seo-cards-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .seo-card {
            padding: 18px;
            border-radius: 18px;
          }
          .seo-actions-row {
            flex-direction: column;
            gap: 12px;
          }
          .seo-actions-row > button,
          .seo-actions-row > .btn-premium,
          .seo-actions-row > .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .seo-history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .seo-history-actions {
            width: 100%;
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          .seo-history-grid {
            grid-template-columns: 1fr;
            gap: 14px;
          }
        }
      `}</style>

      {showAddForm && (
        <div className="modal-overlay">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="glass modal-card"
          >
            <button
              onClick={closeForm}
              style={{ position: 'absolute', top: '18px', right: '18px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'inherit' }}
            >
              <X size={18} />
            </button>

            <h3 className="brand-font form-title">
              {editingId ? 'Edit Creation' : 'Add New Creation'}
            </h3>

            <form onSubmit={handleAddProduct}>
              {/* Name + Price */}
              <div className="form-row-2">
                <div>
                  <label className="form-label">Product Name</label>
                  <input
                    type="text" className="input-field modal-input"
                    placeholder="e.g. Sunny the Dino" required
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Price (Rs.)</label>
                  <input
                    type="number" className="input-field modal-input"
                    placeholder="0.00" step="0.01" required
                    value={newProduct.price}
                    onChange={e => setNewProduct({ ...newProduct, price: e.target.value })}
                  />
                </div>
              </div>

              {/* Category */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Category</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="input-field modal-input"
                    placeholder="Type or select a category (e.g. Dolls, Animals...)"
                    list="category-suggestions"
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                  />
                  <datalist id="category-suggestions">
                    {Array.from(new Set(products.map(p => p.category).filter(Boolean))).map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Special Offer */}
              <div className="offer-grid">
                <div style={{ gridColumn: '1 / -1', marginBottom: '4px' }}>
                  <h4 style={{ color: 'var(--accent-primary)', fontSize: '0.95rem', fontWeight: '600' }}>🏷️ Special Offer (Optional)</h4>
                </div>
                <div>
                  <label className="form-label">Offer Price (Rs.)</label>
                  <input
                    type="number" className="input-field modal-input"
                    placeholder="Discounted price" step="0.01"
                    value={newProduct.offerPrice}
                    onChange={e => setNewProduct({ ...newProduct, offerPrice: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Offer Valid Until</label>
                  <input
                    type="datetime-local" className="input-field modal-input"
                    value={newProduct.offerExpiry}
                    onChange={e => setNewProduct({ ...newProduct, offerExpiry: e.target.value })}
                  />
                </div>
                <div>
                  <label className="form-label">Discount Percentage (%)</label>
                  <input
                    type="number" className="input-field modal-input"
                    placeholder="e.g. 20" min="0" max="100"
                    value={newProduct.discountPercentage}
                    onChange={e => setNewProduct({ ...newProduct, discountPercentage: e.target.value })}
                  />
                </div>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label">Description</label>
                <textarea
                  className="input-field modal-input"
                  style={{ minHeight: '110px', resize: 'vertical', width: '100%' }}
                  placeholder="Tell the story of this creation..." required
                  value={newProduct.description}
                  onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </div>

              {/* Images */}
              <div style={{ marginBottom: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Images (Up to 10)</label>
                  <button
                    type="button"
                    onClick={() => setNewProduct(prev => ({ ...prev, images: [...prev.images, 'https://images.unsplash.com/photo-1554460300-9142998a48c0?auto=format&fit=crop&q=80&w=400'] }))}
                    style={{ fontSize: '0.78rem', background: 'var(--accent-primary)', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', whiteSpace: 'nowrap' }}
                  >
                    Use Sample Image
                  </button>
                </div>
                <div className="image-upload-grid">
                  {newProduct.images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', aspectRatio: '1/1' }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                      <button
                        type="button" onClick={() => removeImage(i)}
                        style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '22px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  {newProduct.images.length < 10 && (
                    <label style={{
                      aspectRatio: '1/1', border: '2px dashed var(--glass-border)', borderRadius: '10px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: 'var(--text-secondary)'
                    }} className="upload-btn">
                      <ImageIcon size={22} />
                      <span style={{ fontSize: '0.68rem', marginTop: '4px' }}>Upload</span>
                      <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </label>
                  )}
                </div>
              </div>

              <button type="submit" className="btn-premium" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}>
                {editingId ? '✏️ Update Product' : '🚀 Publish Product'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* SEO Section */}
      <div className="glass" style={{ padding: '32px', marginTop: '32px', marginBottom: '60px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
          <div className="seo-header-row">
            <div>
              <h3 className="seo-title">
                <Globe color="var(--accent-primary)" size={28} /> Search Engine Intelligence
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '4px', fontSize: '1rem' }}>Global Indexing & Metadata Architecture</p>
            </div>

            <div className="seo-badges-bar">
              <div className="seo-engines">
                <div className="seo-engine-item" title="Google Search Optimized">
                  <Search size={16} color="#4285F4" />
                  <span className="seo-engine-label">Google</span>
                </div>
                <div className="seo-engine-item" title="Bing Search Optimized">
                  <Globe size={16} color="#008373" />
                  <span className="seo-engine-label">Bing</span>
                </div>
                <div className="seo-engine-item" title="Yahoo Optimized">
                  <Sparkles size={16} color="#6001d2" />
                  <span className="seo-engine-label">Yahoo</span>
                </div>
                <div className="seo-engine-item" title="DuckDuckGo Ready">
                  <Target size={16} color="#de5833" />
                  <span className="seo-engine-label">DDG</span>
                </div>
              </div>
              <div className="seo-status-indicator">
                <div className="pulse-circle live-green" style={{ width: '10px', height: '10px' }}>
                  <div className="pulse-glow live-green" style={{ width: '100%', height: '100%' }} />
                </div>
                <span className="label-caps" style={{ color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: '900' }}>SYSTEM_ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="seo-cards-grid">
          {/* Keywords Card */}
          <div className="seo-card">
            <div className="seo-card-header">
              <label className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-primary)' }}>
                <Target size={18} /> Global Target Keywords
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                COMMA_SEPARATED
              </div>
            </div>

            <textarea
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              className="input-field"
              placeholder="crochet toys, handmade gifts, amigurumi, baby toys..."
              style={{ height: '120px', resize: 'none', padding: '20px', lineHeight: '1.6', fontSize: '1.1rem', background: 'rgba(0,0,0,0.1)' }}
            />

          </div>

          {/* Description Card */}
          <div className="seo-card">
            <div className="seo-card-header">
              <label className="label-caps" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-secondary)' }}>
                <Activity size={18} /> Search Engine Description
              </label>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '8px' }}>
                MAX_160_CHARS
              </div>
            </div>

            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              className="input-field"
              placeholder="Cham Creations offers high-quality, adorable handmade crochet toys and custom amigurumi creations..."
              style={{ height: '180px', resize: 'none', padding: '20px', lineHeight: '1.7', fontSize: '1.1rem', background: 'rgba(0,0,0,0.1)' }}
            />

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle size={14} color="#4ade80" />
              <span>Snippet optimization active for all major crawlers.</span>
            </div>
          </div>
        </div>


        <div className="seo-actions-row">
          <button
            onClick={() => setShowSeoHistory(!showSeoHistory)}
            className="btn-secondary"
            style={{ fontSize: '0.875rem', padding: '10px 20px', gap: '8px' }}
          >
            <Clock size={16} /> {showSeoHistory ? 'Hide History' : 'View Saved History'}
          </button>

          <button
            onClick={saveSeoSettings}
            disabled={savingSeo || (!seoKeywords.trim() && !seoDescription.trim())}
            className="btn-premium"
            style={{ padding: '0 40px', height: '54px' }}
          >
            {savingSeo ? <RefreshCw size={20} className="spin" /> : 'Save SEO Settings'}
          </button>
        </div>

        {showSeoHistory && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: '24px', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid var(--glass-border)' }}
          >
            <div className="seo-history-header">
              <h4 className="label-caps" style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock size={18} /> Archive of Deployed SEO Profiles
              </h4>
              <div className="seo-history-actions">
                {seoHistory.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                    {showClearConfirm ? (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '6px 16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', flexWrap: 'wrap' }}
                      >
                        <span style={{ fontSize: '0.8rem', fontWeight: '700', color: '#ef4444' }}>Clear entire archive?</span>
                        <button onClick={clearSeoHistory} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '800' }}>Confirm</button>
                        <button onClick={() => setShowClearConfirm(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700' }}>Cancel</button>
                      </motion.div>
                    ) : (
                      <button
                        onClick={() => setShowClearConfirm(true)}
                        style={{ background: 'none', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '6px 16px', borderRadius: '12px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
                      >
                        <Trash2 size={14} /> Clear All History
                      </button>
                    )}
                  </div>
                )}
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: '100px', fontWeight: '700', letterSpacing: '1px', textAlign: 'center' }}>
                  {seoHistory.length} SNAPSHOTS STORED
                </span>
              </div>
            </div>
            {seoHistory.length === 0 ? (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '40px' }}>No metadata history detected in secure archive.</p>
            ) : (
              <div className="seo-history-grid">
                {seoHistory.map((h, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ y: -5 }}
                    style={{
                      padding: '24px',
                      background: 'rgba(0,0,0,0.2)',
                      borderRadius: '24px',
                      border: '1px solid var(--glass-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '16px',
                      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                          <div style={{ width: '8px', height: '8px', background: 'var(--accent-primary)', borderRadius: '50%' }} />
                          <p className="label-caps" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', opacity: 0.8 }}>
                            DEPLOYED {new Date(h.date).toLocaleDateString()} at {new Date(h.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>

                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#89cff0', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Keywords</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                            {h.keywords || '(Empty)'}
                          </p>

                          <div style={{ margin: '12px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }} />

                          <p style={{ fontSize: '0.8rem', fontWeight: '800', color: '#f49fb6', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>Description</p>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.5' }}>
                            {h.description || '(Empty)'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                      <button
                        onClick={() => {
                          setSeoKeywords(h.keywords)
                          setSeoDescription(h.description)
                        }}
                        className="btn-premium"
                        style={{ flex: 1, padding: '10px', fontSize: '0.85rem', height: '42px' }}
                      >
                        Redeploy Profile
                      </button>
                      <button
                        onClick={() => {
                          const newHistory = seoHistory.filter((_, idx) => idx !== i)
                          setSeoHistory(newHistory)
                          localStorage.setItem('seo_history', JSON.stringify(newHistory))
                        }}
                        style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', padding: '0 12px', borderRadius: '12px', cursor: 'pointer' }}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}


export default Dashboard
