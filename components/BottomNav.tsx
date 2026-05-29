'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Clock, SlidersHorizontal } from 'lucide-react'

const TABS = [
  { href: '/',         label: 'Home',    Icon: Home               },
  { href: '/history',  label: 'History', Icon: Clock              },
  { href: '/settings', label: 'Weights', Icon: SlidersHorizontal  },
]

export default function BottomNav() {
  const path = usePathname()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'rgba(13,13,21,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'var(--safe-bottom)',
      }}
    >
      <div className="flex h-16">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center justify-center gap-1 pressable"
            >
              <div
                className="flex items-center justify-center w-10 h-7 rounded-full transition-all duration-200"
                style={{ background: active ? 'var(--accent-bg)' : 'transparent' }}
              >
                <Icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
                />
              </div>
              <span
                className="text-[10px] font-semibold tracking-wide"
                style={{ color: active ? 'var(--accent)' : 'var(--text-3)' }}
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
