'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, Clock3, Settings2 } from 'lucide-react'

const TABS = [
  { href:'/',         label:'Home',     Icon:House    },
  { href:'/history',  label:'History',  Icon:Clock3   },
  { href:'/settings', label:'Settings', Icon:Settings2 },
]

export default function BottomNav() {
  const path = usePathname()
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'rgba(28,28,30,0.82)',
        backdropFilter: 'saturate(180%) blur(20px)',
        WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        borderTop: '0.5px solid var(--sep)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div className="flex" style={{ height: 49 }}>
        {TABS.map(({ href, label, Icon }) => {
          const on = path === href
          return (
            <Link key={href} href={href}
              className="tap flex flex-1 flex-col items-center justify-center"
              style={{ gap:3, textDecoration:'none' }}>
              <Icon
                size={24}
                strokeWidth={on ? 2.2 : 1.6}
                style={{ color: on ? 'var(--accent)' : 'var(--label-4)' }}
              />
              <span style={{
                fontSize:10,
                fontWeight: on ? 600 : 400,
                letterSpacing:'-0.02em',
                color: on ? 'var(--accent)' : 'var(--label-4)',
                textDecoration:'none',
              }}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
