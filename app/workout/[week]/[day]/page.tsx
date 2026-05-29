'use client'
import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, SkipForward, Timer, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession, logSet, getLastWeightForExercise } from '@/lib/db'
import type { Exercise, LoggedSet, WorkoutKey } from '@/types'

const COLORS: Record<string, string> = { A: '#3B82F6', B: '#22C55E', C: '#A855F7', D: '#F97316' }
const REST_DEFAULTS: Record<string, number> = { primary: 150, secondary: 120, isolation: 75 }

// ── Weight Modal ────────────────────────────────────────────────────────
function WeightModal({ exercise, setNum, suggested, onSave, onClose }: {
  exercise: Exercise, setNum: number, suggested: number, onSave: (w: number, r: number) => void, onClose: () => void
}) {
  const [weight, setWeight] = useState(suggested || 0)
  const [reps,   setReps]   = useState(10)

  const adjust = (delta: number) => setWeight(w => Math.max(0, w + delta))

  return (
    <div className="fixed inset-0 z-50 flex items-end" style={{ background: '#00000088' }} onClick={onClose}>
      <div className="w-full rounded-t-3xl p-5 slide-up" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'var(--border)' }} />
        <p className="text-xs font-bold tracking-widest uppercase mb-1" style={{ color: 'var(--muted)' }}>Set {setNum}</p>
        <h3 className="text-lg font-black mb-5" style={{ color: 'var(--text)' }}>{exercise.name}</h3>

        {/* Weight display */}
        <div className="text-center mb-4">
          <span className="text-6xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{weight}</span>
          <span className="text-xl ml-2" style={{ color: 'var(--muted)' }}>lbs</span>
        </div>

        {/* Quick adjust */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          {[-10, -5, +5, +10].map(d => (
            <button key={d} onClick={() => adjust(d)}
              className="py-3 rounded-xl text-sm font-bold active:scale-95 transition-transform"
              style={{ background: 'var(--surface)', color: d > 0 ? 'var(--accent)' : 'var(--muted-light)' }}>
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

        {/* Reps */}
        <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--muted)' }}>Reps</p>
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[6, 8, 10, 12, 15, 20].map(r => (
            <button key={r} onClick={() => setReps(r)}
              className="py-2.5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
              style={{ background: reps === r ? 'var(--accent)' : 'var(--surface)', color: reps === r ? '#fff' : 'var(--muted-light)' }}>
              {r}
            </button>
          ))}
        </div>

        <button onClick={() => onSave(weight, reps)}
          className="w-full py-4 rounded-2xl text-base font-extrabold tracking-wider active:scale-[0.98] transition-transform"
          style={{ background: 'var(--accent)', color: '#fff' }}>
          LOG SET {setNum}
        </button>
      </div>
    </div>
  )
}

// ── Rest Timer ──────────────────────────────────────────────────────────
function RestTimer({ seconds, onDone }: { seconds: number, onDone: () => void }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    if (rem <= 0) { onDone(); return }
    const t = setTimeout(() => setRem(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [rem, onDone])
  const pct = ((seconds - rem) / seconds) * 100
  const m = Math.floor(rem / 60), s = rem % 60
  return (
    <div className="fixed inset-x-4 bottom-24 z-40 rounded-2xl p-4 flex items-center gap-4"
         style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="relative w-12 h-12 flex-shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" style={{ stroke: 'var(--border)' }} />
          <circle cx="22" cy="22" r="18" fill="none" strokeWidth="3" strokeLinecap="round"
            style={{ stroke: 'var(--accent)', strokeDasharray: `${2 * Math.PI * 18}`, strokeDashoffset: `${2 * Math.PI * 18 * (1 - pct / 100)}`, transition: 'stroke-dashoffset 1s linear' }} />
        </svg>
        <Timer size={14} className="absolute inset-0 m-auto" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="flex-1">
        <p className="text-xs" style={{ color: 'var(--muted)' }}>Rest</p>
        <p className="text-xl font-black tabular-nums" style={{ color: 'var(--text)' }}>{m}:{String(s).padStart(2,'0')}</p>
      </div>
      <button onClick={onDone} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--surface)', color: 'var(--muted-light)' }}>
        Skip
      </button>
    </div>
  )
}

