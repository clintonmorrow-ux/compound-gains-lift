'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ChevronDown, ChevronUp, Check, Info } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession, logSet, getLastWeightForExercise } from '@/lib/db'
import type { Exercise, WorkoutKey } from '@/types'

const WKT_COLOR = { A:'--a', B:'--b', C:'--c', D:'--d' } as const
const REST_SECS  = { primary: 150, secondary: 120, isolation: 75 }

// ── Weight Entry Sheet ──────────────────────────────────────────────────
function WeightSheet({ exercise, setNum, suggested, onSave, onClose }: {
  exercise: Exercise; setNum: number; suggested: number
  onSave: (w: number, r: number) => void; onClose: () => void
}) {
  const [weight, setWeight] = useState(suggested || 0)
  const [reps,   setReps]   = useState(10)
  const adj = (d: number) => setWeight(w => Math.max(0, +(w + d).toFixed(1)))

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet px-5 pt-3" onClick={e => e.stopPropagation()}>
        {/* Handle */}
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background:'var(--border-md)' }} />

        <p className="label mb-0.5">Set {setNum}</p>
        <p className="text-[18px] font-bold mb-6" style={{ color:'var(--text)' }}>{exercise.name}</p>

        {/* Weight display */}
        <div className="text-center mb-5">
          <span className="text-[72px] font-black leading-none tabular-nums"
                style={{ color:'var(--text)', fontVariantNumeric:'tabular-nums' }}>
            {weight}
          </span>
          <span className="text-[20px] ml-2 font-medium" style={{ color:'var(--text-2)' }}>lbs</span>
        </div>

        {/* Adjust buttons */}
        <div className="grid grid-cols-4 gap-2.5 mb-5">
          {([-10,-5,+5,+10] as const).map(d => (
            <button key={d} onClick={() => adj(d)}
              className="pressable h-14 rounded-2xl text-[15px] font-bold"
              style={{ background:'var(--surface-3)', color: d > 0 ? 'var(--accent)' : 'var(--text-2)' }}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Reps */}
        <p className="label mb-2">Reps</p>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[5,6,8,10,12,15].map(r => (
            <button key={r} onClick={() => setReps(r)}
              className="pressable h-12 rounded-xl text-[14px] font-bold transition-colors"
              style={{
                background: reps===r ? 'var(--accent)'    : 'var(--surface-3)',
                color:       reps===r ? '#fff'             : 'var(--text-2)',
              }}>
              {r}
            </button>
          ))}
        </div>

        <button onClick={() => onSave(weight, reps)}
          className="btn-primary flex items-center justify-center gap-2">
          <Check size={18} />
          Log Set {setNum}
        </button>
      </div>
    </div>
  )
}

