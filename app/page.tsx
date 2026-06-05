'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WEEK_CONFIG, PHASE_LABELS } from '@/lib/program/data'
import { getProgram } from '@/lib/program/programLibrary'
import { fetchSettings, updateSettings, fetchRecentSessions, fetchAllOneRms, fetchAllLoggedSets, fetchCoachPrefs, fetchCycleStats } from '@/lib/db'
import { detectDeloadReadiness, type CoachSet } from '@/lib/program/coach'
import CycleComplete from '@/components/CycleComplete'
import { Battery, Zap } from 'lucide-react'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }
const PC: Record<number,string>  = {
  1:'ph-1',2:'ph-1',3:'ph-1',4:'ph-d',
  5:'ph-2',6:'ph-2',7:'ph-2',8:'ph-d',
  9:'ph-3',10:'ph-3',11:'ph-3',12:'ph-d',
}

export default function Dashboard() {
  const router = useRouter()
  const [activeProgramId, setActiveProgramId] = useState<string>(() => {
    if (typeof window === 'undefined') return 'galpin-5day-hypertrophy'
    return localStorage.getItem('cg_program') ?? 'galpin-5day-hypertrophy'
  })

  const [week, setWeek] = useState<number>(() => {
    if (typeof window === 'undefined') return 1
    const cached = parseInt(localStorage.getItem('cg_week') ?? '1', 10)
    return isNaN(cached) ? 1 : cached
  })
  const [done,    setDone]    = useState<string[]>([])
  const [hasRms,  setHasRms]  = useState(true)
  const [ready,   setReady]   = useState(false)

  const [deloadReasons, setDeloadReasons] = useState<string[]>([])
  const [deloadDismissed, setDeloadDismissed] = useState(false)

  const [cycleNumber,     setCycleNumber]     = useState(1)
  const [weekStartedAt,   setWeekStartedAt]   = useState<string|null>(null)
  const [showCycleEnd,    setShowCycleEnd]    = useState(false)
  const [cycleStats,      setCycleStats]      = useState<any>(null)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{session} } = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      const [s, sessions, rms, allSets, cp] = await Promise.all([
        fetchSettings(), fetchRecentSessions(20), fetchAllOneRms(),
        fetchAllLoggedSets(), fetchCoachPrefs()
      ])
      setCycleNumber(s.cycle_number ?? 1)
      setWeekStartedAt(s.week_started_at ?? null)
      setWeek(s.current_week)
      // Only update localStorage once the DB has confirmed the real week.
      // Avoids caching the default '1' when user_settings row is missing.
      if (s.current_week > 1) {
        localStorage.setItem('cg_week', String(s.current_week))
      } else {
        // DB returned 1 — check if localStorage has a trusted higher value
        const cached = parseInt(localStorage.getItem('cg_week') ?? '0', 10)
        if (cached > 1) {
          // localStorage knows better — restore it to DB and use it
          setWeek(cached)
          updateSettings({ current_week: cached }).catch(console.error)
        }
      }
      setHasRms(rms.length > 0)
      // Auto-set week_started_at on first load if it's missing — ensures
      // ghost sessions from before this timestamp don't show as done
      let wsa = s.week_started_at
      if (!wsa) {
        wsa = new Date().toISOString()
        updateSettings({ week_started_at: wsa }).catch(console.error)
      }
      setWeekStartedAt(wsa)

      setDone((sessions as any[])
        .filter(x =>
          x.week_number === s.current_week &&
          x.completed_at &&
          // Exclude empty ghost sessions (created before lazy session fix)
          (x.logged_sets?.length ?? 0) > 0 &&
          // Exclude sessions started before the user moved to this week
          new Date(x.started_at) >= new Date(wsa)
        )
        .map((x:any) => x.workout_key))
      // Deload readiness — only surface if the user keeps the alert on
      if (cp.deloadAlerts) {
        const d = detectDeloadReadiness(allSets as unknown as CoachSet[])
        if (d.triggered) setDeloadReasons(d.reasons)
      }
    } catch(e) {
      console.error('Dashboard error:', e)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => { init() }, [init])



  const bumpWeek = async (d: number) => {
    // Advancing past Week 12 → trigger cycle complete
    if (d > 0 && week >= 12) {
      const stats = await fetchCycleStats(cycleNumber)
      setCycleStats(stats)
      setShowCycleEnd(true)
      return
    }
    const n = Math.max(1, Math.min(12, week + d))
    setWeek(n)
    localStorage.setItem('cg_week', String(n))
    setDone([])
    await updateSettings({ current_week: n, week_started_at: new Date().toISOString() })
    const nowStr = new Date().toISOString()
    setWeekStartedAt(nowStr)
    const sessions = await fetchRecentSessions(50)
    setDone((sessions as any[])
      .filter((x: any) =>
        x.week_number === n &&
        x.completed_at &&
        (x.logged_sets?.length ?? 0) > 0 &&
        new Date(x.started_at) >= new Date(nowStr)
      )
      .map((x: any) => x.workout_key))
  }

  const handleBeginNextCycle = async () => {
    const next = cycleNumber + 1
    setCycleNumber(next)
    setWeek(1)
    setDone([])
    setShowCycleEnd(false)
    localStorage.setItem('cg_week', '1')
    await updateSettings({ current_week: 1, cycle_number: next, week_started_at: new Date().toISOString() })
  }

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'var(--bg)' }}>
      <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin" style={{ borderColor:'var(--accent)' }} />
    </div>
  )

  const cfg  = WEEK_CONFIG[week]
  const activeProgram = getProgram(activeProgramId)
  const workouts = activeProgram.workouts
  const next = workouts.find(w => !w.isRest && !done.includes(w.key))

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* ── Header — branding + phase context ── */}
      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(8,8,14,0.97)', backdropFilter:'saturate(200%) blur(28px)', WebkitBackdropFilter:'saturate(200%) blur(28px)', borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
        {/* Phase progress strip — thin bar at very top showing week/12 */}
        <div style={{ height:2, background:'rgba(44,44,46,0.8)' }}>
          <div style={{ height:'100%', width:`${(week/12)*100}%`, background:'var(--accent)', borderRadius:0, transition:'width 0.4s ease' }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <div>
            <p className="t-caption2" style={{ color:'rgba(142,142,147,0.7)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:9 }}>Compound Gains</p>
            <h1 className="t-large-title sf-heavy" style={{ lineHeight:1.05, marginTop:1 }}>Lift</h1>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
              {cycleNumber > 1 && (
                <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,159,10,0.5)',
                  background:'rgba(255,159,10,0.1)', padding:'1px 6px', borderRadius:5 }}>
                  C{cycleNumber}
                </span>
              )}
              <span style={{ fontSize:13, fontWeight:800, color:'var(--accent)', letterSpacing:'-0.3px' }}>
                Week {week}
              </span>
              <span style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.5)' }}>/ 12</span>
            </div>
            <p style={{ fontSize:10, color:'#8E8E93', marginTop:1, letterSpacing:'0.02em' }}>
              {PHASE_LABELS[week]}
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-5 space-y-5">

        {/* ── 1RM prompt banner ── */}
        {!hasRms && (
          <Link href="/program">
            <div className="tap rounded-2xl px-4 py-4 flex items-center gap-3 fade-rise"
                 style={{ background:'color-mix(in srgb, var(--orange) 14%, var(--bg-2))', border:'0.5px solid color-mix(in srgb, var(--orange) 35%, transparent)' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background:'color-mix(in srgb, var(--orange) 20%, transparent)' }}>
                <Zap size={20} style={{ color:'var(--orange)' }} />
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

        {/* ── Deload alert (only when triggered) ── */}
        {deloadReasons.length > 0 && !deloadDismissed && (
          <div className="fade-rise" style={{ animationDelay:'0.04s', display:'flex', gap:12,
            padding:'14px 16px', borderRadius:16, background:'rgba(255,159,10,0.1)',
            border:'0.5px solid rgba(255,159,10,0.35)' }}>
            <div style={{ width:36, height:36, borderRadius:11, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(255,159,10,0.18)' }}>
              <Battery size={18} strokeWidth={2} style={{ color:'#FF9F0A' }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:10, fontWeight:800, color:'#FF9F0A', textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:3 }}>Recovery Signal</p>
              <p style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>
                Your body may need a deload
              </p>
              <p style={{ fontSize:13, color:'#8E8E93', lineHeight:1.45 }}>
                {deloadReasons.join(' · ')}.
              </p>
              <button onClick={()=>router.push('/insights')}
                style={{ marginTop:8, fontSize:13, fontWeight:700, color:'#FF9F0A',
                  background:'none', border:'none', padding:0, cursor:'pointer' }}>
                View details →
              </button>
            </div>
            <button onClick={()=>setDeloadDismissed(true)}
              style={{ alignSelf:'flex-start', fontSize:18, color:'#8E8E93',
                background:'none', border:'none', cursor:'pointer', lineHeight:1, padding:2 }}>
              ×
            </button>
          </div>
        )}

        {/* ── This week grid ── */}
        <div className="fade-rise" style={{ animationDelay:'0.09s' }}>
          <p className="ios-section-label mb-2">This Week</p>
          <div className="ios-group">
            {workouts.map((w, i) => {
              const isDone = done.includes(w.key)
              const c = WC[w.key] ?? '#636366'

              if (w.isRest) return (
                <div key={w.key} className={`ios-row ${i===0?'ios-row-first':''}`}
                     style={{ opacity:0.6, cursor:'default' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                       style={{ background:'rgba(99,99,102,0.15)' }}>
                    <span style={{ fontSize:16 }}>🌙</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="t-subhead sf-semibold" style={{ color:'var(--label-2)' }}>Rest · {w.day}</p>
                    <p className="t-caption1 mt-0.5" style={{ color:'var(--label-3)' }}>{w.focus}</p>
                  </div>
                </div>
              )

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
      {/* ── Cycle complete celebration ── */}
      {showCycleEnd && cycleStats && (
        <CycleComplete
          cycleNumber={cycleNumber}
          workoutsCompleted={cycleStats.workoutsCompleted}
          totalSets={cycleStats.totalSets}
          sets={cycleStats.sets}
          firstDate={cycleStats.firstDate}
          lastDate={cycleStats.lastDate}
          onBeginNextCycle={handleBeginNextCycle}
        />
      )}

      <BottomNav />
    </div>
  )
}
