import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  try {
    const { category, country, session_type, search, limit = 50 } = req.query

    let query = supabase
      .from('experts')
      .select(`
        *,
        category:categories(name, slug, icon)
      `)
      .eq('status', 'approved')

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

    query = query.order('rating', { ascending: false })
    query = query.order('created_at', { ascending: false })
    query = query.limit(parseInt(limit))

    const { data: experts, error } = await query

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch experts' })
    }

    return res.status(200).json({
      success: true,
      count: experts.length,
      experts
    })

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
