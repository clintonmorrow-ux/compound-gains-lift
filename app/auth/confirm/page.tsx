'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ConfirmPage() {
  const router = useRouter()
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()

    // Handle the hash fragment (#access_token=...) that Supabase magic links use
    const handleAuth = async () => {
      // Give the Supabase client a moment to process the URL hash
      const { data, error: err } = await supabase.auth.getSession()

      if (err) { setError(err.message); return }

      if (data.session?.user?.email) {
        // Real email session — go to app
        router.replace('/')
        return
      }

      // No session yet — listen for the auth state change that fires
      // after the client processes the URL hash token
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'SIGNED_IN' && session?.user?.email) {
            subscription.unsubscribe()
            router.replace('/')
          }
          if (event === 'PASSWORD_RECOVERY') {
            subscription.unsubscribe()
            router.replace('/')
          }
        }
      )

      // Timeout fallback — if nothing fires in 5s, something went wrong
      setTimeout(() => {
        subscription.unsubscribe()
        setError('Sign-in link expired or already used. Please request a new one.')
      }, 5000)
    }

    handleAuth()
  }, [router])

  if (error) return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'0 32px', gap:20, textAlign:'center' }}>
      <p style={{ fontSize:18, fontWeight:700, color:'#FF453A' }}>Sign-in failed</p>
      <p style={{ fontSize:15, color:'#8E8E93', lineHeight:1.6 }}>{error}</p>
      <button onClick={() => window.location.href = '/login'}
        style={{ marginTop:8, height:48, padding:'0 28px', borderRadius:14, fontSize:15,
          fontWeight:700, background:'#FF9F0A', color:'#fff', border:'none', cursor:'pointer' }}>
        Back to sign in
      </button>
    </div>
  )

  return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:20 }}>
      <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid transparent',
        borderTopColor:'#FF9F0A', animation:'spin 0.7s linear infinite' }} />
      <p style={{ fontSize:16, color:'#8E8E93' }}>Signing you in…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
