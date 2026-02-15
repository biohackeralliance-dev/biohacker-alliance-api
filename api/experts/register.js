import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const {
      full_name,
      email,
      title,
      bio,
      country,
      city,
      primary_category,
      specialties,
      session_type,
      website,
      instagram,
      linkedin
    } = req.body

    // Validation
    if (!full_name || !email || !title || !bio || !country || !city || !primary_category || !session_type) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['full_name', 'email', 'title', 'bio', 'country', 'city', 'primary_category', 'session_type']
      })
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Get category
    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', primary_category)
      .single()

    if (categoryError || !category) {
      return res.status(400).json({ error: 'Invalid category' })
    }

    // Parse specialties
    const specialtiesArray = specialties 
      ? (typeof specialties === 'string' ? specialties.split(',').map(s => s.trim()) : specialties)
      : []

    // Insert expert
    const { data: expert, error: insertError } = await supabase
      .from('experts')
      .insert({
        full_name,
        email: email.toLowerCase().trim(),
        title,
        bio,
        country,
        city,
        primary_category_id: category.id,
        specialties: specialtiesArray.filter(s => s.length > 0),
        session_type,
        website: website || null,
        instagram: instagram || null,
        linkedin: linkedin || null,
        status: 'pending',
        subscription_tier: 'free',
        rating: 5.0,
        review_count: 0
      })
      .select()
      .single()

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'Email already registered' })
      }
      console.error('Insert error:', insertError)
      return res.status(500).json({ error: 'Failed to submit application' })
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully! We will review it shortly.',
      expert_id: expert.id
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