// ── Main page ───────────────────────────────────────────────────────────
export default function WorkoutPage({ params }: { params: Promise<{ week: string; day: string }> }) {
  const { week: weekStr, day } = use(params)
  const weekNum    = parseInt(weekStr)
  const workoutKey = day as WorkoutKey
  const router     = useRouter()

  const workout  = WORKOUTS.find(w => w.key === workoutKey)!
  const cfg      = WEEK_CONFIG[weekNum]
  const color    = COLORS[workoutKey]

  const [oneRms,      setOneRms]      = useState<Record<string, number>>({})
  const [lastWeights, setLastWeights] = useState<Record<string, number | null>>({})
  const [roundTo,     setRoundTo]     = useState(5)
  const [sessionId,   setSessionId]   = useState<string | null>(null)
  const [sets,        setSets]        = useState<Record<string, LoggedSet[]>>({})
  const [expanded,    setExpanded]    = useState<string>(workout.exercises[0]?.name ?? '')
  const [modal,       setModal]       = useState<{ exercise: Exercise; setNum: number; suggested: number } | null>(null)
  const [restTimer,   setRestTimer]   = useState<{ seconds: number } | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [finished,    setFinished]    = useState(false)

  const init = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { await supabase.auth.signInAnonymously() }

    const [allRms, settings] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const rmMap: Record<string, number> = {}
    allRms.forEach(r => { rmMap[r.exercise_name] = r.weight_lbs })
    setOneRms(rmMap)
    setRoundTo(settings.round_to_lbs)

    // Fetch last used weights for each exercise
    const lwMap: Record<string, number | null> = {}
    await Promise.all(workout.exercises.map(async ex => {
      if (!ex.isBodyweight) lwMap[ex.name] = await getLastWeightForExercise(ex.name)
    }))
    setLastWeights(lwMap)

    const sess = await createSession(weekNum, workoutKey)
    setSessionId(sess.id)
  }, [weekNum, workoutKey, workout.exercises])

  useEffect(() => { init() }, [init])

  const totalSets   = workout.exercises.reduce((acc, ex) => acc + getSetsForWeek(ex.type, weekNum), 0)
  const loggedCount = Object.values(sets).reduce((a, s) => a + s.length, 0)
  const progress    = totalSets > 0 ? loggedCount / totalSets : 0

  const getSuggested = (ex: Exercise): number => {
    if (ex.isBodyweight) return 0
    const target = getTargetWeight(oneRms[ex.name] ?? 0, ex.type, weekNum, roundTo)
    if (target > 0) return target
    return lastWeights[ex.name] ?? 0
  }

  const openModal = (exercise: Exercise, setNum: number) => {
    setModal({ exercise, setNum, suggested: getSuggested(exercise) })
  }

  const handleSaveSet = async (weight: number, reps: number) => {
    if (!modal || !sessionId) return
    const { exercise, setNum } = modal
    setSaving(true)
    const logged = await logSet(sessionId, exercise.name, setNum, weight || null, reps)
    setSets(prev => ({ ...prev, [exercise.name]: [...(prev[exercise.name] ?? []), logged] }))
    setModal(null)
    setSaving(false)
    setRestTimer({ seconds: REST_DEFAULTS[exercise.type] })
  }

  const handleFinish = async () => {
    if (!sessionId) return
    await completeSession(sessionId)
    setFinished(true)
  }

  const allDone = loggedCount >= totalSets

  if (finished) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-6 px-8" style={{ background: 'var(--bg)' }}>
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: `${color}25` }}>
        <Check size={40} style={{ color }} />
      </div>
      <div className="text-center">
        <h2 className="text-3xl font-black" style={{ color: 'var(--text)' }}>Workout Complete</h2>
        <p className="mt-1" style={{ color: 'var(--muted)' }}>{loggedCount} sets logged · Week {weekNum}</p>
      </div>
      <button onClick={() => router.push('/')} className="w-full py-4 rounded-2xl font-extrabold text-base tracking-wider" style={{ background: color, color: '#fff' }}>
        BACK TO HOME
      </button>
    </div>
  )

  return (
    <div className="min-h-screen safe-bottom" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="safe-top px-4 pt-3 pb-3 sticky top-0 z-30" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => router.back()} className="p-2 rounded-xl active:opacity-60" style={{ background: 'var(--surface-2)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color }}>Week {weekNum} · Workout {workoutKey}</p>
            <h1 className="text-base font-extrabold truncate" style={{ color: 'var(--text)' }}>{workout.shortName}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold tabular-nums" style={{ color: 'var(--text)' }}>{loggedCount}<span style={{ color: 'var(--muted)' }}>/{totalSets}</span></p>
            <p className="text-[10px]" style={{ color: 'var(--muted)' }}>sets</p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div className="h-full rounded-full transition-all duration-300" style={{ width: `${progress * 100}%`, background: color }} />
        </div>
      </div>

      {/* Exercises */}
      <div className="px-4 py-3 space-y-2.5">
        {workout.exercises.map((ex, idx) => {
          const exSets  = getSetsForWeek(ex.type, weekNum)
          const exReps  = getRepsForWeek(ex.type, weekNum)
          const logged  = sets[ex.name] ?? []
          const isOpen  = expanded === ex.name
          const target  = getSuggested(ex)
          const allLogged = logged.length >= exSets

          return (
            <div key={ex.name} className={`rounded-2xl overflow-hidden transition-all ${allLogged ? 'opacity-70' : ''}`}
                 style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color + '55' : 'var(--border)'}` }}>
              {/* Exercise header */}
              <button className="w-full px-4 py-3.5 flex items-center gap-3 active:opacity-70" onClick={() => setExpanded(isOpen ? '' : ex.name)}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-black"
                     style={{ background: allLogged ? `${color}25` : 'var(--surface-2)', color: allLogged ? color : 'var(--muted)' }}>
                  {allLogged ? '✓' : idx + 1}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="text-sm font-bold truncate" style={{ color: 'var(--text)' }}>{ex.name}</p>
                  <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                    {ex.muscle} · {exSets} × {exReps}
                    {!ex.isBodyweight && target > 0 && <span style={{ color }}> · {target} lbs target</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold tabular-nums" style={{ color }}>
                    {logged.length}/{exSets}
                  </span>
                  {isOpen ? <ChevronUp size={14} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted)' }} />}
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  {/* Cue */}
                  <p className="text-[11px] italic leading-snug px-3 py-2 rounded-lg" style={{ color: 'var(--muted)', background: 'var(--surface-2)' }}>
                    {ex.cue}
                  </p>
                  {/* Set rows */}
                  {Array.from({ length: exSets }, (_, i) => i + 1).map(setNum => {
                    const logged_set = logged.find(l => l.set_number === setNum)
                    const isDone = !!logged_set
                    return (
                      <button key={setNum} onClick={() => !isDone && openModal(ex, setNum)}
                        className="w-full flex items-center gap-3 py-3 px-3 rounded-xl active:scale-[0.98] transition-transform"
                        style={{ background: isDone ? `${color}18` : 'var(--surface-2)', border: `1px solid ${isDone ? color + '44' : 'var(--border)'}` }}>
                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                             style={{ background: isDone ? color : 'var(--border)', color: '#fff' }}>
                          {isDone ? '✓' : setNum}
                        </div>
                        {isDone ? (
                          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                            {logged_set.weight_lbs ?? 'BW'} lbs × {logged_set.reps} reps
                          </p>
                        ) : (
                          <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Tap to log · {ex.isBodyweight ? 'Bodyweight' : target > 0 ? `${target} lbs suggested` : 'enter weight'}
                          </p>
                        )}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Finish button */}
      {allDone && (
        <div className="fixed bottom-20 inset-x-4">
          <button onClick={handleFinish}
            className="w-full py-4 rounded-2xl text-base font-extrabold tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: color, color: '#fff' }}>
            <Check size={20} />
            COMPLETE WORKOUT
          </button>
        </div>
      )}

      {/* Modals */}
      {modal && <WeightModal exercise={modal.exercise} setNum={modal.setNum} suggested={modal.suggested} onSave={handleSaveSet} onClose={() => setModal(null)} />}
      {restTimer && <RestTimer seconds={restTimer.seconds} onDone={() => setRestTimer(null)} />}
    </div>
  )
}
