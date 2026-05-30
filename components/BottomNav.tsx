'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, ChartLine, Clock3, Settings2 } from 'lucide-react'

const TABS = [
  { href:'/',         label:'Home',     Icon:House     },
  { href:'/insights', label:'Insights', Icon:ChartLine },
  { href:'/history',  label:'History',  Icon:Clock3    },
  { href:'/settings', label:'Settings', Icon:Settings2 },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50" style={{
      background:'rgba(18,18,22,0.97)', backdropFilter:'saturate(180%) blur(20px)',
      WebkitBackdropFilter:'saturate(180%) blur(20px)', borderTop:'1px solid rgba(84,84,88,0.9)',
      paddingBottom:'var(--safe-bottom)' }}>
      <div className="flex" style={{ height:52 }}>
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href
          return (
            <Link key={href} href={href} className="tap flex flex-1 flex-col items-center justify-center" style={{ gap:4 }}>
              <Icon size={23} strokeWidth={on ? 2.4 : 1.8} style={{ color: on ? 'var(--accent)' : '#8E8E93' }} />
              <span style={{ fontSize:10, fontWeight: on?700:500, letterSpacing:'-0.02em', color: on ? 'var(--accent)' : '#8E8E93' }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
