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
    <>
      {/* Spacer so content doesn't hide behind nav */}
      <div style={{ height: 'calc(80px + var(--safe-bottom))' }} />

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        paddingBottom:'var(--safe-bottom)',
        background:'rgba(12,12,18,0.96)',
        backdropFilter:'saturate(180%) blur(24px)',
        WebkitBackdropFilter:'saturate(180%) blur(24px)',
        borderTop:'0.5px solid rgba(84,84,88,0.5)',
      }}>
        <div style={{
          display:'flex', alignItems:'stretch',
          height:60, paddingInline:8,
        }}>
          {TABS.map(({ href, label, Icon }) => {
            const on = path === href
            return (
              <Link key={href} href={href} style={{
                flex:1, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', gap:4,
                borderRadius:14, margin:'6px 3px',
                background: on ? 'rgba(255,159,10,0.12)' : 'transparent',
                transition:'background 0.2s',
                textDecoration:'none',
              }}>
                <Icon
                  size={22}
                  strokeWidth={on ? 2.4 : 1.7}
                  style={{ color: on ? '#FF9F0A' : '#8E8E93' }}
                />
                <span style={{
                  fontSize:10, fontWeight: on ? 700 : 500,
                  letterSpacing:'-0.01em',
                  color: on ? '#FF9F0A' : '#8E8E93',
                }}>
                  {label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