// ── Rest Timer ──────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    if (rem <= 0) { onDone(); return }
    const t = setTimeout(() => setRem(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [rem, onDone])
  const pct = (rem / seconds) * 100
  const m = Math.floor(rem / 60), s = rem % 60

  return (
    <div className="fixed bottom-24 inset-x-4 z-40 card px-5 py-4 flex items-center gap-4"
         style={{ background:'var(--surface-2)' }}>
      {/* Circle */}
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" stroke="var(--surface-3)" />
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            style={{ stroke:'var(--accent)',
              strokeDasharray:`${2*Math.PI*18}`,
              strokeDashoffset:`${2*Math.PI*18*(1-pct/100)}`,
              transition:'stroke-dashoffset 1s linear' }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[10px] font-bold" style={{ color:'var(--accent)' }}>
            {m}:{String(s).padStart(2,'0')}
          </span>
        </div>
      </div>
      <div className="flex-1">
        <p className="text-[11px] font-semibold" style={{ color:'var(--text-2)' }}>Rest</p>
        <p className="text-[17px] font-black tabular-nums" style={{ color:'var(--text)' }}>
          {m}:{String(s).padStart(2,'0')}
        </p>
      </div>
      <button onClick={onDone}
        className="pressable px-4 h-9 rounded-xl text-[13px] font-semibold"
        style={{ background:'var(--surface-3)', color:'var(--text-2)' }}>
        Skip
      </button>
    </div>
  )
}

// ── Main Page ───────────────────────────────────────────────────────────
export default function WorkoutPage({ params }: { params: Promise<{ week:string; day:string }> }) {
  const { week: ws, day } = use(params)
  const weekNum    = parseInt(ws)
  const workoutKey = day as WorkoutKey
  const router     = useRouter()

  const workout = WORKOUTS.find(w => w.key === workoutKey)!
  const cfg     = WEEK_CONFIG[weekNum]
  const cvar    = `var(${WKT_COLOR[workoutKey]})`

  const [oneRms,      setOneRms]      = useState<Record<string,number>>({})
  const [lastWeights, setLastWeights] = useState<Record<string,number|null>>({})
  const [roundTo,     setRoundTo]     = useState(5)
  const [sessionId,   setSessionId]   = useState<string|null>(null)
  const [sets,        setSets]        = useState<Record<string,any[]>>({})
  const [expanded,    setExpanded]    = useState<string>(workout.exercises[0]?.name ?? '')
  const [showCue,     setShowCue]     = useState<string|null>(null)
  const [modal,       setModal]       = useState<{exercise:Exercise;setNum:number;suggested:number}|null>(null)
  const [rest,        setRest]        = useState<{seconds:number}|null>(null)
  const [finished,    setFinished]    = useState(false)

  const init = useCallback(async () => {
    const sb = createClient()
    const { data:{session} } = await sb.auth.getSession()
    if (!session) await sb.auth.signInAnonymously()
    const [rms, settings] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const rm: Record<string,number> = {}
    rms.forEach((r:any) => { rm[r.exercise_name] = r.weight_lbs })
    setOneRms(rm); setRoundTo(settings.round_to_lbs)
    const lw: Record<string,number|null> = {}
    await Promise.all(workout.exercises.map(async ex => {
      if (!ex.isBodyweight) lw[ex.name] = await getLastWeightForExercise(ex.name)
    }))
    setLastWeights(lw)
    const sess = await createSession(weekNum, workoutKey)
    setSessionId(sess.id)
  }, [weekNum, workoutKey, workout.exercises])

  useEffect(() => { init() }, [init])

  const totalSets   = workout.exercises.reduce((a,ex) => a + getSetsForWeek(ex.type, weekNum), 0)
  const loggedCount = Object.values(sets).reduce((a,s) => a + s.length, 0)

  const suggested = (ex: Exercise) => {
    if (ex.isBodyweight) return 0
    const t = getTargetWeight(oneRms[ex.name]??0, ex.type, weekNum, roundTo)
    return t > 0 ? t : (lastWeights[ex.name] ?? 0)
  }

  const handleSave = async (weight: number, reps: number) => {
    if (!modal || !sessionId) return
    const { exercise, setNum } = modal
    const logged = await logSet(sessionId, exercise.name, setNum, weight||null, reps)
    setSets(p => ({ ...p, [exercise.name]: [...(p[exercise.name]??[]), logged] }))
    setModal(null)
    setRest({ seconds: REST_SECS[exercise.type] })
  }

  const handleFinish = async () => {
    if (sessionId) await completeSession(sessionId)
    setFinished(true)
  }

  // ── Finished screen ──
  if (finished) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-6"
         style={{ background:'var(--bg)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center"
           style={{ background:'var(--success-bg)' }}>
        <Check size={38} style={{ color:'var(--success)' }} strokeWidth={3} />
      </div>
      <div className="text-center">
        <h2 className="text-[28px] font-black tracking-tight" style={{ color:'var(--text)' }}>
          Workout Done
        </h2>
        <p className="text-[15px] mt-1" style={{ color:'var(--text-2)' }}>
          {loggedCount} sets · Week {weekNum} · Workout {workoutKey}
        </p>
      </div>
      <button onClick={() => router.push('/')} className="btn-primary" style={{ background: cvar }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-nav" style={{ background:'var(--bg)' }}>

      {/* ── Sticky header ── */}
      <div className="pt-safe sticky top-0 z-30 px-4 pb-3"
           style={{ background:'rgba(12,12,20,0.9)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-3 pt-3 mb-2.5">
          <button onClick={() => router.back()}
            className="pressable w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background:'var(--surface-2)' }}>
            <ArrowLeft size={17} style={{ color:'var(--text-2)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="label" style={{ color: cvar }}>Wk {weekNum} · {workout.shortName}</p>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
               style={{ background:'var(--surface-2)' }}>
            <span className="text-[15px] font-black tabular-nums" style={{ color: cvar }}>{loggedCount}</span>
            <span className="text-[13px]" style={{ color:'var(--text-3)' }}>/ {totalSets}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full overflow-hidden" style={{ background:'var(--surface-3)' }}>
          <div className="h-full rounded-full transition-all duration-500"
               style={{ width:`${totalSets>0?(loggedCount/totalSets)*100:0}%`, background: cvar }} />
        </div>
      </div>

      {/* ── Exercise list ── */}
      <div className="px-4 py-4 space-y-2.5">
        {workout.exercises.map((ex, idx) => {
          const exSets    = getSetsForWeek(ex.type, weekNum)
          const exReps    = getRepsForWeek(ex.type, weekNum)
          const exLogged  = sets[ex.name] ?? []
          const isOpen    = expanded === ex.name
          const isDone    = exLogged.length >= exSets
          const target    = suggested(ex)

          return (
            <div key={ex.name} className="card overflow-hidden"
                 style={{ borderColor: isOpen ? `color-mix(in srgb, ${cvar} 35%, transparent)` : 'var(--border)',
                          opacity: isDone && !isOpen ? 0.55 : 1, transition:'opacity 0.2s' }}>

              {/* Exercise header row */}
              <button className="w-full flex items-center gap-3 px-4 py-3.5 pressable"
                      onClick={() => setExpanded(isOpen ? '' : ex.name)}>
                {/* Index / done indicator */}
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-[12px] font-black transition-all"
                     style={{ background: isDone ? 'var(--success-bg)' : 'var(--surface-2)',
                              color:      isDone ? 'var(--success)'    : 'var(--text-3)' }}>
                  {isDone ? '✓' : idx + 1}
                </div>

                {/* Name + meta */}
                <div className="flex-1 text-left min-w-0">
                  <p className="text-[15px] font-semibold leading-tight truncate" style={{ color:'var(--text)' }}>
                    {ex.name}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color:'var(--text-2)' }}>
                    {ex.muscle}
                    {!ex.isBodyweight && target > 0 &&
                      <span style={{ color: cvar }}> · {target} lbs</span>}
                  </p>
                </div>

                {/* Set count + chevron */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-[13px] font-bold tabular-nums" style={{ color: isDone ? 'var(--success)' : cvar }}>
                    {exLogged.length}/{exSets}
                  </span>
                  {isOpen
                    ? <ChevronUp  size={15} style={{ color:'var(--text-3)' }} />
                    : <ChevronDown size={15} style={{ color:'var(--text-3)' }} />}
                </div>
              </button>

              {/* Expanded body */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">

                  {/* Cue strip */}
                  <button className="w-full flex items-start gap-2 px-3 py-2.5 rounded-xl text-left pressable"
                          style={{ background:'var(--surface-2)' }}
                          onClick={() => setShowCue(showCue===ex.name ? null : ex.name)}>
                    <Info size={13} className="mt-0.5 flex-shrink-0" style={{ color:'var(--text-3)' }} />
                    <p className="text-[12px] leading-relaxed italic" style={{ color:'var(--text-2)' }}>
                      {ex.cue}
                    </p>
                  </button>

                  {/* Set rows */}
                  {Array.from({length:exSets},(_,i)=>i+1).map(n => {
                    const logged = exLogged.find((l:any) => l.set_number===n)
                    return (
                      <button key={n}
                        onClick={() => !logged && setModal({exercise:ex, setNum:n, suggested:suggested(ex)})}
                        className="pressable w-full flex items-center gap-3 h-14 px-4 rounded-2xl"
                        style={{ background: logged ? 'var(--success-bg)' : 'var(--surface-2)',
                                 border:`1px solid ${logged ? 'rgba(52,211,153,0.25)' : 'var(--border)'}` }}>
                        {/* Set indicator */}
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                             style={{ background: logged ? 'var(--success)' : 'var(--surface-3)',
                                      color: logged ? '#fff' : 'var(--text-3)' }}>
                          {logged ? '✓' : n}
                        </div>
                        {logged ? (
                          <p className="text-[15px] font-semibold flex-1 text-left" style={{ color:'var(--text)' }}>
                            {logged.weight_lbs ?? 'BW'} lbs
                            <span className="font-normal" style={{ color:'var(--text-2)' }}> × {logged.reps} reps</span>
                          </p>
                        ) : (
                          <p className="text-[14px] flex-1 text-left" style={{ color:'var(--text-3)' }}>
                            {ex.isBodyweight ? 'Bodyweight' : target > 0 ? `${target} lbs suggested` : 'Tap to log'}
                          </p>
                        )}
                        <p className="text-[11px] font-medium" style={{ color:'var(--text-3)' }}>{exReps}</p>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* ── Finish button ── */}
        {loggedCount >= totalSets && (
          <button onClick={handleFinish}
            className="btn-primary flex items-center justify-center gap-2 mt-4"
            style={{ background: cvar }}>
            <Check size={18} strokeWidth={3} />
            Complete Workout
          </button>
        )}
      </div>

      {/* Modals */}
      {modal && (
        <WeightSheet
          exercise={modal.exercise} setNum={modal.setNum} suggested={modal.suggested}
          onSave={handleSave} onClose={() => setModal(null)}
        />
      )}
      {rest && <RestTimer seconds={rest.seconds} onDone={() => setRest(null)} />}
    </div>
  )
}
