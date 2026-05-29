'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession, logSet, getLastWeightForExercise } from '@/lib/db'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }
const REST: Record<string,number> = { primary:150, secondary:120, isolation:75 }

/* ── Weight Sheet ──────────────────────────────────────────── */
function WeightSheet({ ex, setNum, suggested, onSave, onClose }: {
  ex: Exercise; setNum: number; suggested: number
  onSave:(w:number,r:number)=>void; onClose:()=>void
}) {
  const [wt,   setWt]   = useState(suggested || 0)
  const [reps, setReps] = useState(10)
  const adj = (d:number) => setWt(w => Math.max(0, w + d))

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel px-5 pt-3" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-9 h-[5px] rounded-full mx-auto mb-6" style={{ background:'var(--fill)' }} />

        <p className="t-footnote sf-semibold mb-0.5" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>
          Set {setNum}
        </p>
        <p className="t-headline sf-semibold mb-6" style={{ color:'var(--label)' }}>{ex.name}</p>

        {/* Weight display */}
        <div className="text-center mb-5">
          <span style={{ fontSize:72, fontWeight:700, letterSpacing:'-2px', color:'var(--label)', fontVariantNumeric:'tabular-nums' }}>
            {wt}
          </span>
          <span className="t-title3" style={{ color:'var(--label-3)', marginLeft:6 }}>lbs</span>
        </div>

        {/* ± buttons */}
        <div className="grid grid-cols-4 gap-2.5 mb-6">
          {([-10,-5,+5,+10] as const).map(d => (
            <button key={d} onClick={() => adj(d)}
              className="tap t-headline sf-semibold h-14 rounded-2xl"
              style={{ background:'var(--bg-3)', color: d < 0 ? 'var(--label-2)' : 'var(--accent)' }}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Reps */}
        <p className="t-footnote sf-semibold mb-2" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Reps</p>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[5,6,8,10,12,15].map(r => (
            <button key={r} onClick={() => setReps(r)}
              className="tap h-11 rounded-xl t-callout sf-semibold"
              style={{ background: reps===r ? 'var(--accent)' : 'var(--bg-3)', color: reps===r ? '#fff' : 'var(--label-2)' }}>
              {r}
            </button>
          ))}
        </div>

        <button onClick={() => onSave(wt, reps)} className="ios-btn">
          <Check size={18} strokeWidth={2.5} /> Log Set {setNum}
        </button>
      </div>
    </div>
  )
}

/* ── Rest Timer Pill ───────────────────────────────────────── */
function RestPill({ seconds, onDone }: { seconds:number; onDone:()=>void }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    if (rem <= 0) { onDone(); return }
    const t = setTimeout(() => setRem(r => r-1), 1000)
    return () => clearTimeout(t)
  }, [rem, onDone])
  const m = Math.floor(rem/60), s = rem % 60
  return (
    <div className="rest-pill">
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" stroke="var(--bg-4)" />
          <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" strokeLinecap="round"
            style={{ stroke:'var(--accent)', strokeDasharray:`${2*Math.PI*13}`,
              strokeDashoffset:`${2*Math.PI*13*(1-(seconds-rem)/seconds)}`, transition:'stroke-dashoffset 1s linear' }} />
        </svg>
      </div>
      <span className="t-headline sf-semibold tabular-nums" style={{ color:'var(--label)' }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <span className="t-footnote" style={{ color:'var(--label-3)' }}>rest</span>
      <button onClick={onDone} className="tap t-footnote sf-semibold px-3 py-1.5 rounded-full" style={{ background:'var(--fill-3)', color:'var(--label-2)' }}>
        Skip
      </button>
    </div>
  )
}

