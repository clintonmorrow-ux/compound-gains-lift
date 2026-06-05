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

export default function BottomNav() {
  const path = usePathname()
  return (
    <>
      <div style={{ height:'calc(74px + var(--safe-bottom))' }} />

      <nav style={{
        position:'fixed', bottom:0, left:0, right:0, zIndex:50,
        paddingBottom:'var(--safe-bottom)',
        background:'rgba(10,10,16,0.97)',
        backdropFilter:'saturate(200%) blur(28px)',
        WebkitBackdropFilter:'saturate(200%) blur(28px)',
        borderTop:'0.5px solid rgba(84,84,88,0.45)',
      }}>
        <div style={{ display:'flex', alignItems:'stretch', height:58, paddingInline:6 }}>
          {TABS.map(({ href, label, Icon }) => {
            const on = path === href || (href !== '/' && path.startsWith(href))
            return (
              <Link key={href} href={href} style={{
                flex:1,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                gap:3, borderRadius:13, margin:'5px 2px',
                background: on ? 'rgba(255,126,107,0.13)' : 'transparent',
                border: on ? '0.5px solid rgba(255,126,107,0.22)' : '0.5px solid transparent',
                textDecoration:'none', transition:'all 0.18s ease',
              }}>
                <Icon
                  size={21}
                  strokeWidth={on ? 2.3 : 1.6}
                  style={{ color: on ? '#FF7E6B' : '#636366', transition:'all 0.18s ease' }}
                />
                <span style={{
                  fontSize:9, fontWeight: on ? 700 : 500,
                  color: on ? '#FF7E6B' : '#636366',
                  letterSpacing:'0.01em', transition:'all 0.18s ease',
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
