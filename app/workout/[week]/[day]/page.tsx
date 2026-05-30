'use client'
import { use, useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X, Zap } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getRecentSetsForExercise, fetchEquipment } from '@/lib/db'
import { getRestSeconds, formatRestTime, fireRestCompleteNotification,
         requestNotificationPermission } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }
const REST: Record<string,number> = { primary:150, secondary:120, isolation:75 }

// ── Inline Set Row ────────────────────────────────────────────────
function SetRow({ setNum, targetWeight, repsRange, existing, onLog, isBodyweight }: {
  setNum:       number
  targetWeight: number
  repsRange:    string
  existing:     any | null
  onLog:        (w: number|null, r: number) => Promise<void>
  isBodyweight: boolean
}) {
  const [wt,     setWt]     = useState(existing?.weight_lbs?.toString() ?? (targetWeight > 0 ? targetWeight.toString() : ''))
  const [reps,   setReps]   = useState(existing?.reps?.toString() ?? '')
  const [saving, setSaving] = useState(false)
  const isDone = !!existing
  const [minR, maxR] = repsRange.replace('–','-').split('-').map(Number)

  const handleLog = async () => {
    if (isDone || saving) return
    const parsedWt   = isBodyweight ? null : (parseFloat(wt) || null)
    const parsedReps = parseInt(reps) || maxR || 10
    setSaving(true)
    await onLog(parsedWt, parsedReps)
    setSaving(false)
  }

  const canLog = !isDone && !saving && (isBodyweight || wt) && reps

  return (
    <div className="flex items-center gap-2.5 px-3 rounded-2xl"
         style={{
           minHeight:56,
           background: isDone ? 'rgba(48,209,88,0.1)' : 'var(--bg-3)',
           border:`0.5px solid ${isDone ? 'rgba(48,209,88,0.4)' : 'rgba(84,84,88,0.5)'}`,
         }}>
      {/* Set badge */}
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
           style={{ background: isDone ? 'var(--green)' : 'rgba(84,84,88,0.4)',
                    fontSize:12, fontWeight:700, color: isDone ? '#000' : '#8E8E93' }}>
        {isDone ? '✓' : setNum}
      </div>

      {/* Weight */}
      {!isBodyweight ? (
        <>
          <input
            type="number" inputMode="decimal"
            placeholder={targetWeight > 0 ? String(targetWeight) : '0'}
            value={wt}
            onChange={e => setWt(e.target.value)}
            onFocus={e => e.target.select()}
            readOnly={isDone}
            style={{
              flex:1, height:38, textAlign:'center', borderRadius:10, outline:'none',
              fontSize:15, fontWeight:700, letterSpacing:'-0.3px',
              background: isDone ? 'transparent' : 'rgba(118,118,128,0.18)',
              color: isDone ? '#8E8E93' : 'var(--label)', border:'none',
            }}
          />
          <span style={{ fontSize:12, color:'#8E8E93', flexShrink:0 }}>lbs</span>
        </>
      ) : (
        <span style={{ flex:1, fontSize:14, color:'#8E8E93', textAlign:'center' }}>Bodyweight</span>
      )}

      {/* Divider */}
      <div style={{ width:0.5, height:28, background:'rgba(84,84,88,0.5)', flexShrink:0 }} />

      {/* Reps */}
      <input
        type="number" inputMode="numeric"
        placeholder={String(maxR || 10)}
        value={reps}
        onChange={e => setReps(e.target.value)}
        onFocus={e => e.target.select()}
        readOnly={isDone}
        style={{
          width:52, height:38, textAlign:'center', borderRadius:10, outline:'none',
          fontSize:15, fontWeight:700, letterSpacing:'-0.3px',
          background: isDone ? 'transparent' : 'rgba(118,118,128,0.18)',
          color: isDone ? '#8E8E93' : 'var(--label)', border:'none',
        }}
      />
      <span style={{ fontSize:12, color:'#8E8E93', flexShrink:0 }}>reps</span>

      {/* Log button */}
      <button
        onClick={handleLog}
        disabled={!canLog}
        style={{
          width:36, height:36, borderRadius:'50%', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: isDone ? 'rgba(48,209,88,0.25)' : canLog ? 'var(--accent)' : 'rgba(84,84,88,0.25)',
          transition:'background 0.15s',
        }}>
        {saving
          ? <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid transparent', borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
          : <Check size={15} strokeWidth={3} style={{ color: isDone ? 'var(--green)' : canLog ? '#fff' : '#8E8E93' }} />}
      </button>
    </div>
  )
}

