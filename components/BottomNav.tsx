'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { House, LayoutList, ChartLine, Clock3, Settings2 } from 'lucide-react'

const TABS = [
  { href:'/',         label:'Home',     Icon:House       },
  { href:'/program',  label:'Program',  Icon:LayoutList  },
  { href:'/insights', label:'Insights', Icon:ChartLine   },
  { href:'/history',  label:'History',  Icon:Clock3      },
  { href:'/settings', label:'Settings', Icon:Settings2   },
]

/**
 * UITabBar. The selected item is indicated by tint alone — no pill, no
 * border, no background behind it. Background is the system chrome
 * material: translucent, blurred, hairline on top.
 */
export default function BottomNav() {
  const path = usePathname()
  return (
    <>
      <div style={{ height:'calc(49px + var(--safe-bottom))' }} />

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        paddingBottom:'var(--safe-bottom)',
        background:'rgba(28,28,30,0.78)',
        backdropFilter:'saturate(180%) blur(20px)',
        WebkitBackdropFilter:'saturate(180%) blur(20px)',
        borderTop:'0.5px solid var(--sep)',
      }}>
        <div style={{ display:'flex', alignItems:'stretch', height:49 }}>
          {TABS.map(({ href, label, Icon }) => {
            const on = path === href || (href !== '/' && path.startsWith(href))
            const color = on ? 'var(--accent)' : 'var(--gray)'
            return (
              <Link key={href} href={href} aria-current={on ? 'page' : undefined} style={{
                flex:1,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:2, paddingTop:2,
                textDecoration:'none', transition:'color 0.15s ease',
              }}>
                <Icon size={24} strokeWidth={on ? 2.2 : 1.7} style={{ color, transition:'color 0.15s ease' }} />
                <span style={{ fontSize:10, fontWeight:500, color, letterSpacing:'-0.1px', transition:'color 0.15s ease' }}>
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
