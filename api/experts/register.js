import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
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

    if (!full_name || !email || !title || !bio || !country || !city || !primary_category || !session_type) {
      return res.status(400).json({ 
        error: 'Missing required fields'
      })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const { data: category, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', primary_category)
      .single()

    if (categoryError || !category) {
      return res.status(400).json({ error: 'Invalid category' })
    }

    const specialtiesArray = specialties 
      ? specialties.split(',').map(s => s.trim()).filter(s => s.length > 0)
      : []

    const { data: expert, error: insertError } = await supabase
      .from('experts')
      .insert({
        full_name,
        email,
        title,
        bio,
        country,
        city,
        primary_category_id: category.id,
        specialties: specialtiesArray,
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
      return res.status(500).json({ error: 'Failed to submit application' })
    }

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      expert_id: expert.id
    })

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
