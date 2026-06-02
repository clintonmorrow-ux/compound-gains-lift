'use client'
import { useEffect, useState, useMemo } from 'react'
import { TrendingUp, Zap, BarChart3, Calendar, ChevronRight } from 'lucide-react'

const epley = (w: number, r: number) => w * (1 + r / 30)

// Compute top strength gainers from cycle sets
function strengthGains(sets: { exercise_name:string; weight_lbs:number|null; reps:number|null; completed_at:string }[]) {
  const byEx: Record<string, typeof sets> = {}
  sets.forEach(s => {
    if (!s.weight_lbs || !s.reps) return
    ;(byEx[s.exercise_name] ??= []).push(s)
  })
  const gains: { name:string; start:number; end:number; delta:number }[] = []
  for (const [name, exSets] of Object.entries(byEx)) {
    if (exSets.length < 4) continue
    const sorted = [...exSets].sort((a,b) => a.completed_at < b.completed_at ? -1 : 1)
    const firstQuarter = sorted.slice(0, Math.ceil(sorted.length * 0.25))
    const lastQuarter  = sorted.slice(-Math.ceil(sorted.length * 0.25))
    const startE1rm = Math.max(...firstQuarter.map(s => epley(s.weight_lbs!, s.reps!)))
    const endE1rm   = Math.max(...lastQuarter.map(s  => epley(s.weight_lbs!, s.reps!)))
    const delta = endE1rm - startE1rm
    if (delta > 2) gains.push({ name, start: Math.round(startE1rm), end: Math.round(endE1rm), delta: Math.round(delta) })
  }
  return gains.sort((a,b) => b.delta - a.delta).slice(0, 4)
}

// Animated number counter
function Counter({ target, suffix = '', duration = 1400 }: { target: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const progress = Math.min((Date.now() - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setVal(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(tick)
    }
    const id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target, duration])
  return <>{val.toLocaleString()}{suffix}</>
}

// Confetti particle
function Confetti() {
  const particles = useMemo(() => {
    const colors = ['#FF9F0A','#30D158','#0A84FF','#FF453A','#BF5AF2','#FFD60A','#FF6B6B','#4ECDC4']
    return Array.from({ length: 48 }, (_, i) => ({
      id: i,
      color: colors[i % colors.length],
      x: (Math.random() - 0.5) * 320,
      y: -(Math.random() * 400 + 100),
      rotate: Math.random() * 720 - 360,
      scale: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 0.6,
      dur: Math.random() * 0.8 + 0.8,
      shape: i % 3,  // 0=circle, 1=rect, 2=diamond
    }))
  }, [])

  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', zIndex:0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position:'absolute',
          left:'50%', bottom:'60%',
          width: p.shape === 1 ? 10 : 8,
          height: p.shape === 1 ? 6 : 8,
          background: p.color,
          borderRadius: p.shape === 0 ? '50%' : p.shape === 1 ? 2 : 0,
          transform: p.shape === 2 ? 'rotate(45deg)' : undefined,
          opacity: 0,
          animation: `confetti-burst ${p.dur}s ease-out ${p.delay}s forwards`,
          '--dx': `${p.x}px`,
          '--dy': `${p.y}px`,
          '--rot': `${p.rotate}deg`,
          '--sc': p.scale,
        } as any} />
      ))}
      <style>{`
        @keyframes confetti-burst {
          0%   { opacity:1; transform: translate(0,0) rotate(0deg) scale(1); }
          100% { opacity:0; transform: translate(var(--dx), var(--dy)) rotate(var(--rot)) scale(var(--sc)); }
        }
      `}</style>
    </div>
  )
}

interface Props {
  cycleNumber: number
  workoutsCompleted: number
  totalSets: number
  sets: { exercise_name:string; weight_lbs:number|null; reps:number|null; completed_at:string }[]
  firstDate: string | null
  lastDate:  string | null
  onBeginNextCycle: () => void
}

