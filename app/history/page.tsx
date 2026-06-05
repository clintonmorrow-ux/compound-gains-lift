'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { fetchRecentSessions } from '@/lib/db'
import { WORKOUTS } from '@/lib/program/data'
import type { WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }

function relDate(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

function dur(a: string, b: string|null) {
  if (!b) return null
  const m = Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  const init = useCallback(async () => {
    const d = await fetchRecentSessions(30)
    setSessions(d); setLoading(false)
  }, [])
  useEffect(() => { init() }, [init])

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'transparent' }}>

      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(6,24,32,0.82)', backdropFilter:'saturate(200%) blur(28px)',
                 WebkitBackdropFilter:'saturate(200%) blur(28px)',
                 borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'10px 18px 13px' }}>
          <div>
            <p style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.6)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Session Log</p>
            <p style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.7px', lineHeight:1.1, marginTop:1 }}>History</p>
          </div>
          <p style={{ fontSize:12, color:'#636366', paddingBottom:3 }}>
            {loading ? '' : `${sessions.length} sessions`}
          </p>
        </div>
      </div>

      <div className="px-4 pt-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin" style={{ borderColor:'var(--accent)' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24">
            <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background:'var(--bg-2)' }}>
              <Dumbbell size={28} style={{ color:'var(--label-4)' }} />
            </div>
            <div className="text-center">
              <p className="t-headline sf-semibold" style={{ color:'var(--label)' }}>No sessions yet</p>
              <p className="t-subhead mt-1" style={{ color:'var(--label-3)' }}>Start your first workout to track progress</p>
            </div>
          </div>
        ) : (
          <div className="ios-group">
            {sessions.map((s: any, i: number) => {
              const wkt  = WORKOUTS.find(w => w.key === s.workout_key)
              const c    = WC[s.workout_key as WorkoutKey] ?? 'var(--accent)'
              const d    = dur(s.started_at, s.completed_at)
              const sets = s.logged_sets?.length ?? 0
              return (
                <div key={s.id} className={`ios-row fade-rise ${i===0?'ios-row-first':''}`}
                   style={{ animationDelay:`${i*0.03}s`, cursor:'pointer' }}
                   onClick={() => router.push(`/history/${s.id}`)}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-footnote sf-heavy"
                       style={{ background:`color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                    {s.workout_key}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{wkt?.shortName ?? s.workout_key}</p>
                      {!s.completed_at &&
                        <span className="t-caption2 px-2 py-0.5 rounded-full" style={{ background:'rgba(255,178,62,0.15)', color:'var(--orange)' }}>Incomplete</span>}
                    </div>
                    <p className="t-caption1 mt-1" style={{ color:'var(--label-3)' }}>
                      Week {s.week_number}
                      {sets > 0 && ` · ${sets} sets`}
                      {d && ` · ${d}`}
                      {` · ${relDate(s.started_at)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color:'var(--label-4)', flexShrink:0 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <div className="px-4 py-6">
        <button onClick={() => router.push('/')}
          className="tap w-full py-4 rounded-2xl t-subhead sf-semibold"
          style={{ background:'var(--fill-3)', color:'#8E8E93' }}>
          ← Back to Home
        </button>
      </div>
      <BottomNav />
    </div>
  )
}
