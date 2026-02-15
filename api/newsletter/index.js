import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    const { data, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: email.toLowerCase().trim(),
        subscribed: true
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return res.status(200).json({ 
          success: true,
          message: 'You are already subscribed!' 
        })
      }
      return res.status(500).json({ error: 'Failed to subscribe' })
    }

    return res.status(201).json({
      success: true,
      message: 'Successfully subscribed to newsletter!'
    })

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}
