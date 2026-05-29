'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2, Settings2, Clock } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG, PHASE_LABELS } from '@/lib/program/data'
import { fetchSettings, updateSettings, fetchRecentSessions, fetchAllOneRms } from '@/lib/db'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }
const PC: Record<number,string>  = {
  1:'ph-1',2:'ph-1',3:'ph-1',4:'ph-d',
  5:'ph-2',6:'ph-2',7:'ph-2',8:'ph-d',
  9:'ph-3',10:'ph-3',11:'ph-3',12:'ph-d',
}

export default function Dashboard() {
  const router = useRouter()
  const [week,    setWeek]    = useState(1)
  const [done,    setDone]    = useState<string[]>([])
  const [hasRms,  setHasRms]  = useState(true)
  const [ready,   setReady]   = useState(false)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{session} } = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      const [s, sessions, rms] = await Promise.all([
        fetchSettings(), fetchRecentSessions(20), fetchAllOneRms()
      ])
      setWeek(s.current_week)
      setHasRms(rms.length > 0)
      setDone((sessions as any[])
        .filter(x => x.week_number===s.current_week && x.completed_at)
        .map((x:any) => x.workout_key))
    } catch(e) {
      console.error('Dashboard error:', e)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { init() }, [init])

  const bumpWeek = async (d: number) => {
    const n = Math.max(1, Math.min(12, week + d))
    setWeek(n); await updateSettings({ current_week: n })
  }

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin" style={{ borderColor:'var(--accent)' }} />
    </div>
  )

  const cfg  = WEEK_CONFIG[week]
  const next = WORKOUTS.find(w => !done.includes(w.key))

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* ── Nav bar ── */}
      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(0,0,0,0.95)', backdropFilter:'saturate(180%) blur(24px)', WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'1px solid rgba(84,84,88,0.8)' }}>
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <div>
            <p className="t-caption2" style={{ color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em' }}>Compound Gains</p>
            <h1 className="t-large-title sf-heavy" style={{ lineHeight:1.1, marginTop:1 }}>Lift</h1>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/history')}
              className="tap w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background:'var(--fill-3)' }}>
              <Clock size={18} strokeWidth={1.8} style={{ color:'#8E8E93' }} />
            </button>
            <button onClick={() => router.push('/settings')}
              className="tap w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background:'var(--fill-3)' }}>
              <Settings2 size={18} strokeWidth={1.8} style={{ color:'#8E8E93' }} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* ── 1RM prompt banner ── */}
        {!hasRms && (
          <Link href="/settings">
            <div className="tap rounded-2xl px-4 py-4 flex items-center gap-3 fade-rise"
                 style={{ background:'color-mix(in srgb, var(--orange) 14%, var(--bg-2))', border:'0.5px solid color-mix(in srgb, var(--orange) 35%, transparent)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background:'color-mix(in srgb, var(--orange) 20%, transparent)' }}>
                <Settings2 size={20} style={{ color:'var(--orange)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>Set your 1-rep maxes</p>
                <p className="t-footnote mt-0.5" style={{ color:'var(--label-2)' }}>
                  Target weights will auto-fill for every exercise
                </p>
              </div>
              <ChevronRight size={16} style={{ color:'var(--label-3)', flexShrink:0 }} />
            </div>
          </Link>
        )}

        {/* ── Week picker — full width row, no cramping ── */}
        <div className="fade-rise rounded-2xl px-4 py-3 flex items-center justify-between"
             style={{ background:'var(--bg-2)', animationDelay:'0.03s' }}>
          <div>
            <p className="t-caption2" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>Current Week</p>
            <p className="t-title2 sf-bold mt-0.5" style={{ color:'var(--label)' }}>
              Week {week}
              <span className="t-body" style={{ color:'var(--label-3)', fontWeight:400 }}> of 12</span>
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`${PC[week]} t-caption2 sf-semibold px-2.5 py-0.5 rounded-full`} style={{ letterSpacing:'0.02em' }}>
                {PHASE_LABELS[week]}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => bumpWeek(-1)}
              className="tap w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background:'var(--fill-3)' }}>
              <ChevronLeft size={18} style={{ color: week===1 ? 'var(--label-4)' : 'var(--accent)' }} strokeWidth={2.5} />
            </button>
            <button onClick={() => bumpWeek(+1)}
              className="tap w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background:'var(--fill-3)' }}>
              <ChevronRight size={18} style={{ color: week===12 ? 'var(--label-4)' : 'var(--accent)' }} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Next workout ── */}
        {next ? (
          <div className="fade-rise" style={{ animationDelay:'0.06s' }}>
            <p className="ios-section-label mb-2">Up Next</p>
            <Link href={`/workout/${week}/${next.key}`}>
              <div className="tap rounded-2xl overflow-hidden" style={{ background:'var(--bg-2)' }}>
                <div className="px-5 pt-5 pb-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: WC[next.key] }} />
                        <span className="t-caption2 sf-semibold" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.07em' }}>
                          Workout {next.key}
                        </span>
                      </div>
                      <h2 className="t-title1" style={{ color:'var(--label)' }}>{next.shortName}</h2>
                      <p className="t-subhead mt-1" style={{ color:'var(--label-2)', lineHeight:1.5 }}>{next.focus}</p>
                      <p className="t-footnote mt-3" style={{ color:'var(--label-3)' }}>
                        {next.exercises.length} exercises · {cfg.sets.primary} primary sets · RIR {cfg.rir}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 pb-4">
                  <button className="ios-btn" style={{ background: WC[next.key] }}>
                    Start Workout
                  </button>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="fade-rise rounded-2xl px-5 py-7 text-center" style={{ background:'var(--bg-2)' }}>
            <p style={{ fontSize:36, marginBottom:8 }}>🏆</p>
            <p className="t-headline sf-semibold" style={{ color:'var(--label)' }}>Week {week} Complete</p>
            <p className="t-subhead mt-1" style={{ color:'var(--label-2)' }}>All 4 workouts done</p>
          </div>
        )}

        {/* ── This week grid ── */}
        <div className="fade-rise" style={{ animationDelay:'0.09s' }}>
          <p className="ios-section-label mb-2">This Week</p>
          <div className="ios-group">
            {WORKOUTS.map((w, i) => {
              const isDone = done.includes(w.key)
              const c = WC[w.key]
              return (
                <Link key={w.key} href={`/workout/${week}/${w.key}`}>
                  <div className={`ios-row ${i===0?'ios-row-first':''}`}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-footnote sf-heavy"
                         style={{ background:`color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                      {w.key}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{w.shortName}</p>
                      <p className="t-caption1 mt-0.5" style={{ color:'var(--label-3)' }}>{w.exercises.length} exercises</p>
                    </div>
                    {isDone
                      ? <CheckCircle2 size={21} style={{ color:'var(--green)', flexShrink:0 }} />
                      : <ChevronRight size={17} style={{ color:'var(--label-4)', flexShrink:0 }} />}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Week note */}
        <div className="fade-rise rounded-2xl px-4 py-3.5" style={{ animationDelay:'0.12s', background:'var(--bg-2)' }}>
          <p className="t-footnote" style={{ color:'var(--label-2)', lineHeight:1.6 }}>{cfg.note}</p>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