/* ── Page ──────────────────────────────────────────────────── */
export default function WorkoutPage({ params }: { params: Promise<{week:string;day:string}> }) {
  const { week:ws, day } = use(params)
  const wk  = parseInt(ws)
  const key = day as WorkoutKey
  const router = useRouter()

  const workout = WORKOUTS.find(w => w.key===key)!
  const cfg     = WEEK_CONFIG[wk]
  const c       = WC[key]

  const [rms,   setRms]   = useState<Record<string,number>>({})
  const [lasts, setLasts] = useState<Record<string,number|null>>({})
  const [round, setRound] = useState(5)
  const [sid,   setSid]   = useState<string|null>(null)
  const [sets,  setSets]  = useState<Record<string,any[]>>({})
  const [open,  setOpen]  = useState<string>(workout.exercises[0]?.name ?? '')
  const [modal, setModal] = useState<{ex:Exercise;n:number;sug:number}|null>(null)
  const [rest,  setRest]  = useState<number|null>(null)
  const [done,  setDone]  = useState(false)

  const init = useCallback(async () => {
    const sb = createClient()
    const {data:{session}} = await sb.auth.getSession()
    if (!session) await sb.auth.signInAnonymously()
    const [r, s] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const rm: Record<string,number> = {}
    r.forEach((x:any) => { rm[x.exercise_name] = x.weight_lbs })
    setRms(rm); setRound(s.round_to_lbs)
    const lw: Record<string,number|null> = {}
    await Promise.all(workout.exercises.map(async ex => {
      if (!ex.isBodyweight) lw[ex.name] = await getLastWeightForExercise(ex.name)
    }))
    setLasts(lw)
    const sess = await createSession(wk, key)
    setSid(sess.id)
  }, [wk, key, workout.exercises])

  useEffect(() => { init() }, [init])

  const total   = workout.exercises.reduce((a,ex)=>a+getSetsForWeek(ex.type,wk),0)
  const logged  = Object.values(sets).reduce((a,s)=>a+s.length,0)
  const pct     = total > 0 ? logged/total : 0

  const sug = (ex: Exercise) => {
    if (ex.isBodyweight) return 0
    const t = getTargetWeight(rms[ex.name]??0, ex.type, wk, round)
    return t > 0 ? t : (lasts[ex.name] ?? 0)
  }

  const handleSave = async (weight:number, reps:number) => {
    if (!modal || !sid) return
    const {ex,n} = modal
    const row = await logSet(sid, ex.name, n, weight||null, reps)
    setSets(p => ({ ...p, [ex.name]: [...(p[ex.name]??[]), row] }))
    setModal(null)
    setRest(REST[ex.type])
    // Auto-advance to next incomplete exercise
    const nextEx = workout.exercises.find(e => {
      const needed = getSetsForWeek(e.type, wk)
      const have   = (sets[e.name]?.length ?? 0) + (e.name===ex.name ? 1 : 0)
      return have < needed
    })
    if (nextEx) setOpen(nextEx.name)
  }

  if (done) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-6" style={{ background:'var(--bg)' }}>
      <CheckCircle2 size={64} style={{ color:'var(--green)' }} strokeWidth={1.5} />
      <div className="text-center">
        <h2 className="t-title1 sf-bold" style={{ color:'var(--label)' }}>Workout Complete</h2>
        <p className="t-body mt-2" style={{ color:'var(--label-2)' }}>{logged} sets · Week {wk} · Workout {key}</p>
      </div>
      <button onClick={() => router.push('/')} className="ios-btn mt-2" style={{ background:c }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* Nav bar */}
      <div className="pt-safe sticky top-0 z-30"
        style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'saturate(180%) blur(24px)', WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'0.5px solid var(--sep)' }}>
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button onClick={() => router.back()} className="tap w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background:'var(--fill-3)' }}>
            <ChevronLeft size={17} style={{ color:'var(--accent)' }} strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="t-headline sf-semibold truncate" style={{ color:'var(--label)' }}>{workout.shortName}</p>
            <p className="t-caption1" style={{ color:'var(--label-3)', marginTop:1 }}>Week {wk} · Workout {key}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background:'var(--fill-3)' }}>
            <span className="t-subhead sf-semibold tabular-nums" style={{ color:c }}>{logged}</span>
            <span className="t-subhead" style={{ color:'var(--label-3)' }}>/ {total}</span>
          </div>
        </div>
        <div className="px-4 pb-3">
          <div className="overflow-hidden rounded-full" style={{ height:3, background:'var(--fill-3)' }}>
            <div style={{ height:'100%', borderRadius:9999, background:c, width:`${pct*100}%`, transition:'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 py-4 space-y-3">
        {workout.exercises.map((ex, idx) => {
          const exSets   = getSetsForWeek(ex.type, wk)
          const exReps   = getRepsForWeek(ex.type, wk)
          const exLogged = sets[ex.name] ?? []
          const isOpen   = open === ex.name
          const isComplete = exLogged.length >= exSets
          const target   = sug(ex)

          return (
            <div key={ex.name} className="ios-group" style={{ opacity: isComplete && !isOpen ? 0.5 : 1, transition:'opacity 0.25s' }}>

              {/* Header row */}
              <button className="w-full flex items-center gap-3 px-4 py-3.5 tap" onClick={() => setOpen(isOpen ? '' : ex.name)}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 t-footnote sf-heavy transition-all"
                     style={{ background: isComplete ? `color-mix(in srgb, var(--green) 18%, transparent)` : 'var(--bg-3)',
                              color:      isComplete ? 'var(--green)' : 'var(--label-3)' }}>
                  {isComplete ? '✓' : idx+1}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                  <p className="t-caption1" style={{ color:'var(--label-3)', marginTop:2 }}>
                    {ex.muscle}
                    {!ex.isBodyweight && target > 0 && <span style={{ color:c }}> · {target} lbs</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="t-subhead sf-semibold tabular-nums" style={{ color: isComplete ? 'var(--green)' : c }}>
                    {exLogged.length}/{exSets}
                  </span>
                  {isOpen
                    ? <ChevronLeft size={14} className="rotate-90" style={{ color:'var(--label-4)' }} />
                    : <ChevronRight size={14} style={{ color:'var(--label-4)' }} />}
                </div>
              </button>

              {/* Expanded */}
              {isOpen && (
                <>
                  {/* Form cue */}
                  <div className="mx-4 mb-3 px-3.5 py-2.5 rounded-xl" style={{ background:'var(--bg-3)' }}>
                    <div className="flex items-start gap-2">
                      <Info size={13} style={{ color:'var(--label-3)', flexShrink:0, marginTop:2 }} />
                      <p className="t-caption1" style={{ color:'var(--label-3)', lineHeight:1.6, fontStyle:'italic' }}>{ex.cue}</p>
                    </div>
                  </div>

                  {/* Set rows */}
                  <div className="px-4 pb-4 space-y-2">
                    {Array.from({length:exSets},(_,i)=>i+1).map(n => {
                      const l = exLogged.find((x:any) => x.set_number===n)
                      return (
                        <button key={n}
                          onClick={() => !l && setModal({ex, n, sug:sug(ex)})}
                          className="tap w-full flex items-center gap-3 px-4 rounded-2xl"
                          style={{ minHeight:52,
                            background: l ? `color-mix(in srgb, var(--green) 12%, var(--bg-3))` : 'var(--bg-3)',
                            border:`0.5px solid ${l ? 'rgba(48,209,88,0.3)' : 'var(--sep)'}` }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 t-caption1 sf-bold"
                               style={{ background: l ? 'var(--green)' : 'var(--fill)', color: l ? '#000' : 'var(--label-3)' }}>
                            {l ? '✓' : n}
                          </div>
                          {l ? (
                            <p className="flex-1 text-left t-subhead sf-semibold" style={{ color:'var(--label)' }}>
                              {l.weight_lbs ?? 'BW'} lbs
                              <span className="t-subhead" style={{ color:'var(--label-3)', fontWeight:400 }}> × {l.reps} reps</span>
                            </p>
                          ) : (
                            <p className="flex-1 text-left t-subhead" style={{ color:'var(--label-3)' }}>
                              {ex.isBodyweight ? 'Bodyweight' : target > 0 ? `${target} lbs suggested` : 'Tap to log'}
                            </p>
                          )}
                          <span className="t-caption2 flex-shrink-0" style={{ color:'var(--label-4)' }}>{exReps}</span>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          )
        })}

        {/* Complete button */}
        {logged >= total && (
          <button onClick={async () => { if(sid) await completeSession(sid); setDone(true) }}
            className="ios-btn mt-2 fade-rise" style={{ background:'var(--green)' }}>
            <CheckCircle2 size={18} strokeWidth={2.5} /> Complete Workout
          </button>
        )}
      </div>

      {modal && <WeightSheet ex={modal.ex} setNum={modal.n} suggested={modal.sug} onSave={handleSave} onClose={() => setModal(null)} />}
      {rest  && <RestPill seconds={rest} onDone={() => setRest(null)} />}
    </div>
  )
}
