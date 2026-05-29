'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getLastWeightForExercise, getRecentSetsForExercise, fetchEquipment } from '@/lib/db'
import { getRestSeconds, formatRestTime, fireRestCompleteNotification, requestNotificationPermission } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }

/* ── Weight Sheet ───────────────────────────────────────────────── */
function WeightSheet({ ex, setNum, suggested, smart, onSave, onClose }: {
  ex: Exercise; setNum: number; suggested: number; smart: SmartSuggestion | null
  onSave:(w:number,r:number)=>void; onClose:()=>void
}) {
  const [wt,   setWt]   = useState(suggested || 0)
  const [reps, setReps] = useState(10)
  const adj = (d:number) => setWt(w => Math.max(0, w + d))

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel px-5 pt-3" onClick={e => e.stopPropagation()}>
        <div className="w-9 h-[5px] rounded-full mx-auto mb-5" style={{ background:'var(--fill)' }} />
        <p className="t-caption2 sf-semibold mb-0.5" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>
          Set {setNum}
        </p>
        <p className="t-headline sf-semibold mb-4" style={{ color:'var(--label)' }}>{ex.name}</p>

        {/* Smart suggestion banner */}
        {smart && smart.direction !== 'maintain' && (
          <div className="rounded-xl px-3.5 py-2.5 mb-5 flex items-start gap-2"
               style={{ background: smart.direction==='up' ? 'rgba(48,209,88,0.12)' : 'rgba(255,159,10,0.12)' }}>
            <span style={{ fontSize:14, flexShrink:0 }}>{smart.direction==='up' ? '📈' : '📉'}</span>
            <p className="t-footnote" style={{ color: smart.direction==='up' ? 'var(--green)' : 'var(--orange)', lineHeight:1.5 }}>
              {smart.reason}
            </p>
          </div>
        )}

        {/* Weight */}
        <div className="text-center mb-5">
          <span style={{ fontSize:72, fontWeight:700, letterSpacing:'-2px', color:'var(--label)', fontVariantNumeric:'tabular-nums' }}>
            {wt}
          </span>
          <span className="t-title3" style={{ color:'var(--label-3)', marginLeft:6 }}>lbs</span>
        </div>

        {/* ± */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {([-10,-5,+5,+10] as const).map(d => (
            <button key={d} onClick={() => adj(d)}
              className="tap t-headline sf-semibold h-14 rounded-2xl"
              style={{ background:'var(--bg-3)', color: d < 0 ? 'var(--label-2)' : 'var(--accent)' }}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Reps */}
        <p className="t-caption2 sf-semibold mb-2" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Reps</p>
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

/* ── Rest Timer Pill ─────────────────────────────────────────────── */
function RestPill({ seconds, exName, onDone }: { seconds:number; exName:string; onDone:()=>void }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    if (rem <= 0) { fireRestCompleteNotification(exName); onDone(); return }
    const t = setTimeout(() => setRem(r => r-1), 1000)
    return () => clearTimeout(t)
  }, [rem, exName, onDone])
  const m = Math.floor(rem/60), s = rem % 60
  const pct = (rem / seconds) * 100
  return (
    <div className="rest-pill">
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg className="-rotate-90 w-full h-full" viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" stroke="var(--bg-4)" />
          <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" strokeLinecap="round"
            style={{ stroke:'var(--accent)', strokeDasharray:`${2*Math.PI*13}`,
              strokeDashoffset:`${2*Math.PI*13*(1-pct/100)}`, transition:'stroke-dashoffset 1s linear' }} />
        </svg>
      </div>
      <span className="t-subhead sf-semibold tabular-nums" style={{ color:'var(--label)' }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <span className="t-caption1" style={{ color:'var(--label-2)' }}>rest</span>
      <button onClick={onDone} className="tap t-caption2 sf-semibold px-3 py-1.5 rounded-full"
              style={{ background:'var(--fill-3)', color:'var(--label-2)' }}>Skip</button>
    </div>
  )
}

/* ── Alternatives Sheet ──────────────────────────────────────────── */
function AltsSheet({ exName, equipment, onSwap, onClose }: {
  exName: string; equipment: string[]
  onSwap:(name:string,cue:string)=>void; onClose:()=>void
}) {
  const alts  = EXERCISE_ALTS[exName] ?? {}
  const keys  = Object.keys(alts) as EquipmentKey[]
  const avail = keys.filter(k => equipment.includes(k))
  const other = keys.filter(k => !equipment.includes(k))

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel" onClick={e => e.stopPropagation()}
           style={{ maxHeight:'82vh', display:'flex', flexDirection:'column' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div>
            <p className="t-caption2 sf-semibold" style={{ color:'var(--label-3)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Alternatives</p>
            <p className="t-headline sf-semibold mt-0.5" style={{ color:'var(--label)' }}>{exName}</p>
          </div>
          <button onClick={onClose} className="tap w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background:'var(--fill-3)' }}>
            <X size={16} style={{ color:'var(--label-3)' }} />
          </button>
        </div>
        <div className="w-full h-px flex-shrink-0" style={{ background:'var(--sep)' }} />

        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {/* Available equipment first */}
          {avail.length > 0 && (
            <div>
              <p className="ios-section-label mb-2">Your Equipment</p>
              <div className="ios-group">
                {avail.flatMap((key, gi) =>
                  (alts[key] ?? []).map((alt, ai) => (
                    <button key={`${key}-${ai}`}
                      onClick={() => onSwap(alt.name, alt.cue)}
                      className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}>
                      <span className="t-caption1 w-6 flex-shrink-0">{EQUIPMENT_ICONS[key]}</span>
                      <div className="flex-1 text-left">
                        <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{alt.name}</p>
                        <p className="t-caption1 mt-0.5" style={{ color:'var(--label-3)', fontStyle:'italic' }}>{alt.cue}</p>
                      </div>
                      <ChevronRight size={15} style={{ color:'var(--label-4)', flexShrink:0 }} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Other equipment */}
          {other.length > 0 && (
            <div>
              <p className="ios-section-label mb-2">Other Options</p>
              <div className="ios-group">
                {other.flatMap((key, gi) =>
                  (alts[key] ?? []).map((alt, ai) => (
                    <button key={`${key}-${ai}`}
                      onClick={() => onSwap(alt.name, alt.cue)}
                      className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}
                      style={{ opacity:0.65 }}>
                      <span className="t-caption1 w-6 flex-shrink-0">{EQUIPMENT_ICONS[key]}</span>
                      <div className="flex-1 text-left">
                        <p className="t-subhead" style={{ color:'var(--label)' }}>{alt.name}</p>
                        <p className="t-caption2 mt-0.5" style={{ color:'var(--label-4)', fontStyle:'italic' }}>{alt.cue}</p>
                      </div>
                      <ChevronRight size={15} style={{ color:'var(--label-4)', flexShrink:0 }} />
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <button onClick={onClose} className="tap t-subhead sf-semibold w-full py-3.5 rounded-2xl"
                  style={{ background:'var(--fill-3)', color:'var(--label-2)' }}>
            Keep Original
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function WorkoutPage({ params }: { params: Promise<{week:string;day:string}> }) {
  const { week:ws, day } = use(params)
  const wk  = parseInt(ws)
  const key = day as WorkoutKey
  const router = useRouter()

  const workout = WORKOUTS.find(w => w.key===key)!
  const cfg     = WEEK_CONFIG[wk]
  const c       = WC[key]

  const [rms,       setRms]       = useState<Record<string,number>>({})
  const [round,     setRound]     = useState(5)
  const [equipment, setEquipment] = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [sid,       setSid]       = useState<string|null>(null)
  const [sets,      setSets]      = useState<Record<string,any[]>>({})
  const [open,      setOpen]      = useState<string>(workout.exercises[0]?.name ?? '')
  const [swapped,   setSwapped]   = useState<Record<string,{name:string;cue:string}>>({})
  const [smartMap,  setSmartMap]  = useState<Record<string, SmartSuggestion|null>>({})
  const [modal,     setModal]     = useState<{ex:Exercise;n:number;sug:number}|null>(null)
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;exName:string}|null>(null)
  const [done,      setDone]      = useState(false)

  const init = useCallback(async () => {
    const sb = createClient()
    const {data:{session}} = await sb.auth.getSession()
    if (!session) await sb.auth.signInAnonymously()
    await requestNotificationPermission()

    const [rmArr, settings, equip] = await Promise.all([fetchAllOneRms(), fetchSettings(), fetchEquipment()])
    const rm: Record<string,number> = {}
    rmArr.forEach((x:any) => { rm[x.exercise_name] = x.weight_lbs })
    setRms(rm); setRound(settings.round_to_lbs); setEquipment(equip)

    // Pre-load smart suggestions for all exercises
    const smart: Record<string, SmartSuggestion|null> = {}
    await Promise.all(workout.exercises.map(async ex => {
      if (ex.isBodyweight) { smart[ex.name] = null; return }
      const recent = await getRecentSetsForExercise(ex.name, 15)
      smart[ex.name] = calculateSmartSuggestion(recent, ex.type, wk, rm[ex.name]??0, settings.round_to_lbs)
    }))
    setSmartMap(smart)

    const sess = await createSession(wk, key)
    setSid(sess.id)
  }, [wk, key, workout.exercises])

  useEffect(() => { init() }, [init])

  const total  = workout.exercises.reduce((a,ex)=>a+getSetsForWeek(ex.type,wk),0)
  const logged = Object.values(sets).reduce((a,s)=>a+s.length,0)
  const pct    = total > 0 ? logged/total : 0

  /** Effective exercise for display (may be swapped) */
  const effective = (ex: Exercise): Exercise => {
    const sw = swapped[ex.name]
    return sw ? { ...ex, name: sw.name, cue: sw.cue } : ex
  }

  /** Suggested weight: smart > 1RM-based > last weight */
  const sugWeight = (ex: Exercise): number => {
    if (ex.isBodyweight) return 0
    const sm = smartMap[ex.name]
    if (sm) return sm.weight
    const t = getTargetWeight(rms[ex.name]??0, ex.type, wk, round)
    return t > 0 ? t : 0
  }

  const handleSave = async (weight:number, reps:number) => {
    if (!modal || !sid) return
    const orig = modal.ex
    const effName = swapped[orig.name]?.name ?? orig.name
    const row = await logSet(sid, effName, modal.n, weight||null, reps)
    setSets(p => ({ ...p, [orig.name]: [...(p[orig.name]??[]), row] }))
    setModal(null)

    // Phase-appropriate rest time
    const restSec = getRestSeconds(wk, orig.type)
    setRest({ sec: restSec, exName: effName })

    // Auto-advance to next exercise
    const nextEx = workout.exercises.find(e => {
      const need = getSetsForWeek(e.type, wk)
      const have = (sets[e.name]?.length ?? 0) + (e.name===orig.name ? 1 : 0)
      return have < need
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

      {/* Nav */}
      <div className="pt-safe sticky top-0 z-30"
        style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'saturate(180%) blur(24px)', WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'0.5px solid var(--sep)' }}>
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button onClick={() => router.back()} className="tap w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background:'var(--fill-3)' }}>
            <ChevronLeft size={17} style={{ color:'var(--accent)' }} strokeWidth={2.5} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="t-headline sf-semibold truncate" style={{ color:'var(--label)' }}>{workout.shortName}</p>
            <p className="t-caption1 mt-0.5" style={{ color:'var(--label-2)' }}>
              Week {wk} · RIR {cfg.rir} · Rest {formatRestTime(getRestSeconds(wk,'primary'))} / {formatRestTime(getRestSeconds(wk,'isolation'))}
            </p>
          </div>
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-full" style={{ background:'var(--fill-3)' }}>
            <span className="t-subhead sf-semibold tabular-nums" style={{ color:c }}>{logged}</span>
            <span className="t-caption1" style={{ color:'var(--label-2)' }}>/{total}</span>
          </div>
        </div>
        <div className="px-4 pb-2.5">
          <div className="overflow-hidden rounded-full" style={{ height:3, background:'var(--fill-3)' }}>
            <div style={{ height:'100%', borderRadius:9999, background:c, width:`${pct*100}%`, transition:'width 0.4s ease' }} />
          </div>
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 py-4 space-y-3">
        {workout.exercises.map((origEx, idx) => {
          const ex       = effective(origEx)
          const isSwap   = !!swapped[origEx.name]
          const exSets   = getSetsForWeek(origEx.type, wk)
          const exReps   = getRepsForWeek(origEx.type, wk)
          const exLogged = sets[origEx.name] ?? []
          const isOpen   = open === origEx.name
          const isComp   = exLogged.length >= exSets
          const target   = sugWeight(origEx)
          const smart    = smartMap[origEx.name]
          const hasSmartBump = smart && smart.direction !== 'maintain'

          return (
            <div key={origEx.name} className="ios-group"
                 style={{ opacity: isComp && !isOpen ? 0.5 : 1, transition:'opacity 0.25s' }}>

              {/* Header */}
              <button className="w-full flex items-center gap-3 px-4 py-3.5 tap"
                      onClick={() => setOpen(isOpen ? '' : origEx.name)}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 t-footnote sf-heavy"
                     style={{ background: isComp ? 'rgba(48,209,88,0.15)' : 'var(--bg-3)',
                              color:      isComp ? 'var(--green)'         : 'var(--label-2)' }}>
                  {isComp ? '✓' : idx+1}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center gap-1.5">
                    <p className="t-subhead sf-semibold truncate" style={{ color:'var(--label)' }}>{ex.name}</p>
                    {isSwap && <span className="t-caption2 px-1.5 py-0.5 rounded" style={{ background:'rgba(10,132,255,0.15)', color:'var(--blue)', flexShrink:0 }}>swapped</span>}
                  </div>
                  <p className="t-caption1 mt-0.5" style={{ color:'var(--label-2)' }}>
                    {origEx.muscle}
                    {!origEx.isBodyweight && target > 0 && (
                      <span style={{ color: hasSmartBump ? (smart!.direction==='up' ? 'var(--green)' : 'var(--orange)') : c }}>
                        {' · '}{target} lbs{hasSmartBump ? (smart!.direction==='up' ? ' ↑' : ' ↓') : ''}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="t-subhead sf-semibold tabular-nums"
                        style={{ color: isComp ? 'var(--green)' : 'var(--label)' }}>
                    {exLogged.length}/{exSets}
                  </span>
                  {isOpen ? <ChevronLeft size={14} className="rotate-90" style={{ color:'var(--label-4)' }} />
                           : <ChevronRight size={14} style={{ color:'var(--label-4)' }} />}
                </div>
              </button>

              {/* Expanded */}
              {isOpen && (
                <>
                  {/* Cue + swap row */}
                  <div className="flex items-start gap-2 mx-4 mb-2.5 px-3.5 py-2.5 rounded-xl"
                       style={{ background:'var(--bg-3)' }}>
                    <p className="t-caption1 flex-1" style={{ color:'var(--label-2)', lineHeight:1.6, fontStyle:'italic' }}>
                      {ex.cue}
                    </p>
                    {EXERCISE_ALTS[origEx.name] && (
                      <button onClick={() => setAltsFor(origEx.name)}
                        className="tap flex items-center gap-1 px-2.5 py-1 rounded-lg flex-shrink-0"
                        style={{ background:'var(--fill-3)', color:'var(--blue)' }}>
                        <ArrowLeftRight size={12} />
                        <span className="t-caption2 sf-semibold">Alt</span>
                      </button>
                    )}
                  </div>

                  {/* Smart suggestion detail */}
                  {smart && hasSmartBump && (
                    <div className="mx-4 mb-2.5 px-3.5 py-2.5 rounded-xl flex items-start gap-2"
                         style={{ background: smart.direction==='up' ? 'rgba(48,209,88,0.1)' : 'rgba(255,159,10,0.1)' }}>
                      <span style={{ fontSize:13 }}>{smart.direction==='up' ? '📈' : '📉'}</span>
                      <div>
                        <p className="t-caption1 sf-semibold" style={{ color: smart.direction==='up' ? 'var(--green)' : 'var(--orange)' }}>
                          Smart Suggestion: {smart.weight} lbs
                        </p>
                        <p className="t-caption2 mt-0.5" style={{ color:'var(--label-3)', lineHeight:1.5 }}>
                          {smart.reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Set rows */}
                  <div className="px-4 pb-4 space-y-2">
                    {Array.from({length:exSets},(_,i)=>i+1).map(n => {
                      const l = exLogged.find((x:any) => x.set_number===n)
                      return (
                        <button key={n}
                          onClick={() => !l && setModal({ex:origEx, n, sug:target})}
                          className="tap w-full flex items-center gap-3 px-4 rounded-2xl"
                          style={{ minHeight:52,
                            background: l ? 'rgba(48,209,88,0.1)' : 'var(--bg-3)',
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
                            <p className="flex-1 text-left t-subhead" style={{ color:'var(--label-2)' }}>
                              {origEx.isBodyweight ? 'Bodyweight' : target > 0 ? `${target} lbs` : 'Tap to log'}
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

        {/* Finish */}
        {logged >= total && (
          <button onClick={async () => { if(sid) await completeSession(sid); setDone(true) }}
            className="ios-btn mt-2 fade-rise" style={{ background:'var(--green)' }}>
            <CheckCircle2 size={18} strokeWidth={2.5} /> Complete Workout
          </button>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <WeightSheet
          ex={effective(modal.ex)} setNum={modal.n} suggested={modal.sug}
          smart={smartMap[modal.ex.name] ?? null}
          onSave={handleSave} onClose={() => setModal(null)}
        />
      )}
      {rest && <RestPill seconds={rest.sec} exName={rest.exName} onDone={() => setRest(null)} />}
      {altsFor && (
        <AltsSheet
          exName={altsFor} equipment={equipment}
          onSwap={(name, cue) => { setSwapped(p => ({...p, [altsFor]: {name, cue}})); setAltsFor(null) }}
          onClose={() => setAltsFor(null)}
        />
      )}
    </div>
  )
}
