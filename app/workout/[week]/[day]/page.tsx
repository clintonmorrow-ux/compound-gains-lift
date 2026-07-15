'use client'
import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X, Trophy, Minus, Plus, Flame, Award, Lightbulb, RotateCcw, Zap, Pencil } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getProgram, getWeekConfig } from '@/lib/program/programLibrary'
import { getTargetWeight, getSetsForWeek, getRepsForWeek, isDumbbellExercise, dumbbellRound, dumbbellStep } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getRecentSetsForExercise, fetchEquipment, fetchExercisePreferences,
         deleteSession, findIncompleteSession, fetchAllLoggedSets, upsertOneRm, updateLoggedSet } from '@/lib/db'
import { getRestSeconds, fireRestCompleteNotification, requestNotificationPermission, getSupersetPairs } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, isLoadableBodyweight, withBodyweight, excludeSpeedSets, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import { isTimedExercise, suggestTimedTarget } from '@/lib/program/timed'
import { EXERCISE_MUSCLE } from '@/lib/program/analytics'
import { reintroActive, isReintroSet, REINTRO_VOLUME_PCT, REINTRO_RIR_CAP } from '@/lib/program/reintro'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'#17BEBB', B:'#2DD4A0', C:'#A885F2', D:'#FFB23E', E:'#F25C54' }

// ── Active Set Card (current set being logged) ────────────────────
// ── Plate calculator ─────────────────────────────────────────────────
// Per-side plate math. Works for a standard barbell (base 45) or any
// plate-loaded machine (Hammer Strength, Hack, Leg Press…) where the
// user types the machine's base/carriage weight.
const PLATE_DENOMS = [45, 35, 25, 10, 5, 2.5]

function computePlates(target: number, base: number, denoms = PLATE_DENOMS) {
  const perSide = (target - base) / 2
  if (!isFinite(perSide) || perSide <= 0) {
    return { plates: [] as { p:number; n:number }[], achievable: base, short: 0, perSide: Math.max(0, perSide) }
  }
  let remaining = perSide
  const plates: { p:number; n:number }[] = []
  for (const p of denoms) {
    const n = Math.floor(remaining / p + 1e-9)
    if (n > 0) { plates.push({ p, n }); remaining -= n * p }
  }
  const loadedPerSide = perSide - remaining
  return { plates, achievable: base + loadedPerSide * 2, short: remaining * 2, perSide }
}

