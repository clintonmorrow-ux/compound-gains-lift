'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

/**
 * A PWA left open across a deploy keeps the old page while its script chunks
 * vanish from the server — buttons render but do nothing. When the app comes
 * back to the foreground, compare the build id; if it changed and we are not
 * mid-workout, reload to pick up the current build. Mid-workout we leave it:
 * the sets are syncing in the background and a reload would interrupt them.
 */
export default function BuildWatch() {
  const path = usePathname()
  const known = useRef<string | null>(null)
  useEffect(() => {
    const fetchId = () => fetch('/api/build', { cache: 'no-store' }).then(r => r.json()).then(j => j.id as string).catch(() => null)
    fetchId().then(id => { known.current = id })
    const onVisible = async () => {
      if (document.visibilityState !== 'visible' || !known.current) return
      const id = await fetchId()
      if (id && id !== known.current && !path.startsWith('/workout')) window.location.reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [path])
  return null
}