export default function CycleComplete({ cycleNumber, workoutsCompleted, totalSets, sets, firstDate, lastDate, onBeginNextCycle }: Props) {
  const [phase, setPhase] = useState<'burst'|'stats'|'action'>('burst')
  const gains = useMemo(() => strengthGains(sets), [sets])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('stats'),  900)
    const t2 = setTimeout(() => setPhase('action'), 1800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const dateRange = useMemo(() => {
    if (!firstDate || !lastDate) return ''
    const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
    return `${fmt(firstDate)} – ${fmt(lastDate)}`
  }, [firstDate, lastDate])

  const nextCycle = cycleNumber + 1

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:100,
      background:'rgba(0,0,0,0.97)',
      display:'flex', flexDirection:'column',
      overflowY:'auto',
    }}>
      <Confetti />

      <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center',
        padding:'env(safe-area-inset-top) 20px 24px', paddingTop:'calc(env(safe-area-inset-top) + 48px)',
        position:'relative', zIndex:1 }}>

        {/* Crown + cycle badge */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:24 }}>
          <div style={{ fontSize:56, lineHeight:1, marginBottom:12, filter:'drop-shadow(0 0 24px rgba(255,159,10,0.6))' }}>
            👑
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ height:1, width:32, background:'rgba(255,159,10,0.4)' }} />
            <span style={{ fontSize:11, fontWeight:700, color:'rgba(255,159,10,0.7)',
              textTransform:'uppercase', letterSpacing:'0.15em' }}>
              Cycle {cycleNumber} Complete
            </span>
            <div style={{ height:1, width:32, background:'rgba(255,159,10,0.4)' }} />
          </div>
          <h1 style={{ fontSize:38, fontWeight:900, color:'#fff', letterSpacing:'-1.5px',
            lineHeight:1.05, textAlign:'center', marginBottom:6 }}>
            12 Weeks.<br />Done.
          </h1>
          {dateRange && (
            <p style={{ fontSize:13, color:'#636366', letterSpacing:'0.02em' }}>{dateRange}</p>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20,
          opacity: phase === 'burst' ? 0 : 1, transform: phase === 'burst' ? 'translateY(12px)' : 'translateY(0)',
          transition:'all 0.5s cubic-bezier(0.2,0,0,1)' }}>

          {[
            { Icon:Calendar,  label:'Workouts', value:workoutsCompleted, suffix:'',   color:'#0A84FF' },
            { Icon:BarChart3, label:'Sets Logged', value:totalSets, suffix:'',         color:'#30D158' },
            { Icon:Zap,       label:'Weeks',   value:12,            suffix:'/12',     color:'#FF9F0A' },
            { Icon:TrendingUp,label:'Program', value:100,           suffix:'%',       color:'#BF5AF2' },
          ].map(({ Icon, label, value, suffix, color }) => (
            <div key={label} style={{
              padding:'16px 14px', borderRadius:18,
              background:`color-mix(in srgb, ${color} 10%, rgba(20,20,28,1))`,
              border:`0.5px solid color-mix(in srgb, ${color} 30%, transparent)`,
              display:'flex', flexDirection:'column', alignItems:'flex-start', gap:6,
            }}>
              <Icon size={16} strokeWidth={2} style={{ color }} />
              <p style={{ fontSize:28, fontWeight:900, color:'#fff', letterSpacing:'-1px', lineHeight:1 }}>
                <Counter target={value} suffix={suffix} duration={1200} />
              </p>
              <p style={{ fontSize:11, fontWeight:600, color:'rgba(142,142,147,0.8)', letterSpacing:'0.03em' }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Strength gains */}
        {gains.length > 0 && (
          <div style={{ width:'100%', marginBottom:20,
            opacity: phase === 'action' ? 1 : 0, transform: phase === 'action' ? 'translateY(0)' : 'translateY(12px)',
            transition:'all 0.5s cubic-bezier(0.2,0,0,1) 0.1s' }}>
            <p style={{ fontSize:11, fontWeight:700, color:'rgba(142,142,147,0.6)',
              textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
              Strength Gains This Cycle
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {gains.map(g => {
                const pct = Math.round((g.delta / g.start) * 100)
                const barW = Math.min(pct * 2.5, 100)
                return (
                  <div key={g.name} style={{ padding:'12px 14px', borderRadius:14,
                    background:'rgba(20,20,28,0.9)', border:'0.5px solid rgba(84,84,88,0.4)' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <p style={{ fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'-0.2px' }}>{g.name}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <span style={{ fontSize:12, color:'#636366' }}>{g.start} → {g.end} lbs</span>
                        <span style={{ fontSize:12, fontWeight:800, color:'#30D158',
                          background:'rgba(48,209,88,0.12)', padding:'1px 7px', borderRadius:99 }}>
                          +{g.delta} lbs
                        </span>
                      </div>
                    </div>
                    <div style={{ height:4, borderRadius:99, background:'rgba(84,84,88,0.3)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${barW}%`, borderRadius:99,
                        background:'linear-gradient(90deg, #30D158, #0A84FF)',
                        transition:'width 1s ease 0.5s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* What carries over */}
        <div style={{ width:'100%', marginBottom:24, padding:'14px 16px', borderRadius:16,
          background:'rgba(255,159,10,0.07)', border:'0.5px solid rgba(255,159,10,0.25)',
          opacity: phase === 'action' ? 1 : 0, transition:'opacity 0.5s 0.2s' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#FF9F0A', textTransform:'uppercase',
            letterSpacing:'0.1em', marginBottom:10 }}>Cycle {nextCycle} starts with</p>
          {[
            'Your current strength — smart weights calibrate from recent performance',
            'All exercise preferences and program customisations',
            'Full history preserved for trend analysis',
            'Phase 1 at your new baseline — heavier than last time',
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start',
              marginBottom: i < 3 ? 8 : 0 }}>
              <div style={{ width:16, height:16, borderRadius:5, background:'rgba(255,159,10,0.2)',
                display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 }}>
                <span style={{ fontSize:9, color:'#FF9F0A' }}>✓</span>
              </div>
              <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.4 }}>{item}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button onClick={onBeginNextCycle}
          style={{ width:'100%', height:58, borderRadius:18, fontSize:18, fontWeight:800,
            letterSpacing:'-0.3px',
            background:'linear-gradient(135deg, #FF9F0A 0%, #FF6B00 100%)',
            color:'#000', border:'none', cursor:'pointer',
            boxShadow:'0 8px 32px rgba(255,159,10,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity: phase === 'action' ? 1 : 0,
            transform: phase === 'action' ? 'translateY(0) scale(1)' : 'translateY(8px) scale(0.97)',
            transition:'all 0.4s cubic-bezier(0.2,0,0,1) 0.3s' }}>
          Begin Cycle {nextCycle}
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>

        <p style={{ fontSize:12, color:'rgba(84,84,88,0.7)', marginTop:14, textAlign:'center',
          opacity: phase === 'action' ? 1 : 0, transition:'opacity 0.4s 0.5s' }}>
          Week 1 · Phase 1 · Accumulation
        </p>

      </div>
    </div>
  )
}
