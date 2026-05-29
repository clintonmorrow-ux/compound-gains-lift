'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Dumbbell, Clock, Settings } from 'lucide-react'

const NAV = [
  { href: '/',         label: 'Home',    Icon: Home     },
  { href: '/history',  label: 'History', Icon: Clock    },
  { href: '/settings', label: 'Weights', Icon: Settings },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bottom-nav-height"
      style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}
    >
      <div className="flex h-16">
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 transition-opacity active:opacity-70"
            >
              <Icon
                size={22}
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              />
              <span
                className="text-[10px] font-medium tracking-wide"
                style={{ color: active ? 'var(--accent)' : 'var(--muted)' }}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
