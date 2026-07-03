'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, CheckCircle2, ArrowRight, RotateCcw } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WEEK_CONFIG, PHASE_LABELS } from '@/lib/program/data'
import { getProgram, getWeekConfig } from '@/lib/program/programLibrary'
import { fetchSettings, updateSettings, fetchRecentSessions, fetchAllOneRms, fetchAllLoggedSets, fetchCoachPrefs, fetchCycleStats, upsertOneRm } from '@/lib/db'
import { detectDeloadReadiness, type CoachSet } from '@/lib/program/coach'
import { recommendReintro, reintroActive, reintroDaysLeft, startReintroPatch, type ReintroPlan } from '@/lib/program/reintro'
import { loggedDerivedOneRm, isLoadableBodyweight, withBodyweight } from '@/lib/program/smartSuggestions'
import CycleComplete from '@/components/CycleComplete'
import { Battery, Zap } from 'lucide-react'

const WC: Record<string,string> = { A:'#17BEBB', B:'#2DD4A0', C:'#A885F2', D:'#FFB23E', E:'#F25C54' }
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
  const [now,             setNow]             = useState<Date | null>(null)
  const [reintroPlan,     setReintroPlan]     = useState<ReintroPlan | null>(null)  // prompt
  const [reintroOn,       setReintroOn]       = useState(false)                     // active banner
  const [reintroLeft,     setReintroLeft]     = useState(0)
  const [reintroLoad,     setReintroLoad]     = useState(0.88)
  const [lastWorkoutDate, setLastWorkoutDate] = useState<string | null>(null)
  useEffect(() => { setNow(new Date()) }, [])

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

      // ── Returning from a break: detect a training layoff ──
      const lastSet = (allSets as any[]).length ? (allSets as any[])[(allSets as any[]).length - 1] : null
      const lastDate = lastSet?.completed_at ?? null
      setLastWorkoutDate(lastDate)
      if (reintroActive(s)) {
        setReintroOn(true)
        setReintroLeft(reintroDaysLeft(s))
        setReintroLoad(s.reintro_load_pct ?? 0.88)
      } else if (lastDate) {
        const daysAway = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86_400_000)
        const plan = recommendReintro(daysAway)
        const dismissed = localStorage.getItem('cg_reintro_dismissed') === lastDate
        if (plan && !dismissed) setReintroPlan(plan)
      }
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
    // New cycle, new training maxes: re-baseline each lift from the cycle it
    // just finished, using the same logged-derived estimate the engine uses.
    try {
      const __bw = (await fetchSettings()).body_weight_lbs ?? 0
      const sets = (cycleStats?.sets ?? []) as any[]
      const byEx: Record<string, any[]> = {}
      sets.filter(s => s.weight_lbs > 0 && s.reps > 0).forEach(s => { (byEx[s.exercise_name] ??= []).push(s) })
      for (const [name, arr] of Object.entries(byEx)) {
        if (arr.length < 3) continue
        arr.sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1))  // most recent first
        // Weighted dips/pull-ups: TM is total system weight (body + belt)
        const basis = arr.slice(0, 15)
        const tm = loggedDerivedOneRm((isLoadableBodyweight(name) && __bw > 0) ? withBodyweight(basis, __bw) : basis)
        if (tm > 0) await upsertOneRm(name, tm)
      }
    } catch (e) { console.error('cycle re-baseline:', e) }
    setCycleNumber(next)
    setWeek(1)
    setDone([])
    setShowCycleEnd(false)
    localStorage.setItem('cg_week', '1')
    await updateSettings({ current_week: 1, cycle_number: next, week_started_at: new Date().toISOString() })
  }

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'transparent' }}>
      <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin" style={{ borderColor:'var(--accent)' }} />
    </div>
  )

  const activeProgram = getProgram(activeProgramId)
  const workouts = activeProgram.workouts
  const next = workouts.find(w => !w.isRest && !done.includes(w.key))
  const cfg  = getWeekConfig(activeProgramId, week, next?.dayType)

  const hour = now?.getHours() ?? 8
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dateLine = now ? now.toLocaleDateString(undefined, { weekday:'long', month:'long', day:'numeric' }) : '\u00A0'

  const startReintro = async (plan: ReintroPlan) => {
    const patch = startReintroPatch(plan)
    setReintroPlan(null); setReintroOn(true); setReintroLeft(plan.windowDays); setReintroLoad(plan.loadPct)
    try { await updateSettings(patch) } catch (e) { console.error('startReintro:', e) }
  }
  const dismissReintro = () => {
    if (lastWorkoutDate) localStorage.setItem('cg_reintro_dismissed', lastWorkoutDate)
    setReintroPlan(null)
  }
  const endReintro = async () => {
    setReintroOn(false)
    try { await updateSettings({ reintro_until: new Date(Date.now() - 1000).toISOString() }) } catch (e) { console.error('endReintro:', e) }
  }

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'transparent' }}>

      {/* ── Header — branding + phase context ── */}
      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(6,24,32,0.82)', backdropFilter:'saturate(200%) blur(28px)', WebkitBackdropFilter:'saturate(200%) blur(28px)', borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
        {/* Phase progress strip — thin bar at very top showing week/12 */}
        <div style={{ height:2, background:'rgba(11,42,51,0.7)' }}>
          <div className="liquid-fill" style={{ height:'100%', width:`${(week/12)*100}%`, background:'var(--accent)', borderRadius:0, transition:'width 0.6s var(--ease-liquid)' }} />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 pt-2">
          <div>
            <p className="t-caption2" style={{ color:'rgba(142,142,147,0.7)', textTransform:'uppercase', letterSpacing:'0.1em', fontSize:9 }}>Compound Gains</p>
            <h1 className="t-large-title sf-heavy" style={{ lineHeight:1.05, marginTop:1 }}>Lift</h1>
          </div>
          <div style={{ textAlign:'right' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
              {cycleNumber > 1 && (
                <span style={{ fontSize:9, fontWeight:700, color:'rgba(255,178,62,0.5)',
                  background:'rgba(255,178,62,0.1)', padding:'1px 6px', borderRadius:5 }}>
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

        {/* ── Greeting ── */}
        <div className="fade-rise">
          <p style={{ fontSize:15, color:'var(--label-3)', letterSpacing:'0.01em' }}>{greeting}</p>
          <h1 className="sf-heavy" style={{ fontSize:30, lineHeight:1.1, color:'var(--label)', marginTop:1, letterSpacing:'-0.4px' }}>
            {dateLine}
          </h1>
        </div>

        {/* ── Returning from a break: prompt ── */}
        {reintroPlan && !reintroOn && (
          <div className="fade-rise" style={{ borderRadius:20, overflow:'hidden',
            background:'linear-gradient(150deg, color-mix(in srgb, var(--blue) 32%, #04161E), color-mix(in srgb, var(--green) 14%, #0B2A33) 70%, #0B2A33)',
            border:'0.5px solid color-mix(in srgb, var(--blue) 35%, transparent)' }}>
            <div style={{ padding:'18px 18px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <RotateCcw size={16} style={{ color:'var(--teal)' }} strokeWidth={2.4} />
                <p style={{ fontSize:12, fontWeight:800, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'0.1em' }}>Welcome back</p>
              </div>
              <p style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.4px' }}>
                You&rsquo;ve been away ~{reintroPlan.label.replace(' off','')}
              </p>
              <p style={{ fontSize:13.5, color:'rgba(239,250,248,0.8)', lineHeight:1.5, marginTop:6 }}>{reintroPlan.blurb}</p>
              <p style={{ fontSize:12.5, color:'rgba(239,250,248,0.62)', lineHeight:1.5, marginTop:8 }}>
                Ease back in at <b style={{ color:'#fff' }}>~{Math.round(reintroPlan.loadPct*100)}% load</b>, <b style={{ color:'#fff' }}>{Math.round(reintroPlan.volumePct*100)}% volume</b>, RIR {reintroPlan.rirCap}+ for {reintroPlan.windowDays} days. Your 1RM and progression stay put.
              </p>
              <div style={{ display:'flex', gap:8, marginTop:14 }}>
                <button onClick={()=>startReintro(reintroPlan)} style={{ flex:1, height:46, borderRadius:13,
                  background:'#fff', color:'#04161E', fontWeight:700, fontSize:15 }}>
                  Start ramp-back
                </button>
                <button onClick={dismissReintro} style={{ padding:'0 18px', height:46, borderRadius:13,
                  background:'rgba(255,255,255,0.1)', color:'rgba(239,250,248,0.85)', fontWeight:600, fontSize:15,
                  border:'0.5px solid rgba(255,255,255,0.16)' }}>
                  Not now
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Returning from a break: active banner ── */}
        {reintroOn && (
          <div className="fade-rise" style={{ borderRadius:16, padding:'13px 16px', display:'flex', alignItems:'center', gap:12,
            background:'color-mix(in srgb, var(--blue) 12%, #0B2A33)', border:'0.5px solid color-mix(in srgb, var(--blue) 32%, transparent)' }}>
            <RotateCcw size={18} style={{ color:'var(--teal)', flexShrink:0 }} strokeWidth={2.2} />
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:13.5, fontWeight:700, color:'#fff' }}>Reintroduction active{reintroLeft>0?` · ${reintroLeft} day${reintroLeft>1?'s':''} left`:''}</p>
              <p style={{ fontSize:12, color:'rgba(239,250,248,0.6)', marginTop:1 }}>Loads ~{Math.round(reintroLoad*100)}%, RIR 3+, full ROM. Suggestions stay protected.</p>
            </div>
            <button onClick={endReintro} style={{ flexShrink:0, padding:'6px 12px', borderRadius:999, fontSize:12, fontWeight:700,
              color:'var(--teal)', background:'color-mix(in srgb, var(--blue) 18%, transparent)', border:'0.5px solid color-mix(in srgb, var(--blue) 35%, transparent)' }}>
              End
            </button>
          </div>
        )}

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

        {/* ── Next workout — hero ── */}
        {next ? (
          <div className="fade-rise" style={{ animationDelay:'0.06s' }}>
            <Link href={`/workout/${week}/${next.key}`}>
              <div className="tap" style={{
                position:'relative', overflow:'hidden', borderRadius:24, minHeight:300,
                display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:22,
                background:`linear-gradient(157deg, color-mix(in srgb, ${WC[next.key]} 44%, #04161E) 0%, color-mix(in srgb, ${WC[next.key]} 15%, #0B2A33) 46%, #0B2A33 100%)`,
                border:`0.5px solid color-mix(in srgb, ${WC[next.key]} 30%, transparent)`,
                boxShadow:`0 16px 44px -16px color-mix(in srgb, ${WC[next.key]} 55%, transparent)`,
              }}>
                {/* radial glow */}
                <div aria-hidden style={{ position:'absolute', top:'-28%', right:'-18%', width:'72%', height:'72%',
                  background:`radial-gradient(circle, color-mix(in srgb, ${WC[next.key]} 50%, transparent) 0%, transparent 70%)`, pointerEvents:'none' }} />
                {/* jersey-number watermark */}
                <div aria-hidden style={{ position:'absolute', top:-44, right:-12, fontSize:230, fontWeight:800, lineHeight:1,
                  color:`color-mix(in srgb, ${WC[next.key]} 24%, transparent)`, letterSpacing:'-0.06em', pointerEvents:'none', userSelect:'none' }}>
                  {next.key}
                </div>

                {/* content */}
                <div style={{ position:'relative' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span style={{ fontSize:11, fontWeight:800, letterSpacing:'0.12em', textTransform:'uppercase', color:'#04161E',
                      background:`color-mix(in srgb, ${WC[next.key]} 80%, #fff)`, padding:'3px 9px', borderRadius:999 }}>
                      Up Next
                    </span>
                    <span style={{ fontSize:11, fontWeight:600, letterSpacing:'0.07em', textTransform:'uppercase', color:'rgba(239,250,248,0.72)' }}>
                      Workout {next.key} · Week {week}
                    </span>
                  </div>
                  <h2 className="sf-heavy" style={{ fontSize:34, lineHeight:1.04, color:'#fff', letterSpacing:'-0.6px' }}>{next.shortName}</h2>
                  <p style={{ fontSize:15, color:'rgba(239,250,248,0.85)', marginTop:6, lineHeight:1.4 }}>{next.focus}</p>

                  {/* meta chips */}
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:14 }}>
                    {[`${next.exercises.length} exercises`, `${cfg.sets.primary} primary sets`, `RIR ${cfg.rir}`, next.duration]
                      .filter(Boolean).map((m, i) => (
                      <span key={i} style={{ fontSize:12, fontWeight:600, color:'rgba(239,250,248,0.95)',
                        background:'rgba(255,255,255,0.13)', padding:'5px 10px', borderRadius:999, border:'0.5px solid rgba(255,255,255,0.16)' }}>{m}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{ marginTop:18, display:'flex', alignItems:'center', justifyContent:'center', gap:7,
                    background:'#fff', color:'#04161E', borderRadius:14, padding:13, fontWeight:700, fontSize:16 }}>
                    Start Workout <ArrowRight size={18} strokeWidth={2.5} />
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="fade-rise rounded-2xl px-5 py-7 text-center" style={{ background:'var(--bg-2)' }}>
            <p style={{ fontSize:36, marginBottom:8 }}>🏆</p>
            <p className="t-headline sf-semibold" style={{ color:'var(--label)' }}>Week {week} Complete</p>
            <p className="t-subhead mt-1" style={{ color:'var(--label-2)' }}>Every session done — recover well</p>
          </div>
        )}

        {/* ── Deload alert (only when triggered) ── */}
        {deloadReasons.length > 0 && !deloadDismissed && (
          <div className="fade-rise" style={{ animationDelay:'0.04s', display:'flex', gap:12,
            padding:'14px 16px', borderRadius:16, background:'rgba(255,178,62,0.1)',
            border:'0.5px solid rgba(255,178,62,0.35)' }}>
            <div style={{ width:36, height:36, borderRadius:11, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              background:'rgba(255,178,62,0.18)' }}>
              <Battery size={18} strokeWidth={2} style={{ color:'#FFB23E' }} />
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:10, fontWeight:800, color:'#FFB23E', textTransform:'uppercase',
                letterSpacing:'0.08em', marginBottom:3 }}>Recovery Signal</p>
              <p style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:2 }}>
                Your body may need a deload
              </p>
              <p style={{ fontSize:13, color:'#8E8E93', lineHeight:1.45 }}>
                {deloadReasons.join(' · ')}.
              </p>
              <button onClick={()=>router.push('/insights')}
                style={{ marginTop:8, fontSize:13, fontWeight:700, color:'#FFB23E',
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