function PlateCalc({ exerciseName, weight, accentColor }: { exerciseName:string; weight:number; accentColor:string }) {
  const lname = exerciseName.toLowerCase()
  const isMachine = /hammer|hack|leg press|v-squat|sled/.test(lname)
  const inferBase = () => isMachine ? 0 : /smith/.test(lname) ? 25 : 45
  const storeKey = `cg_base_${exerciseName}`
  const [open, setOpen] = useState(false)
  const [base, setBase] = useState<number>(() => {
    if (typeof window === 'undefined') return inferBase()
    const saved = localStorage.getItem(storeKey)
    return saved != null && saved !== '' ? parseFloat(saved) : inferBase()
  })
  const setBaseP = (v:number) => { setBase(v); if (typeof window !== 'undefined') localStorage.setItem(storeKey, String(v)) }

  const { plates, achievable, short, perSide } = computePlates(weight, base)
  const exact = short < 0.01

  return (
    <div style={{ marginTop:-4, marginBottom:16 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'inline-flex', alignItems:'center', gap:6,
        fontSize:12, fontWeight:700, color:accentColor, background:`color-mix(in srgb, ${accentColor} 12%, transparent)`,
        border:`0.5px solid color-mix(in srgb, ${accentColor} 30%, transparent)`, padding:'6px 12px', borderRadius:999 }}>
        🏋 Plates per side {open ? '⌃' : '⌄'}
      </button>

      {open && (
        <div style={{ marginTop:10, padding:'14px', borderRadius:14, background:'rgba(11,42,51,0.6)',
          border:'0.5px solid rgba(84,84,88,0.4)' }}>
          {/* base weight */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div>
              <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                {isMachine ? 'Machine base weight' : 'Bar weight'}
              </p>
              <p style={{ fontSize:10, color:'rgba(239,250,248,0.4)', marginTop:1 }}>
                {isMachine ? 'Empty carriage — type your machine\u2019s value' : 'Standard barbell = 45 lb'}
              </p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <input type="number" inputMode="decimal" value={base || ''} onChange={e=>setBaseP(parseFloat(e.target.value)||0)}
                onFocus={e=>e.target.select()}
                style={{ width:64, background:'rgba(118,118,128,0.2)', border:'none', outline:'none', borderRadius:10,
                  padding:'8px', fontSize:16, fontWeight:700, color:'#fff', textAlign:'center' }} />
              <span style={{ fontSize:12, color:'#8E8E93' }}>lbs</span>
            </div>
          </div>

          {/* breakdown */}
          {perSide <= 0 ? (
            <p style={{ fontSize:13, color:'rgba(239,250,248,0.6)' }}>
              {weight <= base
                ? `Just the ${base} lb ${isMachine ? 'base' : 'bar'} — no plates needed.`
                : 'Enter a weight above to see the plate breakdown.'}
            </p>
          ) : (
            <>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6, alignItems:'center' }}>
                {plates.flatMap(({p,n}) => Array.from({length:n}, (_,i)=>(
                  <span key={`${p}-${i}`} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center',
                    minWidth:38, height: 30 + (p>=45?10:p>=25?5:0), padding:'0 10px', borderRadius:8,
                    fontSize:14, fontWeight:800, color:'#04161E',
                    background:`color-mix(in srgb, ${accentColor} ${p>=45?92:p>=25?78:64}%, #fff)` }}>{p}</span>
                )))}
              </div>
              <p style={{ fontSize:13, color:'rgba(239,250,248,0.85)', marginTop:10 }}>
                <b style={{ color:'#fff' }}>{plates.map(({p,n})=>`${n}×${p}`).join('  ·  ')}</b> on each side
              </p>
              <p style={{ fontSize:12, color: exact ? '#2DD4A0' : '#FFB23E', marginTop:3 }}>
                {exact
                  ? `= ${achievable} lbs total`
                  : `Closest with standard plates: ${achievable} lbs (${short.toFixed(1)} lb short of ${weight})`}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Warm-up ramp ─────────────────────────────────────────────────────
// Evidence-based specific warm-up: a few ramp sets at increasing % of the
// working weight with decreasing reps. Primes the movement pattern and the
// nervous system without accruing fatigue (top warm-up stays below the
// working load, low total reps). Offered only on the first primary lift of
// each muscle group — later lifts for that muscle are already warm.
// Warm-up sets are guidance only: not logged, and they never start the rest timer.
function warmupScheme(working: number, round: number): { pct:number; weight:number; reps:number }[] {
  if (!working || working <= 0) return []
  const roundTo = (w:number) => Math.max(round, Math.round(w / round) * round)
  const raw = [ { pct:0.50, reps:5 }, { pct:0.70, reps:3 }, { pct:0.85, reps:2 } ]
  const out: { pct:number; weight:number; reps:number }[] = []
  let lastW = -1
  for (const s of raw) {
    const w = roundTo(working * s.pct)
    if (w >= working) continue   // a warm-up is never at/above the working weight
    if (w === lastW) continue    // dedupe after rounding
    out.push({ pct: s.pct, weight: w, reps: s.reps })
    lastW = w
  }
  return out
}

// ── Coaching bubble ──────────────────────────────────────────────────
// A small, tappable pill that expands to explain the weight: whether it
// jumped since last session, and WHY (the smart-suggestion reason, which
// includes the double-progression signal — e.g. "hit top of rep range,
// load increased"). Collapsed by default so it never clutters the screen,
// and it only renders when there's something worth saying.
function CoachBubble({ target, lastWeight, isBodyweight, accentColor, reasonMain, loggedEst, drift }: {
  target:number; lastWeight:number|null; isBodyweight:boolean; accentColor:string;
  reasonMain:string; loggedEst:number|null;
  drift: { pct:number; loggedEst:number; onRebaseline:()=>void; onDismiss:()=>void } | null
}) {
  const [open, setOpen] = useState(false)
  const jump = (!isBodyweight && lastWeight != null && target > 0) ? target - lastWeight : null
  const hasJump = jump != null && Math.abs(jump) >= 0.5
  if (!hasJump && !reasonMain && !drift) return null

  // At-a-glance color/arrow always means "change vs last time".
  const dirColor = (jump ?? 0) > 0 ? '#2DD4A0'
                 : (jump ?? 0) < 0 ? '#FFB23E' : accentColor
  const label = hasJump
    ? (jump! > 0 ? `Up ${Math.round(jump!)} lbs from last time` : `Down ${Math.round(-jump!)} lbs from last time`)
    : 'Why this weight?'

  return (
    <div style={{ marginBottom:4 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'6px 11px',
        borderRadius:999, background:'rgba(118,118,128,0.12)', border:'0.5px solid rgba(84,84,88,0.35)' }}>
        <Lightbulb size={13} style={{ color: drift ? '#FFB23E' : accentColor, flexShrink:0 }} strokeWidth={2.2} />
        <span style={{ fontSize:12, fontWeight:600, color: hasJump ? dirColor : '#fff' }}>{label}</span>
        {drift && <span style={{ width:6, height:6, borderRadius:'50%', background:'#FFB23E', flexShrink:0 }} />}
        <span style={{ fontSize:11, color:'#8E8E93' }}>{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div style={{ marginTop:8, padding:'12px 14px', borderRadius:12, background:'rgba(118,118,128,0.08)',
          border:'0.5px solid rgba(84,84,88,0.3)', display:'flex', flexDirection:'column', gap:8 }}>
          {hasJump && (
            <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
              <span style={{ fontSize:15, fontWeight:800, color:dirColor }}>{jump! > 0 ? '↑' : '↓'} {Math.round(Math.abs(jump!))} lbs</span>
              <span style={{ fontSize:13, color:'rgba(239,250,248,0.65)' }}>{lastWeight} → {target} lbs since last session</span>
            </div>
          )}
          {reasonMain && <p style={{ fontSize:13, color:'rgba(239,250,248,0.85)', lineHeight:1.5 }}>{reasonMain}</p>}
          {loggedEst != null && !drift && (
            <p style={{ fontSize:11, color:'#8E8E93' }}>Your logged sets estimate a 1RM of ~{loggedEst} lbs.</p>
          )}
          {drift && (
            <div style={{ borderRadius:10, padding:'11px 12px', background:'rgba(255,178,62,0.1)',
              border:'0.5px solid rgba(255,178,62,0.35)', display:'flex', flexDirection:'column', gap:9 }}>
              <p style={{ fontSize:12, fontWeight:800, color:'#FFB23E', textTransform:'uppercase', letterSpacing:'0.06em' }}>1RM check</p>
              <p style={{ fontSize:12.5, color:'rgba(239,250,248,0.85)', lineHeight:1.5 }}>
                Your recent sets estimate ~{drift.loggedEst} lbs — {drift.pct>0?'above':'below'} this cycle&rsquo;s training max by {Math.abs(Math.round(drift.pct*100))}%. If your starting number was off, re-baseline now; otherwise keep it and it&rsquo;ll update at the end of the cycle.
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={drift.onRebaseline} style={{ flex:1, height:38, borderRadius:10, background:'#FFB23E', color:'#04161E', fontSize:13, fontWeight:700 }}>
                  Re-baseline to {drift.loggedEst} lbs
                </button>
                <button onClick={drift.onDismiss} style={{ padding:'0 16px', height:38, borderRadius:10, background:'rgba(118,118,128,0.18)', color:'#8E8E93', fontSize:13, fontWeight:600 }}>
                  Keep
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WarmupSets({ working, round, accentColor, exerciseName }: {
  working:number; round:number; accentColor:string; exerciseName:string
}) {
  const ramp = warmupScheme(working, round)
  const storeKey = `cg_warmup_open_${exerciseName}`
  const [openW, setOpenW] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    const v = localStorage.getItem(storeKey); return v == null ? true : v === '1'
  })
  const [doneIdx, setDoneIdx] = useState<Set<number>>(new Set())
  if (!ramp.length) return null
  const toggleOpen = () => setOpenW(o => { const n = !o; if (typeof window !== 'undefined') localStorage.setItem(storeKey, n?'1':'0'); return n })
  const toggleDone = (i:number) => setDoneIdx(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })

  return (
    <div style={{ borderRadius:12, border:'0.5px solid rgba(84,84,88,0.3)', background:'rgba(118,118,128,0.06)', overflow:'hidden', marginBottom:4 }}>
      <button onClick={toggleOpen} style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'10px 12px' }}>
        <Flame size={14} style={{ color:accentColor, flexShrink:0 }} strokeWidth={2.2} />
        <span style={{ fontSize:12, fontWeight:700, color:'#fff', textTransform:'uppercase', letterSpacing:'0.06em' }}>Warm-up</span>
        <span style={{ fontSize:11, color:'#8E8E93' }}>· optional · no rest timer</span>
        <span style={{ marginLeft:'auto', fontSize:12, color:'#8E8E93' }}>{openW ? '⌃' : '⌄'}</span>
      </button>
      {openW && (
        <div style={{ padding:'0 12px 12px', display:'flex', flexDirection:'column', gap:6 }}>
          <p style={{ fontSize:11, color:'rgba(239,250,248,0.45)', lineHeight:1.45, marginBottom:2 }}>
            Ramp to your working weight to prime the movement without fatigue. These aren&rsquo;t logged.
          </p>
          {ramp.map((s, i) => {
            const isDone = doneIdx.has(i)
            return (
              <button key={i} onClick={()=>toggleDone(i)} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 10px', borderRadius:10,
                background: isDone ? 'rgba(45,212,160,0.1)' : 'rgba(118,118,128,0.1)',
                border:`0.5px solid ${isDone ? 'rgba(45,212,160,0.4)' : 'rgba(84,84,88,0.3)'}`, textAlign:'left' }}>
                <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
                  border:`1.5px solid ${isDone ? '#2DD4A0' : 'rgba(142,142,147,0.5)'}`, background: isDone ? '#2DD4A0' : 'transparent' }}>
                  {isDone && <Check size={13} strokeWidth={3} style={{ color:'#04161E' }} />}
                </div>
                <span style={{ fontSize:11, fontWeight:700, color:'#8E8E93', width:42 }}>{Math.round(s.pct*100)}%</span>
                <span style={{ fontSize:15, fontWeight:700, color: isDone ? '#8E8E93' : '#fff' }}>
                  {s.weight} <span style={{ fontSize:12, color:'#8E8E93', fontWeight:500 }}>lbs</span>
                </span>
                <span style={{ marginLeft:'auto', fontSize:13, color:'#8E8E93' }}>× {s.reps}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Timed hold card (planks, wall sits, carries) ────────────────────
// Duration-based sets: a large adjustable countdown instead of reps.
// Completing (or stopping) the hold logs the set through the normal
// path, so the rest timer starts automatically like any logged set.
function TimedSetCard({ setNum, setCount, suggestSec, suggestWt, note, accentColor, onLog, dbMode = false }: {
  setNum:number; setCount:number; suggestSec:number; suggestWt:number; note:string
  accentColor:string; onLog:(weight:number|null, seconds:number)=>void; dbMode?:boolean
}) {
  const [targetSec, setTargetSec] = useState(suggestSec)
  const [wt, setWt]               = useState(suggestWt)
  const [running, setRunning]     = useState(false)
  const [endTime, setEndTime]     = useState(0)
  const [rem, setRem]             = useState(suggestSec)
  const lastBeeped = useRef(0)
  const loggedRef  = useRef(false)

  useEffect(() => { if (!running) setRem(targetSec) }, [targetSec, running])

  useEffect(() => {
    if (!running) return
    ensureBeepCtx()
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRem(remaining)
      if (remaining >= 1 && remaining <= 3 && lastBeeped.current !== remaining) {
        lastBeeped.current = remaining
        countdownBeep(remaining === 1)
      }
      if (remaining <= 0 && !loggedRef.current) {
        loggedRef.current = true
        setRunning(false)
        onLog(wt > 0 ? wt : null, targetSec)   // full hold completed → log + rest starts
      }
    }, 250)
    return () => clearInterval(id)
  }, [running, endTime, targetSec, wt, onLog])

  const start = () => {
    ensureBeepCtx()
    loggedRef.current = false
    lastBeeped.current = 0
    setEndTime(Date.now() + targetSec * 1000)
    setRem(targetSec)
    setRunning(true)
  }
  const stopAndLog = () => {
    if (loggedRef.current) return
    loggedRef.current = true
    setRunning(false)
    const held = Math.max(1, targetSec - rem)   // actual seconds held
    onLog(wt > 0 ? wt : null, held)
  }

  const mm = Math.floor(rem / 60), ss = rem % 60
  const pct = targetSec > 0 ? (targetSec - rem) / targetSec : 0

  return (
    <div style={{ borderRadius:16, border:`1px solid ${accentColor}55`,
      background:`linear-gradient(160deg, color-mix(in srgb, ${accentColor} 9%, transparent) 0%, rgba(13,13,20,0) 100%)`,
      padding:'16px' }}>
      <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
        letterSpacing:'0.1em', marginBottom:10, display:'flex', alignItems:'center', gap:8 }}>
        Set {setNum} of {setCount}
        <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6,
          background:`color-mix(in srgb, ${accentColor} 16%, transparent)`, color:accentColor, letterSpacing:'0.06em' }}>
          ⏱ TIMED HOLD
        </span>
      </p>

      {!running ? (<>
        <p style={{ fontSize:12, color:'rgba(239,250,248,0.55)', lineHeight:1.5, marginBottom:14 }}>{note}</p>

        {/* Duration stepper */}
        <div style={{ marginBottom:14 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Hold duration</p>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>setTargetSec(s=>Math.max(10, s-5))} style={{ width:44, height:44, borderRadius:12,
              background:'rgba(118,118,128,0.14)', border:'0.5px solid rgba(84,84,88,0.35)', color:'#fff' }}><Minus size={18} style={{ margin:'0 auto' }} /></button>
            <div style={{ flex:1, textAlign:'center' }}>
              <span style={{ fontSize:40, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums' }}>{targetSec}</span>
              <span style={{ fontSize:14, color:'#8E8E93', fontWeight:600 }}> sec</span>
            </div>
            <button onClick={()=>setTargetSec(s=>s+5)} style={{ width:44, height:44, borderRadius:12,
              background:'rgba(118,118,128,0.14)', border:'0.5px solid rgba(84,84,88,0.35)', color:'#fff' }}><Plus size={18} style={{ margin:'0 auto' }} /></button>
          </div>
        </div>

        {/* Optional added load */}
        <div style={{ marginBottom:16 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:8 }}>Added weight (optional)</p>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <button onClick={()=>setWt(w=>Math.max(0, w - (dbMode ? dumbbellStep(w,-1) : 5)))} style={{ width:44, height:44, borderRadius:12,
              background:'rgba(118,118,128,0.14)', border:'0.5px solid rgba(84,84,88,0.35)', color:'#fff' }}><Minus size={18} style={{ margin:'0 auto' }} /></button>
            <div style={{ flex:1, textAlign:'center' }}>
              <span style={{ fontSize:26, fontWeight:800, color: wt>0 ? '#fff' : '#8E8E93', fontVariantNumeric:'tabular-nums' }}>{wt>0 ? `+${wt}` : 'BW'}</span>
              {wt>0 && <span style={{ fontSize:13, color:'#8E8E93', fontWeight:600 }}> lbs</span>}
            </div>
            <button onClick={()=>setWt(w=>w + (dbMode ? dumbbellStep(w,1) : 5))} style={{ width:44, height:44, borderRadius:12,
              background:'rgba(118,118,128,0.14)', border:'0.5px solid rgba(84,84,88,0.35)', color:'#fff' }}><Plus size={18} style={{ margin:'0 auto' }} /></button>
          </div>
        </div>

        <button onClick={start} style={{ width:'100%', padding:'15px', borderRadius:14,
          background:accentColor, color:'#04161E', fontSize:16, fontWeight:800,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          Start Hold
        </button>
      </>) : (<>
        {/* Running: the big countdown */}
        <div style={{ textAlign:'center', padding:'8px 0 14px' }}>
          <span style={{ fontSize:76, fontWeight:800, color:'#fff', fontVariantNumeric:'tabular-nums', lineHeight:1 }}>
            {mm > 0 ? `${mm}:${String(ss).padStart(2,'0')}` : ss}
          </span>
          {mm === 0 && <span style={{ fontSize:20, color:'#8E8E93', fontWeight:700 }}> s</span>}
          {wt > 0 && <p style={{ fontSize:13, color:'#8E8E93', marginTop:6 }}>holding +{wt} lbs</p>}
        </div>
        <div style={{ height:6, borderRadius:3, background:'rgba(118,118,128,0.18)', overflow:'hidden', marginBottom:16 }}>
          <div style={{ height:'100%', width:`${pct*100}%`, background:accentColor, transition:'width 0.25s linear' }} />
        </div>
        <button onClick={stopAndLog} style={{ width:'100%', padding:'15px', borderRadius:14,
          background:'rgba(255,178,62,0.16)', border:'1px solid rgba(255,178,62,0.45)', color:'#FFB23E',
          fontSize:15, fontWeight:800 }}>
          Stop & Log ({Math.max(1, targetSec - rem)}s held)
        </button>
      </>)}
    </div>
  )
}

function ActiveSetCard({ setNum, setCount, target, repsRange, lastWeight, isBodyweight, accentColor, exerciseName, onLog, beltMode = false, speedMode = false, dbMode = false }: {
  // beltMode: weighted dips/pull-ups — target/wt are BELT (added) weight
  setNum:number; setCount:number; target:number; repsRange:string
  lastWeight:number|null; isBodyweight:boolean; accentColor:string; exerciseName:string; beltMode?:boolean; speedMode?:boolean; dbMode?:boolean
  onLog:(w:number|null, r:number, rir:number, tempo:string)=>Promise<void>
}) {
  const parts   = repsRange.replace('–','-').split('-').map(Number)
  const maxReps = parts[1] || parts[0] || 10

  const [wt,    setWt]   = useState(isBodyweight && !beltMode ? 0 : (target > 0 ? target : lastWeight ?? 0))
  const [reps,  setReps] = useState(maxReps)
  const [rir,   setRir]  = useState(3)
  const [tempo, setTempo]= useState<string>('Standard')
  const [busy,  setBusy] = useState(false)

  // Smart suggestions load async after mount.
  // Two failure cases:
  //  1. wt=0 (no lastWeight, target not loaded yet) — original bug
  //  2. wt=lastWeight (fallback), target arrives with a different value — this bug
  // Fix: sync to target whenever it first arrives positive, unless user already edited.
  const didSync    = useRef(false)
  const userEdited = useRef(false)

  useEffect(() => {
    if ((isBodyweight && !beltMode) || didSync.current || userEdited.current) return
    if (target > 0) {
      setWt(target)
      didSync.current = true
    }
  }, [target, isBodyweight])

  const TEMPOS: { code:string; label:string; purpose:string; hint:string }[] = [
    { code:'Standard', label:'Standard', purpose:'',           hint:'Controlled movement at natural speed' },
    { code:'3-0-1',    label:'3-0-1',   purpose:'Hypertrophy', hint:'3-sec lower · no pause · explode up — best for muscle growth' },
    { code:'4-0-1',    label:'4-0-1',   purpose:'Max Hypertrophy', hint:'4-sec lower · no pause · explode up — peak time-under-tension' },
    { code:'3-1-1',    label:'3-1-1',   purpose:'Mind-Muscle', hint:'3-sec lower · 1-sec pause at stretch · explode up' },
    { code:'2-2-1',    label:'2-2-1',   purpose:'Strength',    hint:'2-sec lower · 2-sec pause at sticking point · lift — builds strength at weak angles' },
    { code:'2-0-2',    label:'2-0-2',   purpose:'Beginner',    hint:'2-sec lower · no pause · 2-sec lift — controlled, safe for learning movement' },
  ]

  const adjust = (field: 'wt'|'reps', delta: number) => {
    if (field === 'wt')   { userEdited.current = true; setWt(w  => Math.max(0, w  + delta)) }
    if (field === 'reps') setReps(r => Math.max(1, r  + delta))
  }

  const commit = async () => {
    if (busy) return
    setBusy(true)
    try {
      await onLog(wt > 0 ? wt : null, reps, rir, tempo)
    } catch(e) {
      console.error('Log failed:', e)
      // busy resets in finally — user can retry
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ borderRadius:16,
      border: speedMode ? '1px dashed rgba(255,214,10,0.5)' : `1px solid ${accentColor}55`,
      background: speedMode
        ? 'linear-gradient(160deg, rgba(255,214,10,0.07) 0%, rgba(13,13,20,0) 100%)'
        : `linear-gradient(160deg, color-mix(in srgb, ${accentColor} 9%, transparent) 0%, rgba(13,13,20,0) 100%)`,
      padding:'16px' }}>

      <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
        letterSpacing:'0.1em', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
        Set {setNum} of {setCount}
        {speedMode && (
          <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:6,
            background:'rgba(255,214,10,0.14)', color:'#FFD60A', letterSpacing:'0.06em' }}>
            <Zap size={10} strokeWidth={2.6} /> SPEED
          </span>
        )}
      </p>

      {/* Weight stepper — always shown; for BW exercises it means added load */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
            letterSpacing:'0.08em' }}>
            {isBodyweight ? 'Added Weight' : 'Weight'}
          </p>
          {isBodyweight && (
            <span style={{ fontSize:11, color:'rgba(255,178,62,0.7)',
              background:'rgba(255,178,62,0.1)', padding:'2px 7px', borderRadius:6 }}>
              belt · vest · optional
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>adjust('wt', dbMode ? -dumbbellStep(wt,-1) : -5)} style={{ width:44, height:44, borderRadius:12,
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Minus size={18} strokeWidth={2.5} style={{ color:'#fff' }} />
          </button>
          <div style={{ flex:1, textAlign:'center' }}>
            <input type="number" inputMode="decimal"
              value={wt || ''} onChange={e => { userEdited.current = true; setWt(parseFloat(e.target.value)||0) }}
              onFocus={e => e.target.select()}
              placeholder={isBodyweight ? '0' : ''}
              style={{ width:'100%', background:'transparent', border:'none', outline:'none',
                fontSize:42, fontWeight:800, color:'#fff', textAlign:'center',
                letterSpacing:'-1px' }} />
            <p style={{ fontSize:13, color:'#8E8E93', marginTop:-4 }}>
              {isBodyweight ? (wt > 0 ? 'lbs added' : 'bodyweight') : 'lbs'}
            </p>
          </div>
          <button onClick={()=>adjust('wt', dbMode ? dumbbellStep(wt,1) : +5)} style={{ width:44, height:44, borderRadius:12,
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Plus size={18} strokeWidth={2.5} style={{ color:accentColor }} />
          </button>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          {(dbMode ? [-5,-2.5,+2.5,+5] : [-10,-5,+5,+10]).map(d => (
            <button key={d} onClick={()=>adjust('wt',d)} style={{ flex:1, height:36, borderRadius:10,
              background:'rgba(118,118,128,0.15)', fontSize:13, fontWeight:700,
              color: d<0 ? '#8E8E93' : accentColor }}>
              {d>0?`+${d}`:d}
            </button>
          ))}
        </div>
      </div>

      {/* Plate calculator — only for loaded (non-bodyweight) lifts */}
      {!isBodyweight && <PlateCalc exerciseName={exerciseName} weight={wt} accentColor={accentColor} />}

      {/* Reps stepper */}
      <div style={{ marginBottom:16 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:8 }}>Reps</p>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>adjust('reps',-1)} style={{ width:44, height:44, borderRadius:12,
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Minus size={18} strokeWidth={2.5} style={{ color:'#fff' }} />
          </button>
          <div style={{ flex:1, textAlign:'center' }}>
            <p style={{ fontSize:42, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>{reps}</p>
            <p style={{ fontSize:13, color:'#8E8E93', marginTop:-4 }}>reps · goal {repsRange}</p>
          </div>
          <button onClick={()=>adjust('reps',+1)} style={{ width:44, height:44, borderRadius:12,
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Plus size={18} strokeWidth={2.5} style={{ color:accentColor }} />
          </button>
        </div>
      </div>

      {/* RIR picker */}
      <div style={{ marginBottom:18 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:8 }}>Reps in Reserve (RIR)</p>
        <div style={{ display:'flex', gap:8 }}>
          {[0,1,2,3,4].map(v => (
            <button key={v} onClick={()=>setRir(v)} style={{ flex:1, height:42, borderRadius:12,
              background: rir===v ? accentColor : 'rgba(118,118,128,0.15)',
              fontSize:15, fontWeight:800, color: rir===v ? '#04161E' : '#8E8E93',
              transition:'background 0.15s' }}>
              {v===4?'4+':v}
            </button>
          ))}
        </div>
        <p style={{ fontSize:11, color:'#8E8E93', marginTop:6, textAlign:'center' }}>
          {rir===0?'Nothing left — max effort':rir===1?'1 more rep in the tank':rir===2?'2 reps left — on prescription':rir===3?'3 reps left — feeling fresh':'4+ reps left — very easy'}
        </p>
      </div>

      {/* Tempo selector — horizontal rolling dial (one row, saves space) */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Eccentric Tempo
          </p>
          <span style={{ fontSize:11, color:'rgba(23,190,187,0.7)', background:'rgba(23,190,187,0.1)',
            padding:'2px 7px', borderRadius:6 }}>optional</span>
          <span style={{ marginLeft:'auto', fontSize:14, fontWeight:800, color:accentColor, letterSpacing:'-0.2px' }}>{tempo}</span>
        </div>
        <div className="no-scrollbar" style={{ display:'flex', gap:8, overflowX:'auto', scrollSnapType:'x mandatory',
          paddingBottom:2, WebkitOverflowScrolling:'touch', marginInline:-2, paddingInline:2 }}>
          {TEMPOS.map(t => {
            const sel = tempo === t.code
            return (
              <button key={t.code} onClick={()=>setTempo(t.code)}
                style={{ scrollSnapAlign:'center', flexShrink:0, minWidth:74, padding:'8px 12px', borderRadius:12,
                  background: sel ? accentColor : 'rgba(118,118,128,0.15)',
                  border: sel ? 'none' : '0.5px solid rgba(84,84,88,0.3)',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2, transition:'all 0.15s' }}>
                <span style={{ fontSize:14, fontWeight:800, color: sel ? '#04161E' : '#fff' }}>{t.code}</span>
                <span style={{ fontSize:9, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap',
                  color: sel ? 'rgba(4,22,30,0.7)' : 'rgba(142,142,147,0.85)' }}>{t.purpose || 'Default'}</span>
              </button>
            )
          })}
        </div>
        {tempo !== 'Standard' && (
          <p style={{ fontSize:12, color:'rgba(23,190,187,0.85)', marginTop:8,
            background:'rgba(23,190,187,0.08)', padding:'8px 12px', borderRadius:10, lineHeight:1.5 }}>
            💡 {TEMPOS.find(t=>t.code===tempo)?.hint}
          </p>
        )}
      </div>

      {/* LOG button */}
      <button onClick={commit} disabled={busy}
        style={{ width:'100%', height:54, borderRadius:14, fontSize:17, fontWeight:800,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background: busy ? 'rgba(118,118,128,0.3)' : accentColor,
          color: busy ? '#8E8E93' : '#04161E', letterSpacing:'-0.3px',
          boxShadow: busy ? 'none' : `0 4px 20px ${accentColor}55`,
          transition:'background 0.15s, box-shadow 0.15s' }}>
        {busy
          ? <div style={{ width:20, height:20, borderRadius:'50%', border:'2.5px solid transparent',
              borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
          : <><Check size={20} strokeWidth={3} /> Log Set {setNum}</>}
      </button>
    </div>
  )
}

// ── Logged set row (compact) ──────────────────────────────────────
function LoggedRow({ setNum, weight, reps, rir, speed = false, timed = false, editable = false, onSave }: {
  setNum:number; weight:number|null; reps:number; rir?:number; speed?:boolean; timed?:boolean
  editable?:boolean; onSave?:(patch:{ weight_lbs:number|null; reps:number; rir?:number|null })=>Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy]       = useState(false)
  const [eWt, setEWt]         = useState(weight ?? 0)
  const [eReps, setEReps]     = useState(reps)
  const [eRir, setERir]       = useState<number|undefined>(rir)

  const openEdit = () => { setEWt(weight ?? 0); setEReps(reps); setERir(rir); setEditing(true) }
  const save = async () => {
    if (busy || !onSave) return
    setBusy(true)
    try {
      await onSave({ weight_lbs: eWt > 0 ? eWt : null, reps: Math.max(1, eReps), rir: (speed || timed) ? undefined : eRir ?? null })
      setEditing(false)
    } catch {}
    setBusy(false)
  }

  if (editing) return (
    <div style={{ padding:'12px 14px', borderRadius:12,
      background:'rgba(45,212,160,0.08)', border:'1px solid rgba(45,212,160,0.45)' }}>
      <p style={{ fontSize:11, fontWeight:700, color:'#2DD4A0', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>
        Editing Set {setNum}
      </p>
      <div style={{ display:'flex', gap:10, marginBottom:10 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10, color:'#8E8E93', marginBottom:4 }}>{timed ? 'ADDED LBS' : 'WEIGHT (LBS)'}</p>
          <input type="number" inputMode="decimal" value={eWt || ''}
            onChange={e => setEWt(parseFloat(e.target.value) || 0)}
            style={{ width:'100%', height:42, borderRadius:10, background:'rgba(118,118,128,0.16)',
              border:'0.5px solid rgba(84,84,88,0.4)', color:'#fff', fontSize:17, fontWeight:700,
              textAlign:'center', outline:'none' }} />
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:10, color:'#8E8E93', marginBottom:4 }}>{timed ? 'SECONDS' : 'REPS'}</p>
          <input type="number" inputMode="numeric" value={eReps || ''}
            onChange={e => setEReps(parseInt(e.target.value) || 0)}
            style={{ width:'100%', height:42, borderRadius:10, background:'rgba(118,118,128,0.16)',
              border:'0.5px solid rgba(84,84,88,0.4)', color:'#fff', fontSize:17, fontWeight:700,
              textAlign:'center', outline:'none' }} />
        </div>
      </div>
      {!speed && !timed && (
        <div style={{ marginBottom:12 }}>
          <p style={{ fontSize:10, color:'#8E8E93', marginBottom:6 }}>RIR</p>
          <div style={{ display:'flex', gap:6 }}>
            {[0,1,2,3,4].map(v => (
              <button key={v} onClick={()=>setERir(v)} style={{ flex:1, height:34, borderRadius:8,
                background: eRir===v ? 'rgba(45,212,160,0.25)' : 'rgba(118,118,128,0.15)',
                border: eRir===v ? '1px solid rgba(45,212,160,0.6)' : '0.5px solid transparent',
                color: eRir===v ? '#2DD4A0' : '#8E8E93', fontSize:13, fontWeight:700 }}>{v}</button>
            ))}
          </div>
        </div>
      )}
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={()=>setEditing(false)} style={{ flex:1, height:42, borderRadius:10,
          background:'rgba(118,118,128,0.16)', color:'#8E8E93', fontSize:14, fontWeight:700 }}>Cancel</button>
        <button onClick={save} disabled={busy} style={{ flex:2, height:42, borderRadius:10,
          background:'#2DD4A0', color:'#04161E', fontSize:14, fontWeight:800, opacity: busy ? 0.6 : 1 }}>
          {busy ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  )

  return (
    <div onClick={editable ? openEdit : undefined}
      style={{ display:'flex', alignItems:'center', gap:12, height:44, paddingInline:14,
      borderRadius:12, background:'rgba(45,212,160,0.1)', border:'0.5px solid rgba(45,212,160,0.35)',
      cursor: editable ? 'pointer' : 'default' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', background: speed ? '#FFD60A' : '#2DD4A0',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        {speed ? <Zap size={12} strokeWidth={2.6} style={{ color:'#000' }} /> : <Check size={13} strokeWidth={3} style={{ color:'#000' }} />}
      </div>
      <span style={{ fontSize:13, fontWeight:700, color: speed ? '#FFD60A' : '#fff' }}>
        {speed ? '⚡ ' : ''}Set {setNum}
      </span>
      <span style={{ fontSize:13, color:'#8E8E93', flex:1 }}>
        {timed
          ? <>{`${reps} sec hold`}{weight != null && weight > 0 && ` · +${weight} lbs`}</>
          : <>{weight != null ? `${weight} lbs` : 'Bodyweight'} × {reps} reps</>}
        {speed
          ? <span style={{ color:'rgba(255,214,10,0.75)' }}> · speed</span>
          : !timed && rir !== undefined && <span style={{ color:'rgba(45,212,160,0.8)' }}> · RIR {rir}</span>}
      </span>
      {editable && <Pencil size={13} style={{ color:'rgba(142,142,147,0.7)', flexShrink:0 }} />}
    </div>
  )
}

// ── Pending set row (future) ──────────────────────────────────────
function PendingRow({ setNum, target }: { setNum:number; target:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, height:40, paddingInline:14,
      borderRadius:12, background:'rgba(118,118,128,0.06)', border:'0.5px solid rgba(84,84,88,0.25)',
      opacity:0.5 }}>
      <div style={{ width:24, height:24, borderRadius:'50%', background:'rgba(84,84,88,0.3)',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <span style={{ fontSize:11, fontWeight:700, color:'#8E8E93' }}>{setNum}</span>
      </div>
      <span style={{ fontSize:13, color:'#8E8E93' }}>
        {target > 0 ? `${target} lbs · upcoming` : 'Upcoming'}
      </span>
    </div>
  )
}

// ── Drop Set Row ─────────────────────────────────────────────────
function DropSetRow({ lastWeight, repsRange, accentColor, onLog, dbMode = false }: {
  lastWeight:number; repsRange:string; accentColor:string
  onLog:(w:number,r:number)=>Promise<void>; dbMode?:boolean
}) {
  const suggestedWt = Math.round(lastWeight * 0.80 / 5) * 5  // 80% rounded to 5
  const [_, maxR]   = repsRange.replace('–','-').split('-').map(Number)
  const [wt,   setWt]   = useState(suggestedWt)
  const [reps, setReps] = useState(maxR + 2)  // drop sets typically allow more reps
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const commit = async () => {
    if (busy || done) return
    setBusy(true)
    await onLog(wt, reps)
    setBusy(false)
    setDone(true)
  }


  if (done) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px',
      borderRadius:12, background:'rgba(45,212,160,0.1)', border:'0.5px solid rgba(45,212,160,0.35)',
      marginBottom:8 }}>
      <Check size={14} strokeWidth={3} style={{ color:'#2DD4A0' }} />
      <span style={{ fontSize:13, color:'#2DD4A0', fontWeight:600 }}>Drop set logged · {wt} lbs × {reps}</span>
    </div>
  )

  return (
    <div style={{ marginBottom:8 }}>
      {!open ? (
        <button onClick={()=>setOpen(true)} style={{ width:'100%', padding:'10px 14px',
          borderRadius:12, background:'rgba(255,178,62,0.08)',
          border:`0.5px solid rgba(255,178,62,0.3)`,
          display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>🔽</span>
          <div style={{ flex:1, textAlign:'left' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#FFB23E' }}>Add Drop Set</p>
            <p style={{ fontSize:11, color:'#8E8E93' }}>Suggested: {suggestedWt} lbs (−20%) · to failure</p>
          </div>
        </button>
      ) : (
        <div style={{ padding:'12px 14px', borderRadius:12,
          background:'rgba(255,178,62,0.08)', border:'0.5px solid rgba(255,178,62,0.35)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#FFB23E', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:10 }}>Drop Set — reduce weight · push to failure</p>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:10, color:'#8E8E93', marginBottom:4 }}>WEIGHT</p>
              <div style={{ display:'flex', gap:6 }}>
                {(dbMode ? [-5,-2.5,+2.5,+5] : [-10,-5,+5,+10]).map(d => (
                  <button key={d} onClick={()=>setWt(w=>Math.max(0,w+d))} style={{ flex:1,
                    height:34, borderRadius:8, background:'rgba(118,118,128,0.2)',
                    fontSize:12, fontWeight:700, color: d<0?'#8E8E93':accentColor }}>
                    {d>0?`+${d}`:d}
                  </button>
                ))}
              </div>
              <p style={{ fontSize:24, fontWeight:800, color:'#fff', textAlign:'center',
                marginTop:4, letterSpacing:'-0.5px' }}>{wt} <span style={{ fontSize:13, color:'#8E8E93' }}>lbs</span></p>
            </div>
            <div style={{ width:1, height:60, background:'rgba(84,84,88,0.4)' }} />
            <div style={{ width:80 }}>
              <p style={{ fontSize:10, color:'#8E8E93', marginBottom:4 }}>REPS</p>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <button onClick={()=>setReps(r=>r+1)} style={{ height:28, borderRadius:7,
                  background:'rgba(118,118,128,0.2)', fontSize:14, color:accentColor }}>+</button>
                <p style={{ fontSize:24, fontWeight:800, color:'#fff', textAlign:'center',
                  letterSpacing:'-0.5px' }}>{reps}</p>
                <button onClick={()=>setReps(r=>Math.max(1,r-1))} style={{ height:28, borderRadius:7,
                  background:'rgba(118,118,128,0.2)', fontSize:14, color:'#8E8E93' }}>−</button>
              </div>
            </div>
          </div>
          <button onClick={commit} disabled={busy} style={{ width:'100%', height:44, borderRadius:12,
            background:'#FFB23E', color:'#04161E', fontSize:14, fontWeight:800,
            display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
            {busy ? <div style={{ width:16, height:16, borderRadius:'50%', border:'2px solid transparent',
              borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
              : <><Check size={15} strokeWidth={3} /> Log Drop Set</>}
          </button>
        </div>
      )}
    </div>
  )
}

// ── Rest-timer countdown beeps ─────────────────────────────────────
// Web Audio chirp at 3-2-1 seconds remaining: "get ready to work."
// Context is created lazily and resumed on RestPill mount — the timer
// always starts from a tap (Log Set), which satisfies iOS's
// user-gesture requirement for audio.
let _beepCtx: AudioContext | null = null
function ensureBeepCtx() {
  try {
    const AC = window.AudioContext ?? (window as any).webkitAudioContext
    if (!AC) return null
    if (!_beepCtx) _beepCtx = new AC()
    if (_beepCtx.state === 'suspended') _beepCtx.resume()
    return _beepCtx
  } catch { return null }
}
function countdownBeep(final = false) {
  const ctx = ensureBeepCtx()
  if (!ctx) return
  try {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    // Triangle wave cuts through music far better than sine at the same
    // gain, and 0.95 puts the chirp at media volume instead of ~9 dB under.
    o.type = 'triangle'
    o.frequency.value = final ? 1175 : 880   // last beep a step higher: GO
    const t = ctx.currentTime
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.95, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + (final ? 0.3 : 0.18))
    o.connect(g); g.connect(ctx.destination)
    o.start(t); o.stop(t + (final ? 0.32 : 0.2))
  } catch {}
}

// ── Rest Timer ────────────────────────────────────────────────────
function RestPill({ seconds, exName, onDone, onRestPause }: {
  seconds:number; exName:string; onDone:()=>void; onRestPause:()=>void
}) {
  // Absolute end timestamp so the timer recovers correctly after
  // the iPhone screen locks (JS setTimeout freezes while screen is off)
  const [endTime] = useState(() => Date.now() + seconds * 1000)
  const [rem, setRem] = useState(seconds)
  const lastBeepedAt = useRef<number>(0)   // which remaining-second we last beeped for

  useEffect(() => {
    ensureBeepCtx()   // unlock audio while we're still in the tap's gesture chain
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRem(remaining)
      // 5-4-3-2-1 countdown chirps (each second beeps exactly once; the guard
      // also prevents a burst if the phone was locked through the window)
      if (remaining >= 1 && remaining <= 5 && lastBeepedAt.current !== remaining) {
        lastBeepedAt.current = remaining
        countdownBeep(remaining === 1)
      }
      if (remaining <= 0) {
        fireRestCompleteNotification(exName)
        onDone()
      }
    }
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [endTime, exName, onDone])

  const m=Math.floor(rem/60), s=rem%60, pct=(rem/seconds)*100
  return (
    <div className="rest-pill" style={{ gap:9 }}>
      <svg width="34" height="34" viewBox="0 0 36 36" style={{ flexShrink:0 }}>
        <defs>
          <clipPath id="rp-clip"><circle cx="18" cy="18" r="15.5" /></clipPath>
          <linearGradient id="rp-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3FE8DA" />
            <stop offset="100%" stopColor="#17BEBB" />
          </linearGradient>
        </defs>
        <circle cx="18" cy="18" r="15.5" fill="rgba(23,190,187,0.10)"
          stroke="rgba(63,232,218,0.45)" strokeWidth="1.5" />
        <g clipPath="url(#rp-clip)">
          <g style={{ transform:`translateY(${(2 + (1 - pct/100)*30) - 4}px)`, transition:'transform 1s linear' }}>
            <g className="rp-wave">
              <path d="M0 4 q4.5 -4 9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 V44 H0 Z" fill="url(#rp-water)" opacity="0.92" />
            </g>
            <g className="rp-wave2">
              <path d="M0 5 q4.5 4 9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 t9 0 V44 H0 Z" fill="url(#rp-water)" opacity="0.5" />
            </g>
          </g>
        </g>
      </svg>
      <span style={{ fontSize:17, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.3px', flexShrink:0 }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <div style={{ width:0.5, height:18, background:'rgba(84,84,88,0.6)', flexShrink:0 }} />
      <button onClick={onRestPause} title="Rest-Pause: 15s then log more reps"
        style={{ padding:'4px 9px', borderRadius:999, flexShrink:0,
        background:'rgba(23,190,187,0.25)', fontSize:11, fontWeight:700, color:'#17BEBB',
        border:'0.5px solid rgba(23,190,187,0.4)' }}>
        RP
      </button>
      <button onClick={onDone}
        style={{ padding:'4px 9px', borderRadius:999, flexShrink:0,
        background:'rgba(118,118,128,0.25)', fontSize:11, fontWeight:600, color:'#8E8E93' }}>
        Skip
      </button>
    </div>
  )
}

// ── Alternatives Sheet ────────────────────────────────────────────
function AltsSheet({ exName, equipment, onSwap, onClose }: {
  exName:string; equipment:string[]; onSwap:(n:string,c:string)=>void; onClose:()=>void
}) {
  const alts  = EXERCISE_ALTS[exName] ?? {}
  const keys  = Object.keys(alts) as EquipmentKey[]
  const avail = keys.filter(k=>equipment.includes(k))
  const other = keys.filter(k=>!equipment.includes(k))
  const Section = ({ title, items, dim=false }: { title:string; items:EquipmentKey[]; dim?:boolean }) => (
    <div style={{ opacity: dim?0.55:1 }}>
      <p style={{ fontSize:11, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{title}</p>
      <div className="ios-group">
        {items.flatMap((k,gi)=>(alts[k]??[]).map((alt,ai)=>(
          <button key={`${k}-${ai}`} onClick={()=>onSwap(alt.name,alt.cue)}
            className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}>
            <span style={{ fontSize:18, width:28, flexShrink:0 }}>{EQUIPMENT_ICONS[k]}</span>
            <div className="flex-1 text-left">
              <p style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>{alt.name}</p>
              <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', marginTop:2 }}>{alt.cue}</p>
            </div>
            <ChevronRight size={14} style={{ color:'#8E8E93', flexShrink:0 }} />
          </button>
        )))}
      </div>
    </div>
  )
  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel" onClick={e=>e.stopPropagation()}
           style={{ maxHeight:'80vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px 12px' }}>
          <div>
            <p style={{ fontSize:11, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em' }}>Alternatives</p>
            <p style={{ fontSize:18, fontWeight:700, color:'var(--label)', marginTop:2 }}>{exName}</p>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={15} style={{ color:'#8E8E93' }} />
          </button>
        </div>
        <div style={{ height:0.5, background:'rgba(84,84,88,0.6)' }} />
        <div className="overflow-y-auto flex-1" style={{ padding:16, display:'flex', flexDirection:'column', gap:16 }}>
          {avail.length>0 && <Section title="Your Equipment" items={avail} />}
          {other.length>0 && <Section title="Other Options" items={other} dim />}
        </div>
        <div style={{ padding:'12px 16px 4px' }}>
          <button onClick={onClose} style={{ width:'100%', padding:14, borderRadius:14,
            background:'rgba(118,118,128,0.18)', fontSize:15, fontWeight:600, color:'#8E8E93' }}>
            Keep Original
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────
export default function WorkoutPage({ params }: { params: Promise<{week:string;day:string}> }) {
  const { week:ws, day } = use(params)
  const wk=parseInt(ws), key=day as WorkoutKey
  const router = useRouter()

  // Resolve workout from the user's active program.
  // Falls back to Galpin 5-day if program not found.
  const activeProgramId = typeof window !== 'undefined'
    ? (localStorage.getItem('cg_program') ?? undefined) : undefined
  const activeProgram = getProgram(activeProgramId)
  const workout = activeProgram.workouts.find(w => w.key === key) ?? activeProgram.workouts[0]
  // Time-saver: antagonist/non-competing pairs among isolation exercises
  const ssPairs = getSupersetPairs(workout.exercises)

  // Guard: if someone navigates to a rest day URL, redirect to home
  if (workout.isRest) {
    if (typeof window !== 'undefined') router.replace('/')
    return <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <p style={{ color:'#8E8E93', fontSize:16 }}>🌙</p>
    </div>
  }
  const cfg     = getWeekConfig(activeProgramId, wk, workout.dayType)
  const accent  = WC[key]

  // Optional warm-up ramp on the first compound lift of each MAJOR muscle
  // group. Major = the muscles whose lead movement is a multi-joint lift
  // worth ramping (squat, bench, row, RDL, hip thrust, overhead press).
  // We don't gate on 'primary' alone because some templates (e.g. Galpin)
  // tag big compounds like the Back Squat as 'secondary' — those still get
  // a warm-up. Isolation lifts and accessory muscles (delts/arms/calves/
  // core) are skipped; they're light and the muscle is already warm.
  const warmupTargets = (() => {
    const MAJOR = new Set(['Chest','Back','Quads','Hamstrings','Glutes','Shoulders'])
    const seen = new Set<string>(), out = new Set<string>()
    workout.exercises.forEach(ex => {
      if (!MAJOR.has(ex.muscle) || seen.has(ex.muscle)) return
      if (ex.type === 'isolation' || ex.isBodyweight) return
      seen.add(ex.muscle); out.add(ex.name)
    })
    return out
  })()

  const [rms,       setRms]       = useState<Record<string,number>>({})
  const [round,     setRound]     = useState(5)
  const [bodyWt,    setBodyWt]    = useState(0)   // athlete body weight (weighted dips/pull-ups)
  const [equipment, setEquipment] = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [sid,       setSid]       = useState<string|null>(null)
  const [sets,      setSets]      = useState<Record<string,any[]>>({})
  const [lasts,     setLasts]     = useState<Record<string,number|null>>({})
  const [lastDurs,  setLastDurs]  = useState<Record<string,number|null>>({})   // timed holds: last duration (sec)
  const [smartMap,  setSmartMap]  = useState<Record<string,SmartSuggestion|null>>({})
  const [open,      setOpen]      = useState<string>(workout.exercises[0]?.name ?? '')
  const [swapped,   setSwapped]   = useState<Record<string,{name:string;cue:string}>>({})
  const [progPrefs,   setProgPrefs]   = useState<Record<string,{name:string;cue:string}>>({})
  const [cycleNumber, setCycleNumber] = useState(1)
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;name:string;startedAt:number}|null>(null)
  const [showExitSheet,    setShowExitSheet]    = useState(false)
  const [showFinishEarly,  setShowFinishEarly]  = useState(false)
  const [resumeCandidate, setResumeCandidate] = useState<{id:string;started_at:string;logged_sets:any[]}|null>(null)
  const [syncErrors,      setSyncErrors]      = useState<string[]>([])
  const [done,      setDone]      = useState(false)
  const [priorBest, setPriorBest] = useState<Record<string, number>>({})
  const [reintro,   setReintro]   = useState<{active:boolean; loadPct:number; started:string|null; until:string|null}>(
    { active:false, loadPct:1, started:null, until:null })

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const {data:{session}} = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      await requestNotificationPermission()
      const [rmArr, settings, equip, prefs] = await Promise.all([fetchAllOneRms(), fetchSettings(), fetchEquipment(), fetchExercisePreferences()])
      setProgPrefs(prefs)
      const rm:Record<string,number>={}
      rmArr.forEach((x:any)=>{rm[x.exercise_name]=x.weight_lbs})
      setRms(rm); setRound(settings.round_to_lbs); setEquipment(equip)
      setBodyWt(settings.body_weight_lbs ?? 0)
      setCycleNumber(settings.cycle_number ?? 1)
      setReintro({ active: reintroActive(settings), loadPct: settings.reintro_load_pct ?? 0.88,
                   started: settings.reintro_started_at ?? null, until: settings.reintro_until ?? null })
      // All-time best e1RM per exercise (purely historical — session not yet
      // created), used to detect PRs on the post-workout summary.
      try {
        const allSets = await fetchAllLoggedSets()
        const pb: Record<string, number> = {}
        ;(allSets as any[]).forEach(s => {
          if (s.weight_lbs && s.reps) {
            const e = s.weight_lbs * (1 + s.reps / 30)
            if (!pb[s.exercise_name] || e > pb[s.exercise_name]) pb[s.exercise_name] = e
          }
        })
        setPriorBest(pb)
      } catch (e) { console.error('priorBest:', e) }
      const lastMap:Record<string,number|null>={}, smartM:Record<string,SmartSuggestion|null>={}
      const durMap:Record<string,number|null>={}
      await Promise.all(workout.exercises.map(async ex=>{
        const loadableBW = ex.isBodyweight && isLoadableBodyweight(ex.name) && (settings.body_weight_lbs ?? 0) > 0
        if (ex.isBodyweight && !loadableBW) { smartM[ex.name]=null; lastMap[ex.name]=null; return }
        // Use the preferred exercise name (from program prefs) for history lookup.
        // If user swapped "Bench Press" → "DB Bench Press" in Program, we look up
        // DB Bench Press history so suggestions are based on what they actually lift.
        const effectiveName = prefs[ex.name]?.name ?? ex.name
        // Also check if there's a 1RM stored under the effective name; fall back to original
        const oneRm = rm[effectiveName] ?? 0
        const recentRaw = await getRecentSetsForExercise(effectiveName, 15)
        // Exclude sets logged during the reintroduction window so an easy
        // ramp-back week never drags the suggestion / 1RM basis down.
        let recent = excludeSpeedSets(recentRaw).filter((s:any) => !isReintroSet(s.completed_at, settings))
        lastMap[ex.name]  = recent[0]?.weight_lbs ?? null   // added weight for BW moves
        // Weighted dips/pull-ups: 1RM math runs on TOTAL system weight
        if (loadableBW) recent = withBodyweight(recent, settings.body_weight_lbs ?? 0)
        const exCfg = getWeekConfig(activeProgramId, wk, workout.dayType)
        smartM[ex.name]   = calculateSmartSuggestion(recent, ex.type, wk, oneRm, settings.round_to_lbs, exCfg)
      }))
      setLasts(lastMap); setSmartMap(smartM); setLastDurs(durMap)
      // Check for an incomplete session from a previous interrupted workout
      const incomplete = await findIncompleteSession(wk, key)
      if (incomplete && incomplete.logged_sets?.length > 0) {
        setResumeCandidate(incomplete)
      }
      // Session is created lazily on first set logged — prevents ghost sessions
      // when user browses to workout page without actually training
    } catch(e){ console.error('Init:',e) }
  }, [wk, key, workout.exercises])

  useEffect(()=>{ init() }, [init])

  // ── Keep screen awake during workouts ─────────────────────────
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return
    let lock: WakeLockSentinel | null = null

    const acquire = async () => {
      try { lock = await (navigator as any).wakeLock.request('screen') }
      catch { /* silently ignore — not all browsers/iOS versions support it */ }
    }

    // Re-acquire if page becomes visible again (lock releases on hide)
    const onVisible = () => { if (document.visibilityState === 'visible') acquire() }

    acquire()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      lock?.release()
    }
  }, [])

  // ── Resume handler ───────────────────────────────────────────────
  const handleResume = () => {
    if (!resumeCandidate) return
    setSid(resumeCandidate.id)
    // Rebuild local sets state from the DB-stored sets
    const rebuilt: Record<string, any[]> = {}
    resumeCandidate.logged_sets.forEach((s: any) => {
      if (!rebuilt[s.exercise_name]) rebuilt[s.exercise_name] = []
      rebuilt[s.exercise_name].push(s)
    })
    // Sort each exercise's sets by set_number
    Object.values(rebuilt).forEach(arr => arr.sort((a, b) => a.set_number - b.set_number))
    setSets(rebuilt)
    setResumeCandidate(null)
  }

  const handleStartFresh = () => setResumeCandidate(null)

  // ── Exit handlers ────────────────────────────────────────────────
  const hasProgress = Object.values(sets).some(s => s.length > 0)

  const handleDiscard = async () => {
    if (sid) { try { await deleteSession(sid) } catch {} }
    router.replace('/')
  }
  const handleSaveExit = () => router.replace('/')

  // ── Intercept back button when workout has progress ────────────

  useEffect(() => {
    // Push a dummy history entry so the first swipe-back / back-button
    // hits our interceptor rather than immediately navigating away
    window.history.pushState({ workout: true }, '')
    const onPop = () => {
      if (hasProgress) {
        // Re-push so the user can't just tap back again without confirming
        window.history.pushState({ workout: true }, '')
        setShowExitSheet(true)
      } else {
        router.replace('/')
      }
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [hasProgress, router])

  const total  = workout.exercises.reduce((a,ex)=>a+getSetsForWeek(ex.type,wk,cfg), 0)
  const logged = Object.values(sets).reduce((a,s)=>a+s.length, 0)
  const pct    = total>0 ? logged/total : 0

  const effName = (ex:Exercise) => swapped[ex.name]?.name ?? progPrefs[ex.name]?.name ?? ex.name

  // Re-baseline a lift's locked training max to the logged-derived estimate
  // (used by the 1RM-check drift prompt). Persists + recomputes prescription.
  const [driftBump, setDriftBump] = useState(0)  // forces re-render on dismiss
  const rebaselineLift = async (name:string, newTM:number, dismissKey:string) => {
    if (typeof window !== 'undefined') localStorage.setItem(dismissKey, '1')
    setRms(r => ({ ...r, [name]: newTM }))
    try { await upsertOneRm(name, newTM) } catch(e) { console.error('rebaseline:', e) }
  }
  const dismissDrift = (dismissKey:string) => {
    if (typeof window !== 'undefined') localStorage.setItem(dismissKey, '1')
    setDriftBump(b => b + 1)
  }
  const effCue  = (ex:Exercise) => swapped[ex.name]?.cue  ?? progPrefs[ex.name]?.cue  ?? ex.cue
  const tgt     = (ex:Exercise) => {
    if (ex.isBodyweight) {
      // Weighted dips/pull-ups: prescribe TOTAL system weight when we know
      // the athlete's body weight (belt weight = system − body, floored at 0)
      if (!(isLoadableBodyweight(ex.name) && bodyWt > 0)) return 0
      const tmBW = rms[effName(ex)] ?? 0
      if (tmBW > 0) return getTargetWeight(tmBW, ex.type, wk, round, cfg)
      const estBW = smartMap[ex.name]?.loggedOneRm ?? 0
      return estBW > 0 ? getTargetWeight(estBW, ex.type, wk, round, cfg) : 0
    }
    // Dumbbell lifts: racks run 2.5 lb steps up to 30 lbs, then 5s —
    // compute at 2.5 granularity and re-round above 30 to the user's setting.
    if (isDumbbellExercise(ex.name)) {
      const tmDB = rms[effName(ex)] ?? 0
      if (tmDB > 0) return dumbbellRound(getTargetWeight(tmDB, ex.type, wk, 2.5, cfg), round)
      const estDB = smartMap[ex.name]?.loggedOneRm ?? 0
      return estDB > 0 ? dumbbellRound(getTargetWeight(estDB, ex.type, wk, 2.5, cfg), round) : 0
    }
    // Locked training max for this cycle (× the week's %) is the source of truth.
    const eName = effName(ex)
    const tm = rms[eName] ?? 0
    if (tm > 0) return getTargetWeight(tm, ex.type, wk, round, cfg)
    // No training max stored yet → fall back to a logged-derived estimate
    const est = smartMap[ex.name]?.loggedOneRm ?? 0
    return est > 0 ? getTargetWeight(est, ex.type, wk, round, cfg) : 0
  }

  // When the user swaps an exercise mid-workout, pull the NEW exercise's own
  // history so the suggested weight, "last time", and coaching reflect what
  // they actually lift on it — not the lift it replaced. If the new exercise
  // has no history, we clear the suggestion (so nothing misleading shows) and
  // they enter their weight manually.
  const applySwap = async (slot: string, newName: string, cue: string) => {
    setSwapped(p => ({ ...p, [slot]: { name: newName, cue } }))
    setAltsFor(null)
    const ex = workout.exercises.find(e => e.name === slot)
    if (!ex || ex.isBodyweight) {
      setLasts(p => ({ ...p, [slot]: null })); setSmartMap(p => ({ ...p, [slot]: null })); return
    }
    try {
      const recentRaw = await getRecentSetsForExercise(newName, 15)
      const recent = excludeSpeedSets(recentRaw).filter((s:any) => !isReintroSet(s.completed_at, { reintro_started_at: reintro.started, reintro_until: reintro.until }))
      const oneRm  = rms[newName] ?? 0
      const exCfg  = getWeekConfig(activeProgramId, wk, workout.dayType)
      const sug    = calculateSmartSuggestion(recent, ex.type, wk, oneRm, round, exCfg)
      setLasts(p => ({ ...p, [slot]: recent[0]?.weight_lbs ?? null }))
      setSmartMap(p => ({ ...p, [slot]: sug }))
    } catch {
      setLasts(p => ({ ...p, [slot]: null })); setSmartMap(p => ({ ...p, [slot]: null }))
    }
  }

  // Retry wrapper — 3 attempts with 800ms/1600ms backoff
  const logWithRetry = async (...args: Parameters<typeof logSet>) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      try { return await logSet(...args) }
      catch (e) {
        if (attempt === 2) throw e
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)))
      }
    }
  }

  // Edit a previously logged set mid-workout (fix mis-entered weight/reps/RIR).
  // Optimistic local update; server update with revert on failure.
  const handleEditSet = async (exName:string, setId:string, patch:{ weight_lbs:number|null; reps:number; rir?:number|null }) => {
    let prevRow:any = null
    setSets(prev => ({
      ...prev,
      [exName]: (prev[exName] ?? []).map(s => {
        if (String(s.id) !== setId) return s
        prevRow = s
        return { ...s, weight_lbs: patch.weight_lbs, reps: patch.reps, ...(patch.rir !== undefined ? { rir: patch.rir } : {}) }
      })
    }))
    try {
      const updates:any = { weight_lbs: patch.weight_lbs, reps: patch.reps }
      if (patch.rir !== undefined) updates.rir = patch.rir
      await updateLoggedSet(setId, updates)
    } catch (e) {
      // revert on failure so the screen never lies about what's stored
      if (prevRow) setSets(prev => ({
        ...prev,
        [exName]: (prev[exName] ?? []).map(s => String(s.id) === setId ? prevRow : s)
      }))
      throw e
    }
  }

  const handleLog = async (origEx:Exercise, setNum:number, weight:number|null, reps:number, rir:number, tempo:string='Standard') => {
    // Lazy session creation — only hit the DB when user actually logs a set
    let sessionId = sid
    if (!sessionId) {
      try {
        const sess = await createSession(wk, key, cycleNumber)
        sessionId = sess.id
        setSid(sessionId)
      } catch(e:any) {
        // Surface the real error so a logging failure is never silent
        const msg = e?.message || e?.error_description || 'Could not start the workout session'
        setSyncErrors(prev => [...new Set([...prev, `⚠️ ${msg}`])])
        throw e
      }
    }

    // Optimistic update — advance UI immediately so the workout never freezes
    const tempId = `pending-${Date.now()}`
    const tempSet = { id: tempId, exercise_name: effName(origEx), set_number: setNum,
                      weight_lbs: weight, reps, rir, pending: true }
    setSets(prev => ({...prev, [origEx.name]: [...(prev[origEx.name]??[]), tempSet]}))

    // Dynamic-effort (speed) work — PHAT hypertrophy-day primary slot. Tagged
    // so these deliberately submaximal sets never feed 1RM estimation.
    const isSpeedSet = origEx.type === 'primary' && String(cfg.reps.primary).includes('explosive')

    // Sync to Supabase in background with retry
    logWithRetry(sessionId!, effName(origEx), setNum, weight, reps, false, rir, tempo, isSpeedSet)  // 3 retries
      .then(row => {
        // Replace temp set with confirmed row
        setSets(prev => ({
          ...prev,
          [origEx.name]: (prev[origEx.name]??[]).map(s => s.id === tempId ? {...row, rir} : s)
        }))
        // Clear any sync error for this exercise
        setSyncErrors(prev => prev.filter(e => e !== origEx.name))
      })
      .catch(() => {
        // Mark as failed — user can see it and the set stays logged locally
        setSyncErrors(prev => [...new Set([...prev, origEx.name])])
        setSets(prev => ({
          ...prev,
          [origEx.name]: (prev[origEx.name]??[]).map(s =>
            s.id === tempId ? {...s, pending: false, syncFailed: true} : s)
        }))
      })

    const newLogged = [...(sets[origEx.name]??[]), tempSet]
    const newSets   = {...sets, [origEx.name]: newLogged}
    setSets(newSets)
    setRest({ sec: getRestSeconds(wk, origEx.type, activeProgramId, workout.dayType),
             name: effName(origEx), startedAt: Date.now() })
    if (newLogged.length >= getSetsForWeek(origEx.type, wk, cfg)) {
      const next = workout.exercises.find(e => (newSets[e.name]?.length??0) < getSetsForWeek(e.type,wk,cfg))
      if (next) setTimeout(()=>setOpen(next.name), 500)
    }
  }


  if (done) {
    // ── Compute session summary from logged sets ──
    // Group by each set's ACTUAL logged exercise_name (so mid-workout swaps —
    // e.g. Cable Fly → Pec Deck — are attributed to what was really performed,
    // not the program's original slot name).
    const allSessionSets = Object.values(sets).flat() as any[]
    let totalSets = 0, totalVolume = 0, totalReps = 0
    const sessionBest: Record<string, { e1rm:number; weight:number; reps:number }> = {}
    const muscleSets: Record<string, number> = {}
    allSessionSets.forEach(s => {
      if (!s || s.reps == null) return
      const exName = s.exercise_name ?? 'Exercise'
      totalSets++
      totalReps += s.reps
      if (s.weight_lbs) {
        totalVolume += s.weight_lbs * s.reps
        const e = s.weight_lbs * (1 + s.reps / 30)
        if (!sessionBest[exName] || e > sessionBest[exName].e1rm) sessionBest[exName] = { e1rm:e, weight:s.weight_lbs, reps:s.reps }
      }
      const m = EXERCISE_MUSCLE[exName]
      if (m) muscleSets[m] = (muscleSets[m] ?? 0) + 1
    })
    const prs = Object.entries(sessionBest)
      .filter(([name, b]) => !priorBest[name] || b.e1rm > priorBest[name] + 0.5)
      .map(([name, b]) => ({ name, weight: b.weight, reps: b.reps, e1rm: Math.round(b.e1rm) }))
    const muscleSorted = Object.entries(muscleSets).sort((a,b) => b[1]-a[1])
    const coachLine = prs.length
      ? `${prs.length} new personal record${prs.length>1?'s':''} this session — outstanding work.`
      : totalVolume > 0
      ? `${totalVolume.toLocaleString()} lbs of total work moved across ${totalSets} sets. Consistency compounds.`
      : `${totalSets} sets logged. Showing up is the win — well done.`

    const Stat = ({ label, value, unit }: { label:string; value:string; unit?:string }) => (
      <div style={{ flex:1, textAlign:'center', padding:'14px 6px', borderRadius:14,
        background:'rgba(239,250,248,0.95)', border:'0.5px solid rgba(4,22,30,0.08)' }}>
        <p style={{ fontSize:26, fontWeight:800, color:'#04161E', letterSpacing:'-0.6px', lineHeight:1 }}>{value}</p>
        {unit && <p style={{ fontSize:10, color:'rgba(4,22,30,0.5)', marginTop:2 }}>{unit}</p>}
        <p style={{ fontSize:11, fontWeight:700, color:'rgba(4,22,30,0.55)', textTransform:'uppercase', letterSpacing:'0.06em', marginTop:6 }}>{label}</p>
      </div>
    )

    return (
      <div className="min-h-screen pb-tabs" style={{ background:'transparent' }}>
        {/* hero header in the workout's color */}
        <div className="pt-safe" style={{ position:'relative', overflow:'hidden', padding:'34px 20px 26px',
          background:`linear-gradient(160deg, color-mix(in srgb, ${accent} 40%, #04161E) 0%, color-mix(in srgb, ${accent} 12%, #0B2A33) 55%, #04161E 100%)` }}>
          <div aria-hidden style={{ position:'absolute', top:-50, right:-16, fontSize:200, fontWeight:800, lineHeight:1,
            color:`color-mix(in srgb, ${accent} 20%, transparent)`, letterSpacing:'-0.06em' }}>{key}</div>
          <div style={{ position:'relative', display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center', gap:10 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(255,255,255,0.14)',
              border:'0.5px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Check size={34} strokeWidth={3} style={{ color:'#fff' }} />
            </div>
            <div>
              <p style={{ fontSize:11, fontWeight:800, color:'rgba(255,255,255,0.85)', textTransform:'uppercase', letterSpacing:'0.14em' }}>Workout Complete</p>
              <h2 className="sf-heavy" style={{ fontSize:32, color:'#fff', letterSpacing:'-0.6px', lineHeight:1.05, marginTop:4 }}>{workout.shortName}</h2>
              <p style={{ fontSize:14, color:'rgba(255,255,255,0.7)', marginTop:4 }}>Week {wk}{cycleNumber>1?` · Cycle ${cycleNumber}`:''}</p>
            </div>
          </div>
        </div>

        <div style={{ padding:'18px 16px', display:'flex', flexDirection:'column', gap:18 }}>
          {/* big stats */}
          <div style={{ display:'flex', gap:8 }}>
            <Stat label="Volume" value={totalVolume>=1000?`${(totalVolume/1000).toFixed(1)}k`:String(totalVolume)} unit="lbs moved" />
            <Stat label="Sets" value={String(totalSets)} unit="logged" />
            <Stat label="Reps" value={String(totalReps)} unit="total" />
          </div>

          {/* PRs */}
          {prs.length > 0 && (
            <div className="fade-rise" style={{ borderRadius:18, padding:'16px 18px',
              background:'linear-gradient(135deg, #FBE6BB, #FCDFD2)',
              border:'0.5px solid rgba(154,91,0,0.35)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                <Award size={18} style={{ color:'#9A5B00' }} strokeWidth={2.2} />
                <p style={{ fontSize:13, fontWeight:800, color:'#7A4A00', textTransform:'uppercase', letterSpacing:'0.08em' }}>
                  {prs.length} New Personal Record{prs.length>1?'s':''}
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {prs.map(pr => (
                  <div key={pr.name} style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <span style={{ fontSize:14, fontWeight:700, color:'#04161E' }}>{pr.name}</span>
                    <span style={{ fontSize:13, color:'rgba(4,22,30,0.6)' }}>
                      {pr.weight} × {pr.reps} · <b style={{ color:'#04161E' }}>{pr.e1rm}</b> e1RM
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* sets per muscle */}
          {muscleSorted.length > 0 && (
            <div>
              <p className="ios-section-label mb-2">Sets by Muscle</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                {muscleSorted.map(([m, n]) => (
                  <span key={m} style={{ fontSize:13, fontWeight:600, color:'rgba(239,250,248,0.92)',
                    background:'var(--bg-2)', border:'0.5px solid rgba(84,84,88,0.4)', padding:'6px 11px', borderRadius:999 }}>
                    {m} <b style={{ color:accent }}>{n}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* coach read */}
          <div style={{ display:'flex', gap:11, padding:'14px 16px', borderRadius:14,
            background:'rgba(11,42,51,0.5)', border:'0.5px solid rgba(84,84,88,0.35)' }}>
            <Flame size={18} style={{ color:accent, flexShrink:0, marginTop:1 }} strokeWidth={2} />
            <p style={{ fontSize:14, color:'rgba(239,250,248,0.88)', lineHeight:1.45 }}>{coachLine}</p>
          </div>

          {/* actions */}
          <div style={{ display:'flex', flexDirection:'column', gap:10, marginTop:2 }}>
            <button onClick={()=>router.push('/')} style={{ width:'100%', height:54,
              borderRadius:16, fontSize:17, fontWeight:700, background:accent, color:'#04161E' }}>
              Back to Home
            </button>
            <button onClick={()=>router.push('/insights')} style={{ width:'100%', height:48,
              borderRadius:14, fontSize:15, fontWeight:600, background:'var(--bg-2)', color:'var(--label)',
              border:'0.5px solid rgba(84,84,88,0.4)' }}>
              View Insights
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'transparent' }}>

      {/* Nav */}
      <div className="pt-safe sticky top-0 z-30" style={{
        background:`linear-gradient(135deg, color-mix(in srgb, ${accent} 20%, rgba(6,24,32,0.92)) 0%, rgba(6,24,32,0.88) 60%)`,
        backdropFilter:'saturate(180%) blur(28px)',
        WebkitBackdropFilter:'saturate(180%) blur(28px)', borderBottom:'0.5px solid rgba(84,84,88,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px 10px' }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ChevronLeft size={17} strokeWidth={2.5} style={{ color:accent }} />
          </button>
          <div style={{ width:30, height:30, borderRadius:9, flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            background:`color-mix(in srgb, ${accent} 85%, #fff)`, color:'#04161E', fontSize:15, fontWeight:800 }}>
            {key}
          </div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>{workout.shortName}</p>
            <p style={{ fontSize:12, color:'rgba(239,250,248,0.6)' }}>Week {wk} · {cfg.phase.split('—')[0].trim()} · RIR {reintro.active ? Math.max(cfg.rir, REINTRO_RIR_CAP) : cfg.rir}</p>
          </div>
          <div style={{ padding:'6px 14px', borderRadius:999, background:'rgba(255,255,255,0.1)',
            border:'0.5px solid rgba(255,255,255,0.16)' }}>
            <span style={{ fontSize:18, fontWeight:800, color:accent }}>{logged}</span>
            <span style={{ fontSize:12, color:'rgba(239,250,248,0.5)' }}> / {total}</span>
          </div>
        </div>
        <div style={{ height:3, background:'rgba(118,118,128,0.2)' }}>
          <div style={{ height:'100%', background:accent, width:`${pct*100}%`,
            transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:`0 0 8px ${accent}88` }} />
        </div>
      </div>

      {/* ── PHAT Day-Type Context Card ── */}
      {workout.dayType && workout.dayType !== 'standard' && (() => {
        const isPower = workout.dayType === 'power'
        const accent  = isPower ? '#17BEBB' : '#2DD4A0'
        const tips = isPower ? [
          { icon:'⚡', text:'Explosive concentric intent on every rep — even heavy loads should be driven fast. Speed of intent is what recruits high-threshold motor units.' },
          { icon:'⏱', text:'Full rest between sets is non-negotiable. Phosphocreatine takes 3–4 min to fully replenish — cut the rest and you cut the force output.' },
          { icon:'🧠', text:'Motor unit recruitment is today\'s adaptation goal — not the pump. CNS efficiency drives the strength gains that carry into your hypertrophy sessions.' },
        ] : [
          { icon:'📍', text:'3-second eccentric on every rep. Mechanical tension during the lowering phase is a primary hypertrophy driver (Schoenfeld & Calatayud 2022).' },
          { icon:'🔥', text:'Embrace the metabolic stress. The burn indicates lactate and metabolite accumulation — the exact environment that amplifies the hypertrophy signal.' },
          { icon:'↕️', text:'Full stretch at the bottom of every rep. Stretch-mediated hypertrophy produces greater muscle growth than mid-range loading (Wolf & Schoenfeld 2025).' },
        ]
        return (
          <div style={{ padding:'0 14px 2px' }}>
            <div style={{ padding:'14px 16px', borderRadius:16,
              background:`color-mix(in srgb, ${accent} 8%, rgba(18,18,26,1))`,
              border:`0.5px solid color-mix(in srgb, ${accent} 28%, transparent)` }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <span style={{ fontSize:18 }}>{isPower ? '⚡' : '🔥'}</span>
                <div>
                  <p style={{ fontSize:13, fontWeight:800, color: accent, letterSpacing:'-0.2px' }}>
                    {isPower ? 'Power Day — Neural Activation' : 'Hypertrophy Day — Metabolic Stress'}
                  </p>
                  <p style={{ fontSize:11, color:'rgba(142,142,147,0.65)', marginTop:1 }}>
                    {isPower ? 'Rate of Force Development · Motor Unit Recruitment'
                             : 'Mechanical Tension · Stretch-Mediated Hypertrophy'}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {tips.map((t, i) => (
                  <div key={i} style={{ display:'flex', gap:8, alignItems:'flex-start' }}>
                    <span style={{ fontSize:12, flexShrink:0, marginTop:1 }}>{t.icon}</span>
                    <p style={{ fontSize:11, color:'rgba(255,255,255,0.58)', lineHeight:1.55 }}>{t.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })()}

      {/* Reintroduction banner */}
      {reintro.active && (
        <div style={{ margin:'12px 14px 0', borderRadius:14, padding:'11px 14px', display:'flex', alignItems:'center', gap:10,
          background:'color-mix(in srgb, var(--blue) 13%, transparent)', border:'0.5px solid color-mix(in srgb, var(--blue) 32%, transparent)' }}>
          <RotateCcw size={16} style={{ color:'var(--teal)', flexShrink:0 }} strokeWidth={2.3} />
          <p style={{ fontSize:12.5, color:'rgba(239,250,248,0.82)', lineHeight:1.45 }}>
            <b style={{ color:'#fff' }}>Ramp-back week</b> · loads at ~{Math.round(reintro.loadPct*100)}%, reduced volume, RIR {REINTRO_RIR_CAP}+. Re-groove the pattern — these sets won&rsquo;t affect your 1RM or suggestions.
          </p>
        </div>
      )}

      {/* Exercise list */}
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        {workout.exercises.map((origEx, idx) => {
          const baseSets = getSetsForWeek(origEx.type, wk, cfg)
          // Reintroduction: reduce volume, cap load, hold RIR in reserve
          const exSets   = reintro.active ? Math.max(2, Math.round(baseSets * REINTRO_VOLUME_PCT)) : baseSets
          const exReps   = getRepsForWeek(origEx.type, wk, cfg)
          const exRir    = reintro.active ? Math.max(cfg.rir, REINTRO_RIR_CAP) : cfg.rir
          const exLogged = sets[origEx.name] ?? []
          const isComp   = exLogged.length >= exSets
          const isOpen   = open === origEx.name
          const baseTgt  = tgt(origEx)
          const target   = (reintro.active && !origEx.isBodyweight && baseTgt > 0)
            ? Math.max(round, Math.round(baseTgt * reintro.loadPct / round) * round)
            : baseTgt
          const smart    = smartMap[origEx.name]
          const lastWt   = lasts[origEx.name] ?? null
          // At-a-glance direction = change vs last time (consistent everywhere)
          const loadableBW = origEx.isBodyweight && isLoadableBodyweight(origEx.name) && bodyWt > 0
          // Dynamic-effort (speed) slot — distinct visual structure, like warm-ups
          const isSpeedEx  = origEx.type === 'primary' && String(cfg.reps.primary).includes('explosive')
          // Timed isometric hold (plank / wall sit / carry) — duration, not reps
          const isTimedEx  = isTimedExercise(origEx.name)
          const timedSugg  = isTimedEx ? suggestTimedTarget(lastDurs[origEx.name] ?? null, lastWt, cfg.isDeload) : null
          // Belt weight for weighted dips/pull-ups (target is SYSTEM weight)
          const beltTgt  = loadableBW && target > 0 ? Math.max(0, Math.round((target - bodyWt) / round) * round) : 0
          const shownTgt = loadableBW ? beltTgt : target
          const wJump    = ((!origEx.isBodyweight || loadableBW) && lastWt != null && shownTgt >= 0 && (shownTgt > 0 || loadableBW)) ? shownTgt - lastWt : null
          const wDir     = wJump == null ? 'none' : wJump > 0.5 ? 'up' : wJump < -0.5 ? 'down' : 'none'

          // Locked-training-max explanation + guarded 1RM-drift check
          const eName     = effName(origEx)
          const storedTM  = (!origEx.isBodyweight || loadableBW) ? (rms[eName] ?? 0) : 0
          const usingTM   = storedTM > 0 ? storedTM : (smart?.loggedOneRm ?? 0)
          const pctType   = cfg.percentages[origEx.type] ?? 0
          const reasonMain = (origEx.isBodyweight && loadableBW && usingTM > 0)
            ? `Week ${wk}: ${Math.round(pctType*100)}% of your ${Math.round(usingTM)} lb system max (your ${Math.round(bodyWt)} lb bodyweight + belt)${storedTM > 0 ? ' — locked for this cycle' : ''}. ${beltTgt > 0 ? `Add ${beltTgt} lbs to the belt.` : `Bodyweight only — your bodyweight alone is ${Math.round(bodyWt / usingTM * 100)}% of your max, above this week's target, so every rep is already heavier than prescribed. Progress by reps at RIR ${cfg.rir}; it's fine to fall short of the listed range. Belt weight kicks in once the weekly % clears your bodyweight.`}`
            : origEx.isBodyweight ? ''
            : reintro.active ? `Ramp-back week — ~${Math.round(reintro.loadPct*100)}% of week ${wk}'s prescription to ease you back in.`
            : usingTM > 0 ? `Week ${wk}: ${Math.round(pctType*100)}% of your ${Math.round(usingTM)} lb ${storedTM > 0 ? 'training max (locked for this cycle)' : 'estimated max from logged sets'}.`
            : ''
          const driftPct  = (storedTM > 0 && smart?.loggedOneRm) ? (smart.loggedOneRm - storedTM) / storedTM : 0
          const driftKey  = `cg_drift_${cycleNumber}_${eName}`
          const driftSeen = typeof window !== 'undefined' && localStorage.getItem(driftKey) === '1'
          const driftObj  = (!reintro.active && storedTM > 0 && smart?.confidence === 'high'
                              && Math.abs(driftPct) >= 0.10 && !driftSeen && driftBump >= 0 && smart?.loggedOneRm)
            ? { pct: driftPct, loggedEst: smart.loggedOneRm,
                onRebaseline: () => rebaselineLift(eName, smart!.loggedOneRm, driftKey),
                onDismiss:    () => dismissDrift(driftKey) }
            : null
          const nextSet  = exLogged.length + 1  // which set is active

          return (
            <div key={origEx.name} style={{
              borderRadius:18, overflow:'hidden',
              background: isOpen ? '#0D0D18' : '#0A0A12',
              border:`0.5px solid ${isOpen ? `${accent}55` : 'rgba(84,84,88,0.35)'}`,
              borderLeft:`3px solid ${isComp ? '#2DD4A0' : isOpen ? accent : 'rgba(84,84,88,0.3)'}`,
              opacity: isComp && !isOpen ? 0.5 : 1, transition:'all 0.2s' }}>

              {/* Header */}
              <button onClick={()=>setOpen(isOpen ? '' : origEx.name)}
                style={{ width:'100%', padding:'13px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:3, width:22, flexShrink:0 }}>
                  {Array.from({length:exSets}).map((_,i) => (
                    <div key={i} style={{ height:4, borderRadius:99, transition:'background 0.3s',
                      background: i<exLogged.length ? '#2DD4A0' : 'rgba(84,84,88,0.35)' }} />
                  ))}
                </div>
                <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                  <p style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}
                     className="truncate">{effName(origEx)}</p>
                  <p style={{ fontSize:12, color:'#8E8E93', marginTop:2 }}>
                    {origEx.muscle}
                    {!origEx.isBodyweight && target>0 && (
                      <span style={{ color: wDir==='up'?'#2DD4A0':wDir==='down'?'#FFB23E':accent }}>
                        {` · ${target} lbs`}{wDir==='up'?' ↑':wDir==='down'?' ↓':''}
                      </span>
                    )}
                    {loadableBW && target>0 && (
                      <span style={{ color: wDir==='up'?'#2DD4A0':wDir==='down'?'#FFB23E':accent }}>
                        {beltTgt > 0 ? ` · BW +${beltTgt} lbs belt` : ' · bodyweight only'}{wDir==='up'?' ↑':wDir==='down'?' ↓':''}
                      </span>
                    )}
                  </p>
                  {ssPairs[origEx.name] && !isComp && (
                    <p style={{ fontSize:11, color:'var(--teal)', marginTop:2 }}>
                      ⚡ Time saver: superset with {ssPairs[origEx.name]} — alternate the two, ~60 sec between moves
                    </p>
                  )}
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:isComp?'#2DD4A0':'#fff' }}>
                  {exLogged.length}<span style={{ color:'#8E8E93', fontWeight:500 }}>/{exSets}</span>
                </span>
              </button>

              {/* Expanded */}
              {isOpen && (
                <div style={{ padding:'0 14px 14px', display:'flex', flexDirection:'column', gap:8 }}>

                  {/* Info strip */}
                  <div style={{ display:'flex', gap:6, padding:'8px 12px', borderRadius:10,
                    background:'rgba(118,118,128,0.1)', border:'0.5px solid rgba(84,84,88,0.3)', marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{exSets} sets</span>
                    <span style={{ color:'#8E8E93' }}>·</span>
                    {isTimedEx ? (
                      <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>~{timedSugg?.seconds ?? 30}s holds</span>
                    ) : (<>
                      <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{exReps} reps</span>
                      <span style={{ color:'#8E8E93' }}>·</span>
                      <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>RIR {exRir}</span>
                    </>)}
                    {lastWt && <>
                      <span style={{ color:'#8E8E93', marginLeft:'auto' }}>·</span>
                      <span style={{ fontSize:12, color:'#8E8E93' }}>Last: {lastWt} lbs</span>
                    </>}
                  </div>

                  {/* Coaching — why this weight / jump / 1RM check (tap to expand) */}
                  {!isComp && !isTimedEx && (
                    <CoachBubble target={shownTgt} lastWeight={lastWt} isBodyweight={!!origEx.isBodyweight && !loadableBW}
                      accentColor={accent} reasonMain={reasonMain} loggedEst={smart?.loggedOneRm ?? null} drift={driftObj} />
                  )}

                  {/* Warm-up ramp — first primary lift of each muscle group, optional, not logged, no rest timer.
                      Skipped on speed slots: the working weight is already light. */}
                  {!isComp && !isSpeedEx && warmupTargets.has(origEx.name) && target > 0 && (
                    <WarmupSets working={target} round={round} accentColor={accent} exerciseName={effName(origEx)} />
                  )}

                  {/* Speed-work banner — dynamic-effort sets look structurally different */}
                  {!isComp && isSpeedEx && (
                    <div style={{ borderRadius:12, border:'1px dashed rgba(255,214,10,0.45)',
                      background:'rgba(255,214,10,0.07)', padding:'10px 12px', marginBottom:4 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <Zap size={14} style={{ color:'#FFD60A', flexShrink:0 }} strokeWidth={2.4} />
                        <span style={{ fontSize:12, fontWeight:700, color:'#FFD60A', textTransform:'uppercase', letterSpacing:'0.06em' }}>Speed Work</span>
                        <span style={{ fontSize:11, color:'#8E8E93' }}>· not counted toward your 1RM</span>
                      </div>
                      <p style={{ fontSize:11, color:'rgba(239,250,248,0.5)', lineHeight:1.45, marginTop:6 }}>
                        Explosive triples at a deliberately light load — move the bar as fast as possible with crisp form, and stop the set the moment bar speed drops.
                      </p>
                    </div>
                  )}

                  {/* Logged sets */}
                  {exLogged.map((l:any, i:number) => (
                    <LoggedRow key={l.id ?? i} setNum={i+1} weight={l.weight_lbs} reps={l.reps} rir={l.rir} speed={isSpeedEx || !!l.is_speed} timed={isTimedEx}
                      editable={!!l.id && !String(l.id).startsWith('pending')}
                      onSave={(patch) => handleEditSet(origEx.name, String(l.id), patch)} />
                  ))}

                  {/* Active set card — timed holds get the countdown card */}
                  {!isComp && isTimedEx && timedSugg && (
                    <TimedSetCard key={nextSet} setNum={nextSet} setCount={exSets}
                      suggestSec={timedSugg.seconds} suggestWt={timedSugg.weight} note={timedSugg.note}
                      accentColor={accent} dbMode={isDumbbellExercise(origEx.name)}
                      onLog={(w, secs) => handleLog(origEx, nextSet, w, secs, 0, 'timed')} />
                  )}
                  {!isComp && !isTimedEx && (
                    <ActiveSetCard
                      setNum={nextSet} setCount={exSets}
                      target={shownTgt} repsRange={exReps}
                      lastWeight={lastWt} isBodyweight={!!origEx.isBodyweight}
                      beltMode={loadableBW} speedMode={isSpeedEx} dbMode={isDumbbellExercise(origEx.name)}
                      accentColor={accent}
                      exerciseName={effName(origEx)}
                      onLog={(w,r,rir,tempo) => handleLog(origEx, nextSet, w, r, rir, tempo)}
                    />
                  )}

                  {/* Pending sets */}
                  {!isComp && Array.from({length: exSets - nextSet}, (_,i) => (
                    <PendingRow key={i} setNum={nextSet+1+i} target={shownTgt} />
                  ))}

                  {/* Cue + swap */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginTop:4 }}>
                    <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', lineHeight:1.6, flex:1 }}>
                      {effCue(origEx)}
                    </p>
                    {EXERCISE_ALTS[origEx.name] && (
                      <button onClick={()=>setAltsFor(origEx.name)} style={{ display:'flex',
                        alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10,
                        background:'rgba(23,190,187,0.12)', border:'0.5px solid rgba(23,190,187,0.3)', flexShrink:0 }}>
                        <ArrowLeftRight size={12} style={{ color:'#17BEBB' }} />
                        <span style={{ fontSize:12, fontWeight:700, color:'#17BEBB' }}>Swap</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* Complete (all sets done) */}
        {logged >= total && logged > 0 && (
          <button onClick={async()=>{ if(sid) await completeSession(sid); setDone(true) }}
            style={{ width:'100%', height:56, borderRadius:18, fontSize:17, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:'linear-gradient(135deg, #2DD4A0, #34C759)',
              color:'#04161E', marginTop:4, boxShadow:'0 4px 24px rgba(45,212,160,0.35)' }}>
            <CheckCircle2 size={20} strokeWidth={2.5} /> Complete Workout
          </button>
        )}

        {/* Finish Early (some sets done, not all) */}
        {logged > 0 && logged < total && (
          <button onClick={() => setShowFinishEarly(true)}
            style={{ width:'100%', height:48, borderRadius:16, fontSize:15, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:'rgba(255,178,62,0.1)', color:'#FFB23E',
              border:'0.5px solid rgba(255,178,62,0.35)', marginTop:4 }}>
            <CheckCircle2 size={17} strokeWidth={2} /> Finish Early
            <span style={{ fontSize:12, fontWeight:500, color:'rgba(255,178,62,0.7)',
              background:'rgba(255,178,62,0.15)', padding:'2px 8px', borderRadius:99 }}>
              {logged}/{total} sets
            </span>
          </button>
        )}
      </div>

      {rest    && <RestPill key={rest.startedAt} seconds={rest.sec} exName={rest.name} onDone={()=>setRest(null)} onRestPause={()=>setRest(p=>p?{...p,sec:15,startedAt:Date.now()}:null)} />}
      {altsFor && <AltsSheet exName={altsFor} equipment={equipment}
        onSwap={(n,c)=>{ if (altsFor) applySwap(altsFor, n, c) }}
        onClose={()=>setAltsFor(null)} />}

      {/* ── Resume session sheet ── */}
      {resumeCandidate && (
        <div className="sheet-scrim">
          <div className="sheet-panel" onClick={e=>e.stopPropagation()}
               style={{ padding:'24px 20px 20px' }}>
            <div style={{ width:36, height:4, borderRadius:99, background:'rgba(84,84,88,0.5)', margin:'0 auto 20px' }} />
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:14, flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background:`color-mix(in srgb, ${accent} 18%, transparent)`,
                fontSize:22 }}>⚡</div>
              <div>
                <h3 style={{ fontSize:19, fontWeight:800, color:'#fff', letterSpacing:'-0.4px', marginBottom:4 }}>
                  Continue your workout?
                </h3>
                <p style={{ fontSize:14, color:'#8E8E93', lineHeight:1.5 }}>
                  You have <strong style={{color:'#fff'}}>{resumeCandidate.logged_sets.length} set{resumeCandidate.logged_sets.length===1?'':'s'}</strong> saved from a session
                  {' '}started {new Date(resumeCandidate.started_at).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'})}.
                </p>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={handleResume}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:`color-mix(in srgb, ${accent} 20%, transparent)`,
                  border:`0.5px solid ${accent}55`, color: accent }}>
                Continue from set {resumeCandidate.logged_sets.length + 1}
              </button>
              <button onClick={handleStartFresh}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:'rgba(118,118,128,0.18)',
                  border:'0.5px solid rgba(84,84,88,0.4)', color:'#8E8E93' }}>
                Start fresh
                <span style={{ display:'block', fontSize:12, fontWeight:500, marginTop:1 }}>
                  Previous session stays in History
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sync error banner ── */}
      {syncErrors.length > 0 && (
        <div style={{ position:'fixed', bottom:'calc(var(--safe-bottom) + 72px)',
          left:16, right:16, zIndex:99, padding:'12px 16px', borderRadius:14,
          background:'rgba(255,178,62,0.97)', display:'flex', gap:10, alignItems:'center',
          boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>
          <span style={{ fontSize:16, flexShrink:0 }}>⚠️</span>
          <p style={{ fontSize:13, color:'#fff', fontWeight:600, flex:1, lineHeight:1.4 }}>
            Connection issue — sets are saved locally and will sync when you're back online.
          </p>
          <button onClick={()=>setSyncErrors([])}
            style={{ fontSize:20, color:'rgba(255,255,255,0.8)', background:'none',
              border:'none', cursor:'pointer', lineHeight:1, padding:'0 4px' }}>×</button>
        </div>
      )}

      {/* ── Finish Early sheet ── */}
      {showFinishEarly && (
        <div className="sheet-scrim" onClick={()=>setShowFinishEarly(false)}>
          <div className="sheet-panel" onClick={e=>e.stopPropagation()}
               style={{ padding:'24px 20px 20px' }}>
            <div style={{ width:36, height:4, borderRadius:99, background:'rgba(84,84,88,0.5)',
              margin:'0 auto 20px' }} />
            <h3 style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.5px', marginBottom:6 }}>
              Finish workout early?
            </h3>
            <p style={{ fontSize:15, color:'#8E8E93', lineHeight:1.5, marginBottom:16 }}>
              You've logged <strong style={{ color:'#fff' }}>{logged} of {total} sets</strong>.
              The {total - logged} remaining sets will simply be skipped.
            </p>
            <div style={{ padding:'12px 14px', borderRadius:14, marginBottom:20,
              background:'rgba(45,212,160,0.08)', border:'0.5px solid rgba(45,212,160,0.25)' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'#2DD4A0', marginBottom:8 }}>
                Weight suggestions stay accurate
              </p>
              {[
                'Only the sets you actually logged are used for progression',
                "Unlogged sets leave no record — they cannot affect next week's weights",
                'Smart suggestions will calibrate from your real performance today',
              ].map((t, i) => (
                <div key={i} style={{ display:'flex', gap:8, marginBottom: i < 2 ? 6 : 0 }}>
                  <span style={{ color:'#2DD4A0', fontSize:12, flexShrink:0, marginTop:1 }}>✓</span>
                  <p style={{ fontSize:13, color:'rgba(255,255,255,0.65)', lineHeight:1.4 }}>{t}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={async()=>{
                  setShowFinishEarly(false)
                  if(sid) await completeSession(sid)
                  setDone(true)
                }}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:'rgba(255,178,62,0.15)', color:'#FFB23E',
                  border:'0.5px solid rgba(255,178,62,0.4)' }}>
                Finish & Save {logged} Sets
              </button>
              <button onClick={()=>setShowFinishEarly(false)}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:'rgba(118,118,128,0.18)', color:'#8E8E93' }}>
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Exit confirmation sheet ── */}
      {showExitSheet && (
        <div className="sheet-scrim" onClick={()=>setShowExitSheet(false)}>
          <div className="sheet-panel" onClick={e=>e.stopPropagation()}
               style={{ padding:'24px 20px 20px' }}>
            <div style={{ width:36, height:4, borderRadius:99, background:'rgba(84,84,88,0.5)',
              margin:'0 auto 20px' }} />
            <h3 style={{ fontSize:20, fontWeight:800, color:'#fff', letterSpacing:'-0.5px',
              marginBottom:6 }}>Leave workout?</h3>
            <p style={{ fontSize:15, color:'#8E8E93', lineHeight:1.5, marginBottom:24 }}>
              You've logged {Object.values(sets).reduce((n,s)=>n+s.length,0)} set
              {Object.values(sets).reduce((n,s)=>n+s.length,0)===1?'':'s'} so far.
              What would you like to do?
            </p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <button onClick={()=>setShowExitSheet(false)}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:`color-mix(in srgb, ${accent} 20%, transparent)`,
                  border:`0.5px solid ${accent}55`, color: accent }}>
                Continue Workout
              </button>
              <button onClick={handleSaveExit}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:'rgba(118,118,128,0.18)',
                  border:'0.5px solid rgba(84,84,88,0.4)', color:'#fff' }}>
                Save & Exit
                <span style={{ display:'block', fontSize:12, fontWeight:500,
                  color:'#8E8E93', marginTop:1 }}>Resume from History later</span>
              </button>
              <button onClick={handleDiscard}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:700,
                  background:'rgba(242,92,84,0.1)',
                  border:'0.5px solid rgba(242,92,84,0.3)', color:'#F25C54' }}>
                Discard Session
                <span style={{ display:'block', fontSize:12, fontWeight:500,
                  color:'rgba(242,92,84,0.6)', marginTop:1 }}>Removes all logged sets</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