// ── Rest Timer Pill ───────────────────────────────────────────────
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
      <span style={{ fontSize:17, fontWeight:700, color:'var(--label)', fontVariantNumeric:'tabular-nums' }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <span style={{ fontSize:12, color:'#8E8E93' }}>rest</span>
      <button onClick={onDone} style={{ padding:'6px 12px', borderRadius:999,
        background:'rgba(118,118,128,0.24)', fontSize:12, fontWeight:600, color:'#8E8E93' }}>
        Skip
      </button>
    </div>
  )
}

// ── Alternatives Sheet ────────────────────────────────────────────
function AltsSheet({ exName, equipment, onSwap, onClose }: {
  exName:string; equipment:string[]
  onSwap:(n:string,c:string)=>void; onClose:()=>void
}) {
  const alts  = EXERCISE_ALTS[exName] ?? {}
  const keys  = Object.keys(alts) as EquipmentKey[]
  const avail = keys.filter(k => equipment.includes(k))
  const other = keys.filter(k => !equipment.includes(k))

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel" onClick={e => e.stopPropagation()}
           style={{ maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div className="flex items-center justify-between px-5 pt-4 pb-3 flex-shrink-0">
          <div>
            <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em' }}>Alternatives</p>
            <p style={{ fontSize:17, fontWeight:700, color:'var(--label)', marginTop:2 }}>{exName}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'var(--fill-3)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={15} style={{ color:'#8E8E93' }} />
          </button>
        </div>
        <div style={{ height:0.5, background:'var(--sep)' }} />
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-4">
          {avail.length > 0 && (
            <div>
              <p style={{ fontSize:12, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Your Equipment</p>
              <div className="ios-group">
                {avail.flatMap((key,gi) => (alts[key]??[]).map((alt,ai) => (
                  <button key={`${key}-${ai}`} onClick={() => onSwap(alt.name,alt.cue)}
                    className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}>
                    <span style={{ fontSize:16, width:24, flexShrink:0 }}>{EQUIPMENT_ICONS[key]}</span>
                    <div className="flex-1 text-left">
                      <p style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>{alt.name}</p>
                      <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', marginTop:1 }}>{alt.cue}</p>
                    </div>
                    <ChevronRight size={14} style={{ color:'#8E8E93', flexShrink:0 }} />
                  </button>
                )))}
              </div>
            </div>
          )}
          {other.length > 0 && (
            <div>
              <p style={{ fontSize:12, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Other Options</p>
              <div className="ios-group" style={{ opacity:0.6 }}>
                {other.flatMap((key,gi) => (alts[key]??[]).map((alt,ai) => (
                  <button key={`${key}-${ai}`} onClick={() => onSwap(alt.name,alt.cue)}
                    className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}>
                    <span style={{ fontSize:16, width:24, flexShrink:0 }}>{EQUIPMENT_ICONS[key]}</span>
                    <div className="flex-1 text-left">
                      <p style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>{alt.name}</p>
                      <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', marginTop:1 }}>{alt.cue}</p>
                    </div>
                    <ChevronRight size={14} style={{ color:'#8E8E93', flexShrink:0 }} />
                  </button>
                )))}
              </div>
            </div>
          )}
        </div>
        <div className="px-4 py-3 flex-shrink-0">
          <button onClick={onClose} style={{ width:'100%', padding:'14px', borderRadius:14,
            background:'var(--fill-3)', fontSize:15, fontWeight:600, color:'#8E8E93' }}>
            Keep Original
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────
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
  const [smartMap,  setSmartMap]  = useState<Record<string,SmartSuggestion|null>>({})
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;exName:string}|null>(null)
  const [done,      setDone]      = useState(false)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const {data:{session}} = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      await requestNotificationPermission()
      const [rmArr, settings, equip] = await Promise.all([fetchAllOneRms(), fetchSettings(), fetchEquipment()])
      const rm: Record<string,number> = {}
      rmArr.forEach((x:any) => { rm[x.exercise_name] = x.weight_lbs })
      setRms(rm); setRound(settings.round_to_lbs); setEquipment(equip)
      const smart: Record<string,SmartSuggestion|null> = {}
      await Promise.all(workout.exercises.map(async ex => {
        if (ex.isBodyweight) { smart[ex.name] = null; return }
        const recent = await getRecentSetsForExercise(ex.name, 15)
        smart[ex.name] = calculateSmartSuggestion(recent, ex.type, wk, rm[ex.name]??0, settings.round_to_lbs)
      }))
      setSmartMap(smart)
      const sess = await createSession(wk, key)
      setSid(sess.id)
    } catch(e) { console.error('Workout init error:', e) }
  }, [wk, key, workout.exercises])

  useEffect(() => { init() }, [init])

  const total  = workout.exercises.reduce((a,ex) => a+getSetsForWeek(ex.type,wk), 0)
  const logged = Object.values(sets).reduce((a,s) => a+s.length, 0)
  const pct    = total > 0 ? logged/total : 0

  const effectiveName = (ex: Exercise) => swapped[ex.name]?.name ?? ex.name
  const effectiveCue  = (ex: Exercise) => swapped[ex.name]?.cue  ?? ex.cue

  const getTarget = (ex: Exercise): number => {
    if (ex.isBodyweight) return 0
    const sm = smartMap[ex.name]
    if (sm) return sm.weight
    return getTargetWeight(rms[ex.name]??0, ex.type, wk, round)
  }

  const handleLog = async (origEx: Exercise, setNum: number, weight: number|null, reps: number) => {
    if (!sid) return
    const name = effectiveName(origEx)
    const row  = await logSet(sid, name, setNum, weight, reps)
    setSets(p => ({ ...p, [origEx.name]: [...(p[origEx.name]??[]), row] }))
    setRest({ sec: getRestSeconds(wk, origEx.type), exName: name })
    // Auto-advance to next incomplete exercise
    const next = workout.exercises.find(e => {
      const need = getSetsForWeek(e.type, wk)
      const have = (sets[e.name]?.length ?? 0) + (e.name===origEx.name ? 1 : 0)
      return have < need && e.name !== origEx.name
    })
    if (next && (sets[origEx.name]?.length ?? 0) + 1 >= getSetsForWeek(origEx.type, wk)) {
      setOpen(next.name)
    }
  }

  if (done) return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 px-6" style={{ background:'var(--bg)' }}>
      <CheckCircle2 size={64} style={{ color:'var(--green)' }} strokeWidth={1.5} />
      <div className="text-center">
        <h2 style={{ fontSize:28, fontWeight:700, color:'var(--label)' }}>Workout Complete</h2>
        <p style={{ fontSize:17, color:'#8E8E93', marginTop:8 }}>{logged} sets · Week {wk} · Workout {key}</p>
      </div>
      <button onClick={() => router.push('/')} className="ios-btn mt-2" style={{ background:c, maxWidth:300 }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* Nav */}
      <div className="pt-safe sticky top-0 z-30" style={{
        background:'rgba(0,0,0,0.92)', backdropFilter:'saturate(180%) blur(24px)',
        WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'0.5px solid rgba(84,84,88,0.8)' }}>
        <div className="flex items-center gap-3 px-4 pb-3 pt-2">
          <button onClick={() => router.back()} style={{
            width:36, height:36, borderRadius:'50%', background:'var(--fill-3)',
            display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ChevronLeft size={17} strokeWidth={2.5} style={{ color:'var(--accent)' }} />
          </button>
          <div className="flex-1 min-w-0">
            <p style={{ fontSize:17, fontWeight:700, color:'var(--label)', letterSpacing:'-0.41px' }} className="truncate">
              {workout.shortName}
            </p>
            <p style={{ fontSize:12, color:'#8E8E93', marginTop:1 }}>
              Week {wk} · RIR {cfg.rir} · Rest {formatRestTime(getRestSeconds(wk,'primary'))}–{formatRestTime(getRestSeconds(wk,'isolation'))}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px',
            borderRadius:999, background:'var(--fill-3)' }}>
            <span style={{ fontSize:17, fontWeight:700, color:c, fontVariantNumeric:'tabular-nums' }}>{logged}</span>
            <span style={{ fontSize:12, color:'#8E8E93' }}>/ {total} sets</span>
          </div>
        </div>
        <div style={{ margin:'0 16px 12px', height:3, borderRadius:99, background:'rgba(118,118,128,0.24)', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:99, background:c, width:`${pct*100}%`, transition:'width 0.4s ease' }} />
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ padding:'12px 16px', display:'flex', flexDirection:'column', gap:12 }}>
        {workout.exercises.map((origEx, idx) => {
          const exSets   = getSetsForWeek(origEx.type, wk)
          const exReps   = getRepsForWeek(origEx.type, wk)
          const exLogged = sets[origEx.name] ?? []
          const isOpen   = open === origEx.name
          const isComp   = exLogged.length >= exSets
          const target   = getTarget(origEx)
          const smart    = smartMap[origEx.name]
          const isSwap   = !!swapped[origEx.name]

          return (
            <div key={origEx.name} style={{
              background:'var(--bg-2)', borderRadius:16,
              border:`0.5px solid ${isOpen ? `color-mix(in srgb, ${c} 40%, rgba(84,84,88,0.5))` : 'rgba(84,84,88,0.5)'}`,
              opacity: isComp && !isOpen ? 0.55 : 1, transition:'opacity 0.2s, border-color 0.2s',
              overflow:'hidden',
            }}>

              {/* Collapsed header row */}
              <button onClick={() => setOpen(isOpen ? '' : origEx.name)}
                style={{ width:'100%', padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{
                  width:30, height:30, borderRadius:10, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background: isComp ? 'rgba(48,209,88,0.2)' : 'rgba(118,118,128,0.2)',
                  fontSize:12, fontWeight:800, color: isComp ? 'var(--green)' : '#8E8E93' }}>
                  {isComp ? '✓' : idx+1}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <p style={{ fontSize:15, fontWeight:700, color:'var(--label)' }} className="truncate">
                      {effectiveName(origEx)}
                    </p>
                    {isSwap && <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px', borderRadius:6,
                      background:'rgba(10,132,255,0.2)', color:'var(--blue)', flexShrink:0 }}>swapped</span>}
                  </div>
                  <p style={{ fontSize:12, color:'#8E8E93', marginTop:2 }}>
                    {origEx.muscle}
                    {!origEx.isBodyweight && target > 0 && (
                      <span style={{ color: smart?.direction==='up' ? 'var(--green)' : smart?.direction==='down' ? 'var(--orange)' : c }}>
                        {' · '}{target} lbs{smart?.direction==='up' ? ' ↑' : smart?.direction==='down' ? ' ↓' : ''}
                      </span>
                    )}
                  </p>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:14, fontWeight:700, color: isComp ? 'var(--green)' : c, fontVariantNumeric:'tabular-nums' }}>
                    {exLogged.length}/{exSets}
                  </span>
                  <ChevronRight size={14} style={{ color:'#8E8E93',
                    transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
                </div>
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ padding:'0 16px 16px' }}>
                  <div style={{ height:0.5, background:'rgba(84,84,88,0.5)', marginBottom:16 }} />

                  {/* Metrics row */}
                  <div style={{ display:'flex', gap:8, marginBottom:16 }}>
                    {[
                      { label:'SETS',  value: String(exSets)    },
                      { label:'REPS',  value: exReps            },
                      { label:'RIR',   value: String(cfg.rir)   },
                    ].map(m => (
                      <div key={m.label} style={{
                        flex:1, padding:'8px 10px', borderRadius:12,
                        background:'rgba(118,118,128,0.14)', textAlign:'center' }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#8E8E93',
                          textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>
                          {m.label}
                        </p>
                        <p style={{ fontSize:17, fontWeight:700, color:'var(--label)', letterSpacing:'-0.41px' }}>
                          {m.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Target weight */}
                  {!origEx.isBodyweight && target > 0 && (
                    <div style={{ marginBottom:16 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93',
                        textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:4 }}>
                        Target Weight
                      </p>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontSize:34, fontWeight:800, color:'var(--label)', letterSpacing:'-1px' }}>
                          {target}
                        </span>
                        <span style={{ fontSize:17, color:'#8E8E93' }}>lbs</span>
                        {smart?.direction !== 'maintain' && smart && (
                          <span style={{ fontSize:12, fontWeight:600, padding:'2px 8px', borderRadius:6,
                            background: smart.direction==='up' ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)',
                            color: smart.direction==='up' ? 'var(--green)' : 'var(--orange)', marginLeft:4 }}>
                            {smart.direction==='up' ? '↑ Smart adjusted' : '↓ Smart adjusted'}
                          </span>
                        )}
                      </div>
                      {smart?.direction !== 'maintain' && smart && (
                        <p style={{ fontSize:12, color:'#8E8E93', marginTop:4, lineHeight:1.5 }}>
                          {smart.reason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Set logger */}
                  <div style={{ marginBottom:12 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93',
                        textTransform:'uppercase', letterSpacing:'0.06em' }}>
                        Log Your Sets
                      </p>
                      <p style={{ fontSize:11, color:'#8E8E93' }}>weight · reps</p>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {Array.from({length:exSets},(_,i)=>i+1).map(n => (
                        <SetRow
                          key={n}
                          setNum={n}
                          targetWeight={target}
                          repsRange={exReps}
                          existing={exLogged.find((l:any) => l.set_number===n) ?? null}
                          isBodyweight={!!origEx.isBodyweight}
                          onLog={(w,r) => handleLog(origEx, n, w, r)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Form cue + swap */}
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
                    <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', lineHeight:1.6, flex:1 }}>
                      {effectiveCue(origEx)}
                    </p>
                    {EXERCISE_ALTS[origEx.name] && (
                      <button onClick={() => setAltsFor(origEx.name)} style={{
                        display:'flex', alignItems:'center', gap:4, padding:'6px 10px',
                        borderRadius:8, background:'var(--fill-3)', flexShrink:0 }}>
                        <ArrowLeftRight size={12} style={{ color:'var(--blue)' }} />
                        <span style={{ fontSize:12, fontWeight:600, color:'var(--blue)' }}>Swap</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Finish */}
        {logged >= total && (
          <button onClick={async () => { if(sid) await completeSession(sid); setDone(true) }}
            className="ios-btn" style={{ background:'var(--green)', marginTop:8 }}>
            <CheckCircle2 size={18} strokeWidth={2.5} /> Complete Workout
          </button>
        )}
      </div>

      {rest   && <RestPill seconds={rest.sec} exName={rest.exName} onDone={() => setRest(null)} />}
      {altsFor && (
        <AltsSheet exName={altsFor} equipment={equipment}
          onSwap={(n,cu) => { setSwapped(p => ({...p,[altsFor]:{name:n,cue:cu}})); setAltsFor(null) }}
          onClose={() => setAltsFor(null)} />
      )}
    </div>
  )
}
