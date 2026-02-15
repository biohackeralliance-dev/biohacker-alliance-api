export default async function handler(req, res) {
  console.log('=== SIMPLE TEST ===')
  console.log('ENV URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('ENV KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20) + '...')
  
  return res.status(200).json({
    test: 'working',
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
    keyLength: process.env.SUPABASE_SERVICE_ROLE_KEY?.length
  })
} 
