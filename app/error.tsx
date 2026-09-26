'use client'
import { useEffect } from 'react'

/**
 * Route-level error boundary. Two jobs:
 *  1. A stale page after a deploy fails to load its script chunks (the
 *     hashes changed). Buttons render but are dead. Detect it and reload
 *     — that fetches the current build and fixes it in one step.
 *  2. Anything else: never leave the athlete on a dead screen. Show the
 *     message and a Reload button.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    const stale = /ChunkLoadError|Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(`${error?.name} ${error?.message}`)
    if (stale) window.location.reload()
  }, [error])

  return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', padding:'0 32px', gap:16, textAlign:'center' }}>
      <h1 style={{ fontSize:22, fontWeight:700, color:'#fff' }}>Something broke</h1>
      <p style={{ fontSize:14, color:'#8E8E93', lineHeight:1.5, wordBreak:'break-word' }}>{error?.message || 'Unknown error'}</p>
      <div style={{ display:'flex', gap:10 }}>
        <button onClick={() => window.location.reload()} style={{ height:44, padding:'0 20px', borderRadius:12, background:'var(--blue, #0A84FF)', color:'#fff', fontSize:15, fontWeight:600 }}>Reload</button>
        <button onClick={reset} style={{ height:44, padding:'0 20px', borderRadius:12, background:'#2C2C2E', color:'#fff', fontSize:15, fontWeight:600 }}>Try again</button>
      </div>
    </div>
  )
}
