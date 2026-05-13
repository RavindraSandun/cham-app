import { supabase } from './supabase'

export interface Product {
  _id: string;
  name: string;
  price: string;
  offerPrice?: string;
  offerExpiry?: string;
  description: string;
  images: string[];
  category?: string;
  discountPercentage?: string;
  createdAt: string;
}

export interface Message {
  _id: string;
  name: string;
  email: string;
  phone: string;
  comment: string;
  createdAt: string;
}

// Helper to map Supabase row to frontend-compatible shape
const mapProduct = (item: Record<string, unknown>): Product => {
  // Handle potential column name quirks (trailing spaces etc.)
  const allKeys = Object.keys(item)
  const dpKey = allKeys.find(k => k.trim() === 'discount_percentage')
  const discountVal = dpKey ? (item[dpKey] as string) : ''

  return {
    _id: item.id as string,
    name: item.name as string,
    price: item.price as string,
    offerPrice: item.offer_price as string | undefined,
    offerExpiry: item.offer_expiry as string | undefined,
    description: item.description as string,
    images: item.images as string[],
    category: item.category as string | undefined,
    discountPercentage: discountVal,
    createdAt: item.created_at as string,
  }
}

const mapMessage = (item: Record<string, unknown>): Message => ({
  _id: item.id as string,
  name: item.name as string,
  email: item.email as string,
  phone: item.phone as string,
  comment: item.comment as string,
  createdAt: item.created_at as string,
})

// ─── Product API ────────────────────────────────────────────────────────────

export const fetchProducts = async (): Promise<Product[]> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapProduct)
}

export const fetchProductById = async (id: string): Promise<Product> => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw new Error('Failed to fetch product')
  return mapProduct(data)
}

export const createProduct = async (productData: Record<string, unknown>): Promise<Product> => {
  const insertData: Record<string, unknown> = {
    name: productData.name,
    price: productData.price,
    offer_price: productData.offerPrice,
    offer_expiry: productData.offerExpiry,
    description: productData.description,
    images: productData.images,
    category: productData.category,
    discount_percentage: productData.discountPercentage,
  }

  const { data, error } = await supabase
    .from('products')
    .insert([insertData])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapProduct(data)
}

export const updateProduct = async (id: string, productData: Record<string, unknown>): Promise<Product> => {
  const updateData: Record<string, unknown> = {
    name: productData.name,
    price: productData.price,
    offer_price: productData.offerPrice,
    offer_expiry: productData.offerExpiry,
    description: productData.description,
    images: productData.images,
    category: productData.category || 'Uncategorized',
    discount_percentage: productData.discountPercentage,
  }

  const { data, error } = await supabase
    .from('products')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapProduct(data)
}

export const deleteProduct = async (id: string): Promise<{ message: string }> => {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { message: 'Product deleted' }
}

// ─── Message API ────────────────────────────────────────────────────────────

export const fetchMessages = async (): Promise<Message[]> => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data || []).map(mapMessage)
}

export const createMessage = async (messageData: Record<string, unknown>): Promise<Message> => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      name: messageData.name,
      email: messageData.email,
      phone: messageData.phone,
      comment: messageData.comment,
    }])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return mapMessage(data)
}

export const deleteMessage = async (id: string): Promise<{ message: string }> => {
  const { error } = await supabase
    .from('messages')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
  return { message: 'Message deleted' }
}

// ─── Status API ─────────────────────────────────────────────────────────────

export const fetchDbStatus = async () => {
  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    return {
      connected: !error,
      state: error ? 'disconnected' : 'connected',
      url_present: !!import.meta.env.VITE_SUPABASE_URL,
      key_present: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      error: error ? error.message : null,
    }
  } catch (err) {
    return {
      connected: false,
      state: 'error',
      url_present: !!import.meta.env.VITE_SUPABASE_URL,
      key_present: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}
