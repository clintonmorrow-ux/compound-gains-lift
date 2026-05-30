'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail } from 'lucide-react'

export default function LoginPage() {
  const [email,   setEmail]   = useState('')
  const [sent,    setSent]    = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  const send = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return }
    setLoading(true); setError('')
    const sb = createClient()
    const { error: err } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` }
    })
    if (err) { setError(err.message); setLoading(false); return }
    setSent(true); setLoading(false)
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
          We sent a sign-in link to<br/>
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
      <div style={{ marginBottom:48, textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.12em', marginBottom:8 }}>Compound Gains</p>
        <h1 style={{ fontSize:48, fontWeight:900, color:'#fff', letterSpacing:'-2px', lineHeight:1 }}>
          Lift
        </h1>
      </div>
      <div style={{ width:'100%', maxWidth:360, background:'#0D0D18',
        borderRadius:20, border:'0.5px solid rgba(84,84,88,0.5)', padding:'28px 24px' }}>
        <h2 style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:6 }}>
          Sign in
        </h2>
        <p style={{ fontSize:14, color:'#8E8E93', marginBottom:24, lineHeight:1.5 }}>
          Enter your email — we'll send a magic link. No password needed.
        </p>
        <label style={{ fontSize:12, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.07em', display:'block', marginBottom:8 }}>
          Email
        </label>
        <input type="email" inputMode="email" autoComplete="email"
          placeholder="you@example.com" value={email}
          onChange={e=>{ setEmail(e.target.value); setError('') }}
          onKeyDown={e=>e.key==='Enter'&&send()}
          style={{ width:'100%', height:48, borderRadius:12, padding:'0 16px', fontSize:16,
            fontWeight:500, outline:'none', background:'rgba(118,118,128,0.18)', color:'#fff',
            border: error ? '1px solid rgba(255,69,58,0.6)' : '1px solid rgba(84,84,88,0.5)',
            boxSizing:'border-box' }} />
        {error && <p style={{ fontSize:13, color:'#FF453A', marginTop:6 }}>{error}</p>}
        <button onClick={send} disabled={loading||!email}
          style={{ width:'100%', height:52, borderRadius:14, marginTop:16, fontSize:16,
            fontWeight:800, letterSpacing:'-0.3px', cursor: loading||!email ? 'default' : 'pointer',
            background: loading||!email ? 'rgba(118,118,128,0.2)' : '#FF9F0A',
            color: loading||!email ? '#8E8E93' : '#fff', border:'none',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            boxShadow: !loading&&email ? '0 4px 20px rgba(255,159,10,0.35)' : 'none',
            transition:'all 0.15s' }}>
          {loading
            ? <div style={{ width:18, height:18, borderRadius:'50%', border:'2.5px solid transparent',
                borderTopColor:'#8E8E93', animation:'spin 0.7s linear infinite' }} />
            : <><Mail size={18} strokeWidth={2.5} />Send magic link</>}
        </button>
      </div>
      <p style={{ fontSize:12, color:'rgba(84,84,88,0.7)', marginTop:24, textAlign:'center', lineHeight:1.6 }}>
        Your workout data is tied to your email.<br/>Access from any device, any time.
      </p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
