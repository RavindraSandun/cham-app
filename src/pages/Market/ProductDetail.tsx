import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, ArrowLeft, MessageCircle, Mail, Sparkles } from 'lucide-react'

import { fetchProductById } from '../../api'
import type { Product } from '../../api'

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImg, setCurrentImg] = useState(0)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!product || !product.offerExpiry) return

    const timer = setInterval(() => {
      const expiryStr = product.offerExpiry
      if (!expiryStr) return
      
      const expiry = new Date(expiryStr).getTime()
      const now = new Date().getTime()
      const distance = expiry - now

      if (distance < 0) {
        setTimeLeft('Expired')
        clearInterval(timer)
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24))
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((distance % (1000 * 60)) / 1000)
        setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [product])

  useEffect(() => {
    if (!id) return
    const loadProduct = async () => {
      try {
        const data = await fetchProductById(id)
        setProduct(data)
      } catch (err) {
        console.error('Failed to fetch product:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProduct()
  }, [id])

  if (loading) return (
    <div style={{ padding: '150px', textAlign: 'center' }}>
      <div className="spinner" style={{ border: '4px solid rgba(0,0,0,0.1)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
      <p style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>Loading details...</p>
    </div>
  )

  if (!product) return (
    <div style={{ padding: '150px', textAlign: 'center' }}>
      <h2>Product not found</h2>
      <button onClick={() => navigate('/market')} className="btn-secondary" style={{ marginTop: '20px' }}>Back to Market</button>
    </div>
  )

  const hasOffer = (product.offerPrice || product.discountPercentage) && (!product.offerExpiry || new Date(product.offerExpiry) > new Date())

  const handleBuyWhatsapp = () => {
    const phoneNumber = "94771234567" // Placeholder number
    const finalPrice = hasOffer ? product.offerPrice : product.price
    const message = `Hello Cham Creations! I'm interested in buying:\n\nProduct: ${product.name}\nPrice: Rs. ${finalPrice}\n\nCan you please provide more details?`
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleBuyEmail = () => {
    if (!product) return
    const emailAddress = "contact@chamcreations.com" // Placeholder email
    const finalPrice = hasOffer ? product.offerPrice : product.price
    const subject = `Product Inquiry: ${product.name}`
    const body = `Hello Cham Creations,\n\nI am interested in purchasing the following item:\n\nProduct: ${product.name}\nPrice: Rs. ${finalPrice}\n\nPlease let me know how to proceed with the order.\n\nThank you.`
    const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(mailtoUrl, '_blank')
  }

  return (
    <div className="product-detail-page">
      <style>{`
        .product-detail-page {
          padding: 100px 5% 60px;
          min-height: 100vh;
        }
        .product-detail-layout {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 60px;
          align-items: start;
          max-width: 1200px;
          margin: 0 auto;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 100px;
          color: var(--text-primary);
          text-decoration: none;
          font-weight: 600;
          font-size: 0.9rem;
          margin-bottom: 40px;
          transition: var(--transition-smooth);
          cursor: pointer;
        }
        .back-btn:hover {
          background: rgba(255,255,255,0.1);
          transform: translateX(-5px);
        }
        .info-panel {
          padding: 40px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 32px;
          position: sticky;
          top: 120px;
          box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
        }
        .gallery-container {
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          background: var(--bg-secondary);
          box-shadow: var(--shadow-premium);
        }
        .cta-group {
          display: grid;
          gap: 16px;
          margin-top: 32px;
        }
        .cta-primary {
          background: var(--accent-primary);
          color: var(--accent-contrast);
          height: 64px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          border: none;
          cursor: pointer;
          transition: var(--transition-smooth);
          box-shadow: 0 10px 30px rgba(137, 207, 240, 0.3);
        }
        .cta-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(137, 207, 240, 0.4);
        }
        .cta-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          height: 64px;
          border-radius: 18px;
          font-size: 1.1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          cursor: pointer;
          transition: var(--transition-smooth);
        }
        .cta-secondary:hover {
          background: rgba(137, 207, 240, 0.1);
          transform: translateY(-3px);
        }
        @media (max-width: 1024px) {
          .product-detail-layout {
            grid-template-columns: 1fr;
            gap: 40px;
          }
          .info-panel {
            position: relative;
            top: 0;
            padding: 30px;
          }
        }
        @media (max-width: 600px) {
          .product-detail-page {
            padding: 60px 5% 40px;
          }
          .info-panel {
            padding: 24px;
            border-radius: 24px;
          }
        }
      `}</style>

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <button onClick={() => navigate(-1)} className="back-btn">
          <ArrowLeft size={18} /> Back to Gallery
        </button>
      </div>

      <div className="product-detail-layout">
        {/* Visual Gallery Showcase */}
        <div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="gallery-container"
          >
            <div className="carousel-track" style={{ transform: `translateX(-${currentImg * 100}%)`, height: '100%', aspectRatio: '1/1' }}>
              {product.images && product.images.length > 0 ? (
                product.images.map((img: string, i: number) => (
                  <img key={i} src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ))
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>No Image Available</div>
              )}
            </div>
            
            {product.images && product.images.length > 1 && (
              <div className="carousel-nav" style={{ padding: '0 20px' }}>
                <button className="carousel-btn" style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.9)', color: '#000' }} onClick={() => setCurrentImg((currentImg - 1 + product.images.length) % product.images.length)}>
                  <ChevronLeft size={28} />
                </button>
                <button className="carousel-btn" style={{ width: '56px', height: '56px', background: 'rgba(255,255,255,0.9)', color: '#000' }} onClick={() => setCurrentImg((currentImg + 1) % product.images.length)}>
                  <ChevronRight size={28} />
                </button>
              </div>
            )}
          </motion.div>
          
          {/* Enhanced Thumbnail Navigation */}
          <div style={{ display: 'flex', gap: '16px', marginTop: '24px', overflowX: 'auto', padding: '10px 4px', scrollbarWidth: 'none' }}>
            {product.images && product.images.map((img: string, i: number) => (
              <motion.img 
                key={i} 
                src={img} 
                alt="" 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentImg(i)}
                style={{ 
                  width: '100px', height: '100px', borderRadius: '16px', objectFit: 'cover', cursor: 'pointer',
                  border: currentImg === i ? '4px solid var(--accent-primary)' : '2px solid transparent',
                  boxShadow: currentImg === i ? '0 10px 20px rgba(137, 207, 240, 0.3)' : 'none',
                  transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }} 
              />
            ))}
          </div>
        </div>

        {/* Cinematic Information Panel */}
        <motion.div 
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="info-panel"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <span className="label-caps" style={{ 
              background: 'rgba(255, 105, 180, 0.1)', color: 'var(--accent-secondary)', 
              padding: '8px 18px', borderRadius: '100px', border: '1px solid rgba(255, 105, 180, 0.2)'
            }}>
              ✨ Unique Creation
            </span>
            {product.category && product.category !== 'Uncategorized' && (
              <span className="label-caps" style={{ 
                background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', 
                padding: '8px 18px', borderRadius: '100px'
              }}>
                {product.category}
              </span>
            )}
          </div>

          <h1 className="brand-font" style={{ fontSize: '3rem', margin: '0 0 20px', lineHeight: '1.1', letterSpacing: '-0.02em' }}>
            {product.name}
          </h1>
          
          <div style={{ marginBottom: '32px' }}>
            {(() => {
              const discountPct = product.discountPercentage ? parseFloat(product.discountPercentage) : 0;
              const originalPrice = parseFloat(product.price);
              const displayPrice = product.offerPrice 
                ? product.offerPrice 
                : (discountPct > 0 ? Math.round(originalPrice * (1 - discountPct / 100)) : null);

              if (hasOffer && displayPrice) {
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                        <span style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-secondary)' }}>Rs. {displayPrice}</span>
                        <span style={{ fontSize: '1.2rem', textDecoration: 'line-through', color: 'var(--text-secondary)', opacity: 0.6 }}>Rs. {product.price}</span>
                      </div>
                      {discountPct > 0 && (
                        <motion.span 
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          style={{ 
                            background: 'var(--accent-secondary)', color: 'white', 
                            padding: '6px 14px', borderRadius: '12px', fontSize: '1rem', fontWeight: '800',
                            boxShadow: '0 8px 20px rgba(255, 105, 180, 0.3)'
                          }}
                        >
                          {discountPct}% OFF
                        </motion.span>
                      )}
                    </div>
                    {timeLeft && timeLeft !== 'Expired' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ background: 'rgba(255, 20, 147, 0.05)', padding: '16px', borderRadius: '20px', border: '1px solid rgba(255, 20, 147, 0.1)', marginTop: '12px' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                          <span className="label-caps" style={{ color: '#FF1493' }}>FLASH OFFER ENDS IN</span>
                          <Sparkles size={16} color="#FF1493" />
                        </div>
                        <span style={{ fontSize: '1.6rem', fontWeight: '900', color: '#FF1493', fontFamily: 'monospace' }}>{timeLeft}</span>
                      </motion.div>
                    )}
                  </div>
                );
              }
              return (
                <p style={{ fontSize: '2.5rem', fontWeight: '900', color: 'var(--accent-primary)' }}>Rs. {product.price}</p>
              );
            })()}
          </div>
          
          <div style={{ marginBottom: '40px' }}>
            <h3 className="label-caps" style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>THE STORY</h3>
            <p className="text-body-lg" style={{ fontSize: '1.1rem' }}>
              {product.description}
            </p>
          </div>

          <div className="cta-group">
            <button onClick={handleBuyWhatsapp} className="cta-primary">
              <MessageCircle size={22} /> Buy on WhatsApp
            </button>
            <button onClick={handleBuyEmail} className="cta-secondary">
              <Mail size={22} /> Inquiry via Email
            </button>
          </div>
          
          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '500' }}>
              🎀 Every toy is handmade specifically for you. <br />
              <span style={{ opacity: 0.7 }}>Estimated creation time: 3-5 days.</span>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default ProductDetail
