'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const [email,      setEmail]      = useState('')
  const [sent,       setSent]       = useState(false)
  const [loadMagic,  setLoadMagic]  = useState(false)
  const [loadGoogle, setLoadGoogle] = useState(false)
  const [error,      setError]      = useState('')

  const sendMagicLink = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    setLoadMagic(true); setError('')
    const sb = createClient()
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
    })
    if (err) { setError(err.message); setLoadMagic(false); return }
    setSent(true); setLoadMagic(false)
  }

  const signInWithGoogle = async () => {
    setLoadGoogle(true); setError('')
    const sb = createClient()
    const { error: err } = await sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
    if (err) { setError(err.message); setLoadGoogle(false) }
    // On success the page navigates away automatically
  }

  if (sent) return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'0 32px', gap:24 }}>
      <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(48,209,88,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Mail size={32} strokeWidth={1.5} style={{ color:'#30D158' }} />
      </div>
      <div style={{ textAlign:'center' }}>
        <h1 style={{ fontSize:28, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:10 }}>
          Check your email
        </h1>
        <p style={{ fontSize:16, color:'#8E8E93', lineHeight:1.6 }}>
          Sent a sign-in link to<br/>
          <span style={{ color:'#fff', fontWeight:700 }}>{email}</span>
        </p>
        <p style={{ fontSize:14, color:'#8E8E93', marginTop:16, lineHeight:1.6 }}>
          Tap the link in the email to open the app.
        </p>
      </div>
      <button onClick={()=>{ setSent(false); setEmail('') }}
        style={{ fontSize:14, color:'#8E8E93', background:'none', border:'none', cursor:'pointer' }}>
        Use a different email
      </button>
    </div>
  )

  return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'0 28px' }}>

      {/* Logo */}
      <div style={{ marginBottom:44, textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.12em', marginBottom:8 }}>Compound Gains</p>
        <h1 style={{ fontSize:48, fontWeight:900, color:'#fff', letterSpacing:'-2px', lineHeight:1 }}>
          Lift
        </h1>
      </div>

      {/* Card */}
      <div style={{ width:'100%', maxWidth:360, background:'#0D0D18',
        borderRadius:20, border:'0.5px solid rgba(84,84,88,0.5)', padding:'28px 24px' }}>

        <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:20 }}>
          Sign in
        </h2>

        {/* Google button */}
        <button onClick={signInWithGoogle} disabled={loadGoogle}
          style={{ width:'100%', height:52, borderRadius:14, marginBottom:16,
            display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            background: loadGoogle ? 'rgba(255,255,255,0.06)' : '#fff',
            color: loadGoogle ? '#8E8E93' : '#1a1a1a',
            border: 'none', fontSize:15, fontWeight:700, cursor: loadGoogle ? 'default' : 'pointer',
            transition:'all 0.15s' }}>
          {loadGoogle
            ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid transparent',
                borderTopColor:'#8E8E93', animation:'spin 0.7s linear infinite' }} />
            : <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </>}
        </button>

        {/* Divider */}
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
          <div style={{ flex:1, height:0.5, background:'rgba(84,84,88,0.5)' }} />
          <span style={{ fontSize:12, color:'#8E8E93' }}>or</span>
          <div style={{ flex:1, height:0.5, background:'rgba(84,84,88,0.5)' }} />
        </div>

        {/* Magic link */}
        <label style={{ fontSize:12, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.07em', display:'block', marginBottom:8 }}>
          Email
        </label>
        <input type="email" inputMode="email" autoComplete="email"
          placeholder="you@example.com" value={email}
          onChange={e=>{ setEmail(e.target.value); setError('') }}
          onKeyDown={e=>e.key==='Enter'&&sendMagicLink()}
          style={{ width:'100%', height:48, borderRadius:12, padding:'0 16px', fontSize:16,
            fontWeight:500, outline:'none', background:'rgba(118,118,128,0.18)', color:'#fff',
            border: error ? '1px solid rgba(255,69,58,0.6)' : '1px solid rgba(84,84,88,0.5)',
            boxSizing:'border-box' }} />
        {error && <p style={{ fontSize:13, color:'#FF453A', marginTop:6 }}>{error}</p>}

        <button onClick={sendMagicLink} disabled={loadMagic||!email}
          style={{ width:'100%', height:50, borderRadius:14, marginTop:12, fontSize:15,
            fontWeight:700, letterSpacing:'-0.3px', cursor: loadMagic||!email ? 'default' : 'pointer',
            background: loadMagic||!email ? 'rgba(118,118,128,0.15)' : 'rgba(255,159,10,0.15)',
            color: loadMagic||!email ? '#8E8E93' : '#FF9F0A',
            border: `1px solid ${loadMagic||!email ? 'rgba(84,84,88,0.4)' : 'rgba(255,159,10,0.4)'}`,
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            transition:'all 0.15s' }}>
          {loadMagic
            ? <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid transparent',
                borderTopColor:'#8E8E93', animation:'spin 0.7s linear infinite' }} />
            : <><Mail size={16} strokeWidth={2.5} />Send magic link</>}
        </button>
      </div>

      <p style={{ fontSize:12, color:'rgba(84,84,88,0.7)', marginTop:20, textAlign:'center', lineHeight:1.6 }}>
        Your data is tied to your account.<br/>Access from any device, any time.
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
