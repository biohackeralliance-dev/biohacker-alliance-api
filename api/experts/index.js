import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // DEBUG
  console.log('=== DEBUG START ===')
  console.log('URL exists:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('URL value:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Service key exists:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
  console.log('Service key length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length)
  console.log('=== DEBUG END ===')
  
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { category, country, session_type, search, limit = 50 } = req.query

    let query = supabase
      .from('experts')
      .select(`
        *,
        category:categories(name, slug, icon)
      `)
      .eq('status', 'approved')

    // Filters
    if (category) {
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', category)
        .single()
      
      if (cat) {
        query = query.eq('primary_category_id', cat.id)
      }
    }

    if (country) {
      query = query.eq('country', country)
    }

    if (session_type) {
      query = query.eq('session_type', session_type)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,title.ilike.%${search}%,bio.ilike.%${search}%`)
    }

    // Sorting
    query = query.order('rating', { ascending: false })
    query = query.order('created_at', { ascending: false })
    query = query.limit(parseInt(limit))

    const { data: experts, error } = await query

    if (error) {
      console.error('Query error:', error)
      return res.status(500).json({ error: 'Failed to fetch experts' })
    }

    return res.status(200).json({
      success: true,
      count: experts.length,
      experts
    })

  } catch (error) {
    console.error('API Error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
