import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, MessageCircle, Send, Image as ImageIcon, ShoppingCart, Share2, Sparkles } from 'lucide-react'

import { fetchProducts, createMessage } from '../../api'
import type { Product } from '../../api'
import SplashScreen from '../../components/SplashScreen'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../supabase'

const Market = () => {
  const { user } = useAuth()
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splash_shown')
  })
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [customRequest, setCustomRequest] = useState({
    name: '',
    email: '',
    phone: '',
    comment: ''
  })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await fetchProducts()
        setProducts(data)
      } catch (err) {
        console.error('Failed to fetch products:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  const [activeCategory] = useState('All Items')

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All Items' || product.category === activeCategory;
    return matchesSearch && matchesCategory;
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'date-desc') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }
    if (sortBy === 'price-asc') {
      const priceA = parseFloat(a.offerPrice || a.price)
      const priceB = parseFloat(b.offerPrice || b.price)
      return priceA - priceB
    }
    if (sortBy === 'price-desc') {
      const priceA = parseFloat(a.offerPrice || a.price)
      const priceB = parseFloat(b.offerPrice || b.price)
      return priceB - priceA
    }
    if (sortBy === 'name-asc') {
      return a.name.localeCompare(b.name)
    }
    return 0
  })

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customRequest.name || (!customRequest.email && !customRequest.phone) || !customRequest.comment) {
      return alert("Please fill name, at least one contact method, and your comment!")
    }

    setSending(true)
    try {
      await createMessage(customRequest)
      setSent(true)
      setCustomRequest({ name: '', email: '', phone: '', comment: '' })
      setTimeout(() => setSent(false), 5000)
    } catch (err: any) {
      alert("Failed to send request: " + err.message)
    } finally {
      setSending(false)
    }
  }

  const handleCustomWhatsapp = () => {
    if (!customRequest.comment.trim()) return alert("Please describe your custom toy first!")
    const phoneNumber = "94771234567" // Placeholder number
    const message = `Hello Cham Creations! I would like to request a custom toy:\n\nName: ${customRequest.name}\nEmail: ${customRequest.email}\nPhone: ${customRequest.phone}\nDetails: ${customRequest.comment}`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [selectedChatImage, setSelectedChatImage] = useState<File | null>(null)

  useEffect(() => {
    if (isChatOpen && user) {
      fetchChatHistory()
      
      const subscription = supabase
        .channel('chat_messages')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages' }, (payload) => {
          if (payload.new.sender_id === user.id || payload.new.receiver_id === user.id) {
            setChatHistory(prev => [...prev, payload.new])
          }
        })
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [isChatOpen, user])

  const fetchChatHistory = async () => {
    if (!user) return
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order('created_at', { ascending: true })

    if (data) setChatHistory(data)
  }

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || (!chatMessage.trim() && !selectedChatImage)) return

    let imageUrl = ''
    if (selectedChatImage) {
      setIsUploading(true)
      const fileExt = selectedChatImage.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, selectedChatImage)

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('chat-images').getPublicUrl(fileName)
        imageUrl = publicUrl
      }
      setIsUploading(false)
    }

    const { error } = await supabase
      .from('chat_messages')
      .insert([{
        sender_id: user.id,
        content: chatMessage,
        image_url: imageUrl,
        is_admin_message: false
      }])

    if (!error) {
      setChatMessage('')
      setSelectedChatImage(null)
    }
  }

  const handleSplashComplete = () => {
    setShowSplash(false)
    sessionStorage.setItem('splash_shown', 'true')
  }

  return (
    <div className="market-page">
      <AnimatePresence>
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      </AnimatePresence>

      {/* Chat Widget */}
      {user && (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
          <AnimatePresence>
            {isChatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                className="glass"
                style={{
                  width: '350px',
                  height: '500px',
                  marginBottom: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  border: '1px solid var(--accent-primary)'
                }}
              >
                <div style={{ padding: '20px', background: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MessageCircle size={20} />
                    <span style={{ fontWeight: 700 }}>Chat with us</span>
                  </div>
                  <button onClick={() => setIsChatOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                    <X size={20} />
                  </button>
                </div>
                
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} style={{
                      alignSelf: msg.sender_id === user.id ? 'flex-end' : 'flex-start',
                      background: msg.sender_id === user.id ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: msg.sender_id === user.id ? 'white' : 'var(--text-primary)',
                      padding: '10px 14px',
                      borderRadius: '18px',
                      borderBottomRightRadius: msg.sender_id === user.id ? '4px' : '18px',
                      borderBottomLeftRadius: msg.sender_id !== user.id ? '4px' : '18px',
                      maxWidth: '80%',
                      boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                      fontSize: '0.9rem'
                    }}>
                      {msg.image_url && (
                        <img src={msg.image_url} alt="Shared" style={{ width: '100%', borderRadius: '12px', marginBottom: '8px' }} />
                      )}
                      {msg.content}
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChatMessage} style={{ padding: '15px', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '10px', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                  <label style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <ImageIcon size={20} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ display: 'none' }} 
                      onChange={(e) => setSelectedChatImage(e.target.files?.[0] || null)}
                    />
                  </label>
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="input-field"
                    style={{ height: '40px', padding: '0 15px' }}
                  />
                  <button type="submit" disabled={isUploading} style={{ background: 'var(--accent-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                    <Send size={18} />
                  </button>
                </form>
                {selectedChatImage && (
                  <div style={{ padding: '5px 15px', background: 'var(--bg-primary)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Photo attached: {selectedChatImage.name}</span>
                    <button onClick={() => setSelectedChatImage(null)} style={{ border: 'none', background: 'none', color: 'red', fontSize: '0.75rem' }}>Remove</button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsChatOpen(!isChatOpen)}
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              color: 'white',
              border: 'none',
              boxShadow: '0 10px 30px rgba(162, 210, 255, 0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isChatOpen ? <X size={28} /> : <MessageCircle size={28} />}
          </motion.button>
        </div>
      )}

      {/* Filters & Results Count */}
      {!loading && products.length > 0 && (
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '40px',
          flexWrap: 'wrap',
          gap: '20px',
          padding: '20px',
          background: 'var(--glass-bg)',
          borderRadius: '20px',
          border: '1px solid var(--glass-border)'
        }}>
          <div>
            <p style={{ color: 'var(--text-primary)', fontWeight: '700', fontSize: '1.1rem' }}>
              Collection <span style={{ color: 'var(--accent-primary)', fontWeight: '400' }}>({sortedProducts.length})</span>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: '600' }}>Sort by:</span>
              <select
                className="input-field"
                style={{
                  width: 'auto',
                  padding: '10px 40px 10px 20px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  backgroundImage: 'url("data:image/svg+xml;utf8,<svg fill=\'none\' stroke=\'%23888\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' viewBox=\'0 0 24 24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'m6 9 6 6 6-6\'/></svg>")',
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                  backgroundSize: '16px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  fontWeight: '600',
                  border: '1px solid var(--glass-border)',
                  fontSize: '0.9rem'
                }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date-desc">Latest Additions</option>
                <option value="price-asc">Price: Lowest first</option>
                <option value="price-desc">Price: Highest first</option>
                <option value="name-asc">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading Marketplace...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '100px' }}>
          {products.length === 0 ? (
            <>
              <ShoppingCart size={64} style={{ marginBottom: '24px', opacity: 0.2 }} />
              <h3>No products in the market yet.</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Come back later!</p>
            </>
          ) : (
            <>
              <Search size={64} style={{ marginBottom: '24px', opacity: 0.2 }} />
              <h3>No results found for "{searchTerm}"</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Try searching for something else.</p>
              <button onClick={() => setSearchTerm('')} className="btn-secondary" style={{ marginTop: '24px' }}>Clear Search</button>
            </>
          )}
        </div>
      ) : (
        <div className="market-grid">
          {sortedProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Custom Toy Request Section */}
      <div className="glass" style={{ padding: '40px', textAlign: 'center', background: 'var(--glass-bg)', border: '2px dashed var(--accent-primary)' }}>
        <h2 className="brand-font" style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Create a custom toy for me? ✨</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
          Have a specific plushie in mind? Describe your dream crochet toy below, and we'll bring it to life!
        </p>

        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <form onSubmit={handleCustomSubmit} style={{ display: 'grid', gap: '20px', textAlign: 'left' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>Full Name</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Your Name"
                  required
                  style={{ borderRadius: '12px', height: '60px', fontSize: '1.1rem', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  value={customRequest.name}
                  onChange={(e) => setCustomRequest({ ...customRequest, name: e.target.value })}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  className="input-field"
                  placeholder="email@example.com"
                  style={{
                    borderRadius: '12px',
                    height: '60px',
                    fontSize: '1.1rem',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)'
                  }}
                  value={customRequest.email}
                  onChange={(e) => setCustomRequest({ ...customRequest, email: e.target.value })}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+94 77..."
                  style={{
                    borderRadius: '12px',
                    height: '60px',
                    fontSize: '1.1rem',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--glass-border)'
                  }}
                  value={customRequest.phone}
                  onChange={(e) => setCustomRequest({ ...customRequest, phone: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '0.9rem' }}>
                Describe your dream toy
              </label>
              <textarea
                className="input-field"
                placeholder="E.g., I want a pink bunny with a tiny blue bowtie..."
                style={{
                  minHeight: '150px',
                  resize: 'vertical',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  padding: '20px',
                  border: '1px solid var(--glass-border)'
                }}
                value={customRequest.comment}
                onChange={(e) => setCustomRequest({ ...customRequest, comment: e.target.value })}
                required
              ></textarea>
            </div>

            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={sending}
                className="btn-premium"
                style={{ padding: '18px 40px', fontSize: '1.1rem', gap: '10px' }}
              >
                {sending ? 'Sending...' : sent ? '✅ Request Sent!' : <><Send size={20} /> Submit Request</>}
              </button>
            </div>
          </form>

          <div style={{ marginTop: '40px', borderTop: '1px solid var(--glass-border)', paddingTop: '30px' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Or reach out via other platforms:</p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleCustomWhatsapp} className="btn-secondary" style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
                <MessageCircle size={16} /> WhatsApp
              </button>
              <a href="https://www.ebay.com/usr/cham.creations" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', textDecoration: 'none', fontSize: '0.875rem' }}>
                <ShoppingCart size={16} /> Ebay
              </a>
              <a href="https://www.instagram.com/cham.creations.shop" target="_blank" rel="noopener noreferrer" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', textDecoration: 'none', fontSize: '0.875rem' }}>
                <Share2 size={16} /> Instagram
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const ProductCard = ({ product }: { product: Product }) => {
  const [currentImg, setCurrentImg] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!product.offerExpiry) return
    const timer = setInterval(() => {
      const expiry = new Date(product.offerExpiry!).getTime()
      const now = new Date().getTime()
      const distance = expiry - now
      if (distance < 0) {
        setTimeLeft('Expired')
        clearInterval(timer)
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${days}d ${hours}h ${minutes}m`)
      }
    }, 1000)
    return () => clearInterval(timer)
  }, [product.offerExpiry])

  const hasOffer = (product.offerPrice || product.discountPercentage) && (!product.offerExpiry || new Date(product.offerExpiry) > new Date())

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      whileHover={{ y: -20, transition: { duration: 0.5, ease: "easeInOut" } }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRadius: '28px',
        background: isHovered ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(16px)',
        border: isHovered ? '1px solid var(--accent-primary)' : '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: isHovered
          ? `0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 20px ${hasOffer ? 'rgba(255, 105, 180, 0.2)' : 'rgba(137, 207, 240, 0.2)'}`
          : '0 10px 30px -10px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        overflow: 'hidden',
        zIndex: isHovered ? 10 : 1
      }}
    >
      {/* Visual Glow Effect */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `radial-gradient(circle at center, ${hasOffer ? 'rgba(255,105,180,0.05)' : 'rgba(137,207,240,0.05)'} 0%, transparent 50%)`,
        opacity: isHovered ? 1 : 0,
        transition: '0.6s',
        pointerEvents: 'none'
      }} />

      {/* Image / Carousel Section */}
      <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}>
        <Link to={`/product/${product._id}`} style={{ display: 'block', height: '100%' }}>
          <motion.div
            style={{
              display: 'flex',
              height: '100%',
              transform: `translateX(-${currentImg * 100}%)`,
              transition: 'transform 0.6s cubic-bezier(0.645, 0.045, 0.355, 1)'
            }}
          >
            {product.images.map((img: string, i: number) => (
              <div key={i} style={{ minWidth: '100%', height: '100%', position: 'relative' }}>
                <img
                  src={img}
                  alt=""
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    filter: isHovered ? 'brightness(1.05)' : 'none',
                    transition: '0.4s'
                  }}
                />
                {/* Soft Gradient Overlay */}
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: '100%',
                  height: '40%',
                  background: 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)',
                  opacity: isHovered ? 1 : 0,
                  transition: '0.4s'
                }} />
              </div>
            ))}
          </motion.div>
        </Link>

        {/* Floating Badges */}
        <div style={{ position: 'absolute', top: '20px', left: '20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 5 }}>
          {hasOffer && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                style={{
                  background: 'linear-gradient(135deg, #FF69B4 0%, #FF1493 100%)',
                  color: 'white', padding: '6px 16px', borderRadius: '100px',
                  fontSize: '0.875rem', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 4px 15px rgba(255, 20, 147, 0.4)',
                  letterSpacing: '0.05em'
                }}
              >
                <Sparkles size={12} /> SALE
              </motion.div>
              {product.discountPercentage && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  style={{
                    background: 'var(--bg-primary)',
                    color: 'var(--accent-secondary)', padding: '4px 12px', borderRadius: '100px',
                    fontSize: '0.8rem', fontWeight: '900', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    border: '1px solid var(--accent-secondary)',
                    letterSpacing: '0.05em'
                  }}
                >
                  {product.discountPercentage}% OFF
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Carousel Indicators */}
        {product.images.length > 1 && isHovered && (
          <div style={{ position: 'absolute', bottom: '16px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px', zIndex: 5 }}>
            {product.images.map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.preventDefault(); setCurrentImg(i); }}
                style={{
                  width: i === currentImg ? '24px' : '8px',
                  height: '4px',
                  borderRadius: '10px',
                  background: i === currentImg ? 'white' : 'rgba(255,255,255,0.4)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  cursor: 'pointer'
                }}
              />
            ))}
          </div>
        )}

        {/* Floating Price Pill */}
        <div style={{
          position: 'absolute', bottom: '20px', right: '20px',
          background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(12px)',
          padding: '10px 20px', borderRadius: '18px', border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 12px 30px rgba(0,0,0,0.15)', zIndex: 5,
          color: '#1a1a1a',
          transition: '0.3s',
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}>
          {(() => {
            const discountPct = product.discountPercentage ? parseFloat(product.discountPercentage) : 0;
            const originalPrice = parseFloat(product.price);
            const calculatedPrice = product.offerPrice
              ? product.offerPrice
              : (discountPct > 0 ? Math.round(originalPrice * (1 - discountPct / 100)) : null);

            if (hasOffer && calculatedPrice) {
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {discountPct > 0 && (
                    <div style={{
                      background: 'var(--accent-secondary)',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: '900',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      boxShadow: '0 4px 10px rgba(255, 20, 147, 0.2)'
                    }}>
                      -{discountPct}%
                    </div>
                  )}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.875rem', textDecoration: 'line-through', opacity: 0.4, marginBottom: '-2px', letterSpacing: '0.02em' }}>Rs. {product.price}</div>
                    <div style={{ fontWeight: '900', fontSize: '1.2rem', color: '#FF1493', letterSpacing: '-0.02em' }}>Rs. {calculatedPrice}</div>
                  </div>
                </div>
              );
            }
            return (
              <div style={{ fontWeight: '900', fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Rs. {product.price}</div>
            );
          })()}
        </div>
      </div>

      {/* Card Details Section */}
      <div style={{ padding: '28px', flexGrow: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          {product.category && product.category !== 'Uncategorized' && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'linear-gradient(135deg, rgba(137, 207, 240, 0.12) 0%, rgba(255, 105, 180, 0.08) 100%)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(137, 207, 240, 0.2)',
              padding: '5px 14px',
              borderRadius: '100px',
              marginBottom: '10px',
              transition: 'all 0.3s ease'
            }}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--accent-primary)',
                boxShadow: '0 0 6px rgba(137, 207, 240, 0.5)'
              }} />
              <span style={{
                fontSize: '0.7rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--accent-primary)'
              }}>
                {product.category}
              </span>
            </div>
          )}
          <h3 className="brand-font" style={{
            fontSize: '1.6rem',
            marginBottom: '8px',
            color: isHovered ? 'var(--accent-primary)' : 'inherit',
            transition: '0.3s',
            letterSpacing: '0.02em'
          }}>
            {product.name}
          </h3>
          <p style={{
            fontSize: '0.9rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.7',
            letterSpacing: '0.01em',
            display: '-webkit-box',
            WebkitLineClamp: '2',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.description}
          </p>
        </div>

        {timeLeft && timeLeft !== 'Expired' && hasOffer && (
          <div style={{
            marginTop: 'auto',
            background: 'rgba(255, 20, 147, 0.05)',
            padding: '12px 16px',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px solid rgba(255, 20, 147, 0.1)',
            transition: '0.3s'
          }}>
            <span style={{ fontSize: '0.875rem', fontWeight: '700', color: '#FF1493', letterSpacing: '0.05em' }}>FLASH SALE:</span>
            <span style={{ fontSize: '0.875rem', fontWeight: '800', color: '#FF1493', fontFamily: 'monospace' }}>{timeLeft}</span>
          </div>
        )}

        <div style={{
          marginTop: (timeLeft && timeLeft !== 'Expired' && hasOffer) ? '4px' : 'auto',
          display: 'flex',
          gap: '12px'
        }}>
          <Link
            to={`/product/${product._id}`}
            style={{
              flex: 1,
              textDecoration: 'none',
              background: 'var(--accent-primary)',
              color: 'var(--accent-contrast)',
              height: '52px',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.95rem',
              fontWeight: '700',
              letterSpacing: '0.03em',
              boxShadow: isHovered ? '0 12px 24px rgba(137, 207, 240, 0.3)' : 'none',
              transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            Explore Now
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              navigator.clipboard.writeText(window.location.origin + `/product/${product._id}`)
              alert('Magic link copied! 🎀')
            }}
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'inherit',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: '0.3s',
              transform: isHovered ? 'rotate(5deg)' : 'none'
            }}
          >
            <Share2 size={20} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default Market
