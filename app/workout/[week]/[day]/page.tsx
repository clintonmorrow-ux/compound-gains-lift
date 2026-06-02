'use client'
import { use, useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X, Trophy, Minus, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getRecentSetsForExercise, fetchEquipment, fetchExercisePreferences,
         deleteSession, findIncompleteSession } from '@/lib/db'
import { getRestSeconds, fireRestCompleteNotification, requestNotificationPermission } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'#0A84FF', B:'#30D158', C:'#BF5AF2', D:'#FF9F0A' }

// ── Active Set Card (current set being logged) ────────────────────
function ActiveSetCard({ setNum, setCount, target, repsRange, lastWeight, isBodyweight, accentColor, onLog }: {
  setNum:number; setCount:number; target:number; repsRange:string
  lastWeight:number|null; isBodyweight:boolean; accentColor:string
  onLog:(w:number|null, r:number, rir:number, tempo:string)=>Promise<void>
}) {
  const parts   = repsRange.replace('–','-').split('-').map(Number)
  const maxReps = parts[1] || parts[0] || 10

  const [wt,    setWt]   = useState(isBodyweight ? 0 : (target > 0 ? target : lastWeight ?? 0))
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
    if (isBodyweight || didSync.current || userEdited.current) return
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
    await onLog(wt > 0 ? wt : null, reps, rir, tempo)
    setBusy(false)
  }

  return (
    <div style={{ borderRadius:16, border:`1px solid ${accentColor}55`,
      background:`linear-gradient(160deg, rgba(${accentColor==='#0A84FF'?'10,132,255':accentColor==='#30D158'?'48,209,88':accentColor==='#BF5AF2'?'191,90,242':'255,159,10'},0.08) 0%, rgba(13,13,20,0) 100%)`,
      padding:'16px' }}>

      <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
        letterSpacing:'0.1em', marginBottom:14 }}>
        Set {setNum} of {setCount}
      </p>

      {/* Weight stepper — always shown; for BW exercises it means added load */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
            letterSpacing:'0.08em' }}>
            {isBodyweight ? 'Added Weight' : 'Weight'}
          </p>
          {isBodyweight && (
            <span style={{ fontSize:11, color:'rgba(255,159,10,0.7)',
              background:'rgba(255,159,10,0.1)', padding:'2px 7px', borderRadius:6 }}>
              belt · vest · optional
            </span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={()=>adjust('wt',-5)} style={{ width:44, height:44, borderRadius:12,
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
          <button onClick={()=>adjust('wt',+5)} style={{ width:44, height:44, borderRadius:12,
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Plus size={18} strokeWidth={2.5} style={{ color:accentColor }} />
          </button>
        </div>
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          {([-10,-5,+5,+10]).map(d => (
            <button key={d} onClick={()=>adjust('wt',d)} style={{ flex:1, height:36, borderRadius:10,
              background:'rgba(118,118,128,0.15)', fontSize:13, fontWeight:700,
              color: d<0 ? '#8E8E93' : accentColor }}>
              {d>0?`+${d}`:d}
            </button>
          ))}
        </div>
      </div>

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
              fontSize:15, fontWeight:800, color: rir===v ? '#fff' : '#8E8E93',
              transition:'background 0.15s' }}>
              {v===4?'4+':v}
            </button>
          ))}
        </div>
        <p style={{ fontSize:11, color:'#8E8E93', marginTop:6, textAlign:'center' }}>
          {rir===0?'Nothing left — max effort':rir===1?'1 more rep in the tank':rir===2?'2 reps left — on prescription':rir===3?'3 reps left — feeling fresh':'4+ reps left — very easy'}
        </p>
      </div>

      {/* Tempo selector */}
      <div style={{ marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em' }}>
            Eccentric Tempo
          </p>
          <span style={{ fontSize:11, color:'rgba(10,132,255,0.7)', background:'rgba(10,132,255,0.1)',
            padding:'2px 7px', borderRadius:6 }}>optional</span>
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {TEMPOS.map(t => (
            <button key={t.code} onClick={()=>setTempo(t.code)}
              style={{ padding:'6px 10px', borderRadius:10,
                background: tempo===t.code ? accentColor : 'rgba(118,118,128,0.15)',
                fontSize:12, fontWeight:700, color: tempo===t.code ? '#fff' : '#8E8E93',
                transition:'background 0.15s',
                display:'flex', alignItems:'center', gap:5 }}>
              <span>{t.code}</span>
              {t.purpose && <span style={{ fontSize:10, fontWeight:500,
                color: tempo===t.code ? 'rgba(255,255,255,0.7)' : 'rgba(142,142,147,0.7)',
                background: tempo===t.code ? 'rgba(0,0,0,0.2)' : 'rgba(118,118,128,0.15)',
                padding:'1px 5px', borderRadius:4 }}>{t.purpose}</span>}
            </button>
          ))}
        </div>
        {tempo !== 'Standard' && (
          <p style={{ fontSize:12, color:'rgba(10,132,255,0.85)', marginTop:8,
            background:'rgba(10,132,255,0.08)', padding:'8px 12px', borderRadius:10, lineHeight:1.5 }}>
            💡 {TEMPOS.find(t=>t.code===tempo)?.hint}
          </p>
        )}
      </div>

      {/* LOG button */}
      <button onClick={commit} disabled={busy}
        style={{ width:'100%', height:54, borderRadius:14, fontSize:17, fontWeight:800,
          display:'flex', alignItems:'center', justifyContent:'center', gap:8,
          background: busy ? 'rgba(118,118,128,0.3)' : accentColor,
          color:'#fff', letterSpacing:'-0.3px',
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
function LoggedRow({ setNum, weight, reps, rir }: { setNum:number; weight:number|null; reps:number; rir?:number }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, height:44, paddingInline:14,
      borderRadius:12, background:'rgba(48,209,88,0.1)', border:'0.5px solid rgba(48,209,88,0.35)' }}>
      <div style={{ width:24, height:24, borderRadius:'50%', background:'#30D158',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
        <Check size={13} strokeWidth={3} style={{ color:'#000' }} />
      </div>
      <span style={{ fontSize:13, fontWeight:700, color:'#fff' }}>Set {setNum}</span>
      <span style={{ fontSize:13, color:'#8E8E93', flex:1 }}>
        {weight != null ? `${weight} lbs` : 'Bodyweight'} × {reps} reps
        {rir !== undefined && <span style={{ color:'rgba(48,209,88,0.8)' }}> · RIR {rir}</span>}
      </span>
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
function DropSetRow({ lastWeight, repsRange, accentColor, onLog }: {
  lastWeight:number; repsRange:string; accentColor:string
  onLog:(w:number,r:number)=>Promise<void>
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
      borderRadius:12, background:'rgba(48,209,88,0.1)', border:'0.5px solid rgba(48,209,88,0.35)',
      marginBottom:8 }}>
      <Check size={14} strokeWidth={3} style={{ color:'#30D158' }} />
      <span style={{ fontSize:13, color:'#30D158', fontWeight:600 }}>Drop set logged · {wt} lbs × {reps}</span>
    </div>
  )

  return (
    <div style={{ marginBottom:8 }}>
      {!open ? (
        <button onClick={()=>setOpen(true)} style={{ width:'100%', padding:'10px 14px',
          borderRadius:12, background:'rgba(255,159,10,0.08)',
          border:`0.5px solid rgba(255,159,10,0.3)`,
          display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:14 }}>🔽</span>
          <div style={{ flex:1, textAlign:'left' }}>
            <p style={{ fontSize:13, fontWeight:700, color:'#FF9F0A' }}>Add Drop Set</p>
            <p style={{ fontSize:11, color:'#8E8E93' }}>Suggested: {suggestedWt} lbs (−20%) · to failure</p>
          </div>
        </button>
      ) : (
        <div style={{ padding:'12px 14px', borderRadius:12,
          background:'rgba(255,159,10,0.08)', border:'0.5px solid rgba(255,159,10,0.35)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#FF9F0A', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:10 }}>Drop Set — reduce weight · push to failure</p>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:10 }}>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:10, color:'#8E8E93', marginBottom:4 }}>WEIGHT</p>
              <div style={{ display:'flex', gap:6 }}>
                {([-10,-5,+5,+10]).map(d => (
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
            background:'#FF9F0A', color:'#fff', fontSize:14, fontWeight:800,
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

// ── Rest Timer ────────────────────────────────────────────────────
function RestPill({ seconds, exName, onDone, onRestPause }: { seconds:number; exName:string; onDone:()=>void; onRestPause:()=>void }) {
  // Absolute end timestamp so the timer recovers correctly after
  // the iPhone screen locks (JS setTimeout freezes while screen is off)
  const [endTime] = useState(() => Date.now() + seconds * 1000)
  const [rem, setRem] = useState(seconds)

  useEffect(() => {
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000))
      setRem(remaining)
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
    <div className="rest-pill">
      <svg width="30" height="30" viewBox="0 0 32 32" style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" stroke="rgba(84,84,88,0.4)" />
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" strokeLinecap="round"
          style={{ stroke:'#FF9F0A', strokeDasharray:`${2*Math.PI*13}`,
            strokeDashoffset:`${2*Math.PI*13*(1-pct/100)}`, transition:'stroke-dashoffset 1s linear' }} />
      </svg>
      <span style={{ fontSize:17, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.3px' }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <div style={{ width:0.5, height:18, background:'rgba(84,84,88,0.6)', flexShrink:0 }} />
      <button onClick={onRestPause} title="Rest-Pause: 15s then log more reps"
        style={{ padding:'4px 9px', borderRadius:999, flexShrink:0,
        background:'rgba(10,132,255,0.25)', fontSize:11, fontWeight:700, color:'#0A84FF',
        border:'0.5px solid rgba(10,132,255,0.4)' }}>
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

  const workout = WORKOUTS.find(w=>w.key===key)!
  const cfg     = WEEK_CONFIG[wk]
  const accent  = WC[key]

  const [rms,       setRms]       = useState<Record<string,number>>({})
  const [round,     setRound]     = useState(5)
  const [equipment, setEquipment] = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [sid,       setSid]       = useState<string|null>(null)
  const [sets,      setSets]      = useState<Record<string,any[]>>({})
  const [lasts,     setLasts]     = useState<Record<string,number|null>>({})
  const [smartMap,  setSmartMap]  = useState<Record<string,SmartSuggestion|null>>({})
  const [open,      setOpen]      = useState<string>(workout.exercises[0]?.name ?? '')
  const [swapped,   setSwapped]   = useState<Record<string,{name:string;cue:string}>>({})
  const [progPrefs,   setProgPrefs]   = useState<Record<string,{name:string;cue:string}>>({})
  const [cycleNumber, setCycleNumber] = useState(1)
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;name:string;startedAt:number}|null>(null)
  const [showExitSheet,   setShowExitSheet]   = useState(false)
  const [resumeCandidate, setResumeCandidate] = useState<{id:string;started_at:string;logged_sets:any[]}|null>(null)
  const [syncErrors,      setSyncErrors]      = useState<string[]>([])
  const [done,      setDone]      = useState(false)

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
      const lastMap:Record<string,number|null>={}, smartM:Record<string,SmartSuggestion|null>={}
      await Promise.all(workout.exercises.map(async ex=>{
        if (ex.isBodyweight) { smartM[ex.name]=null; lastMap[ex.name]=null; return }
        // Use the preferred exercise name (from program prefs) for history lookup.
        // If user swapped "Bench Press" → "DB Bench Press" in Program, we look up
        // DB Bench Press history so suggestions are based on what they actually lift.
        const effectiveName = prefs[ex.name]?.name ?? ex.name
        // Also check if there's a 1RM stored under the effective name; fall back to original
        const oneRm = rm[effectiveName] ?? 0
        const recent = await getRecentSetsForExercise(effectiveName, 15)
        lastMap[ex.name]  = recent[0]?.weight_lbs ?? null
        smartM[ex.name]   = calculateSmartSuggestion(recent, ex.type, wk, oneRm, settings.round_to_lbs)
      }))
      setLasts(lastMap); setSmartMap(smartM)
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

  const total  = workout.exercises.reduce((a,ex)=>a+getSetsForWeek(ex.type,wk), 0)
  const logged = Object.values(sets).reduce((a,s)=>a+s.length, 0)
  const pct    = total>0 ? logged/total : 0

  const effName = (ex:Exercise) => swapped[ex.name]?.name ?? progPrefs[ex.name]?.name ?? ex.name
  const effCue  = (ex:Exercise) => swapped[ex.name]?.cue  ?? progPrefs[ex.name]?.cue  ?? ex.cue
  const tgt     = (ex:Exercise) => {
    if (ex.isBodyweight) return 0
    const sm = smartMap[ex.name]; if (sm) return sm.weight
    // Check 1RM under effective name (preferred exercise) first, then original
    const effectiveName = progPrefs[ex.name]?.name ?? ex.name
    const oneRm = rms[effectiveName] ?? 0
    return getTargetWeight(oneRm, ex.type, wk, round)
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

  const handleLog = async (origEx:Exercise, setNum:number, weight:number|null, reps:number, rir:number, tempo:string='Standard') => {
    // Lazy session creation — only hit the DB when user actually logs a set
    let sessionId = sid
    if (!sessionId) {
      const sess = await createSession(wk, key, cycleNumber)
      sessionId = sess.id
      setSid(sessionId)
    }

    // Optimistic update — advance UI immediately so the workout never freezes
    const tempId = `pending-${Date.now()}`
    const tempSet = { id: tempId, exercise_name: effName(origEx), set_number: setNum,
                      weight_lbs: weight, reps, rir, pending: true }
    setSets(prev => ({...prev, [origEx.name]: [...(prev[origEx.name]??[]), tempSet]}))

    // Sync to Supabase in background with retry
    logWithRetry(sessionId!, effName(origEx), setNum, weight, reps, false, rir, tempo)  // 3 retries
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
    setRest({ sec: getRestSeconds(wk, origEx.type), name: effName(origEx), startedAt: Date.now() })
    if (newLogged.length >= getSetsForWeek(origEx.type, wk)) {
      const next = workout.exercises.find(e => (newSets[e.name]?.length??0) < getSetsForWeek(e.type,wk))
      if (next) setTimeout(()=>setOpen(next.name), 500)
    }
  }


  if (done) return (
    <div style={{ position:'fixed', inset:0, background:'#000', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:28, padding:'0 32px' }}>
      <div style={{ width:88, height:88, borderRadius:'50%', background:'rgba(48,209,88,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Trophy size={44} style={{ color:'#30D158' }} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Workout Complete</p>
        <h2 style={{ fontSize:34, fontWeight:800, color:'#fff', letterSpacing:'-1px' }}>{workout.shortName}</h2>
        <p style={{ fontSize:17, color:'#8E8E93', marginTop:8 }}>Week {wk} · {logged} sets logged</p>
      </div>
      <button onClick={()=>router.push('/')} style={{ width:'100%', maxWidth:280, height:54,
        borderRadius:16, fontSize:17, fontWeight:700, background:accent, color:'#fff' }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'#000' }}>

      {/* Nav */}
      <div className="pt-safe sticky top-0 z-30" style={{
        background:'rgba(0,0,0,0.94)', backdropFilter:'saturate(180%) blur(28px)',
        WebkitBackdropFilter:'saturate(180%) blur(28px)', borderBottom:'0.5px solid rgba(84,84,88,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px 10px' }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ChevronLeft size={17} strokeWidth={2.5} style={{ color:accent }} />
          </button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>{workout.shortName}</p>
            <p style={{ fontSize:12, color:'#8E8E93' }}>Week {wk} · {cfg.phase.split('—')[0].trim()} · RIR {cfg.rir}</p>
          </div>
          <div style={{ padding:'6px 14px', borderRadius:999, background:'rgba(118,118,128,0.15)',
            border:'0.5px solid rgba(84,84,88,0.5)' }}>
            <span style={{ fontSize:18, fontWeight:800, color:accent }}>{logged}</span>
            <span style={{ fontSize:12, color:'#8E8E93' }}> / {total}</span>
          </div>
        </div>
        <div style={{ height:3, background:'rgba(118,118,128,0.2)' }}>
          <div style={{ height:'100%', background:accent, width:`${pct*100}%`,
            transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow:`0 0 8px ${accent}88` }} />
        </div>
      </div>

      {/* Exercise list */}
      <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 }}>
        {workout.exercises.map((origEx, idx) => {
          const exSets   = getSetsForWeek(origEx.type, wk)
          const exReps   = getRepsForWeek(origEx.type, wk)
          const exLogged = sets[origEx.name] ?? []
          const isComp   = exLogged.length >= exSets
          const isOpen   = open === origEx.name
          const target   = tgt(origEx)
          const smart    = smartMap[origEx.name]
          const lastWt   = lasts[origEx.name] ?? null
          const nextSet  = exLogged.length + 1  // which set is active

          return (
            <div key={origEx.name} style={{
              borderRadius:18, overflow:'hidden',
              background: isOpen ? '#0D0D18' : '#0A0A12',
              border:`0.5px solid ${isOpen ? `${accent}55` : 'rgba(84,84,88,0.35)'}`,
              borderLeft:`3px solid ${isComp ? '#30D158' : isOpen ? accent : 'rgba(84,84,88,0.3)'}`,
              opacity: isComp && !isOpen ? 0.5 : 1, transition:'all 0.2s' }}>

              {/* Header */}
              <button onClick={()=>setOpen(isOpen ? '' : origEx.name)}
                style={{ width:'100%', padding:'13px 14px', display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ display:'flex', flexDirection:'column', gap:3, width:22, flexShrink:0 }}>
                  {Array.from({length:exSets}).map((_,i) => (
                    <div key={i} style={{ height:4, borderRadius:99, transition:'background 0.3s',
                      background: i<exLogged.length ? '#30D158' : 'rgba(84,84,88,0.35)' }} />
                  ))}
                </div>
                <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                  <p style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}
                     className="truncate">{effName(origEx)}</p>
                  <p style={{ fontSize:12, color:'#8E8E93', marginTop:2 }}>
                    {origEx.muscle}
                    {!origEx.isBodyweight && target>0 && (
                      <span style={{ color: smart?.direction==='up'?'#30D158':smart?.direction==='down'?'#FF9F0A':accent }}>
                        {` · ${target} lbs`}{smart?.direction==='up'?' ↑':smart?.direction==='down'?' ↓':''}
                      </span>
                    )}
                  </p>
                </div>
                <span style={{ fontSize:14, fontWeight:800, color:isComp?'#30D158':'#fff' }}>
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
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{exReps} reps</span>
                    <span style={{ color:'#8E8E93' }}>·</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>RIR {cfg.rir}</span>
                    {lastWt && <>
                      <span style={{ color:'#8E8E93', marginLeft:'auto' }}>·</span>
                      <span style={{ fontSize:12, color:'#8E8E93' }}>Last: {lastWt} lbs</span>
                    </>}
                  </div>

                  {/* Logged sets */}
                  {exLogged.map((l:any, i:number) => (
                    <LoggedRow key={i} setNum={i+1} weight={l.weight_lbs} reps={l.reps} rir={l.rir} />
                  ))}

                  {/* Active set card */}
                  {!isComp && (
                    <ActiveSetCard
                      setNum={nextSet} setCount={exSets}
                      target={target} repsRange={exReps}
                      lastWeight={lastWt} isBodyweight={!!origEx.isBodyweight}
                      accentColor={accent}
                      onLog={(w,r,rir,tempo) => handleLog(origEx, nextSet, w, r, rir, tempo)}
                    />
                  )}

                  {/* Pending sets */}
                  {!isComp && Array.from({length: exSets - nextSet}, (_,i) => (
                    <PendingRow key={i} setNum={nextSet+1+i} target={target} />
                  ))}

                  {/* Cue + swap */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:10, marginTop:4 }}>
                    <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', lineHeight:1.6, flex:1 }}>
                      {effCue(origEx)}
                    </p>
                    {EXERCISE_ALTS[origEx.name] && (
                      <button onClick={()=>setAltsFor(origEx.name)} style={{ display:'flex',
                        alignItems:'center', gap:5, padding:'6px 12px', borderRadius:10,
                        background:'rgba(10,132,255,0.12)', border:'0.5px solid rgba(10,132,255,0.3)', flexShrink:0 }}>
                        <ArrowLeftRight size={12} style={{ color:'#0A84FF' }} />
                        <span style={{ fontSize:12, fontWeight:700, color:'#0A84FF' }}>Swap</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {logged >= total && (
          <button onClick={async()=>{ if(sid) await completeSession(sid); setDone(true) }}
            style={{ width:'100%', height:56, borderRadius:18, fontSize:17, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:'linear-gradient(135deg, #30D158, #34C759)',
              color:'#fff', marginTop:4, boxShadow:'0 4px 24px rgba(48,209,88,0.35)' }}>
            <CheckCircle2 size={20} strokeWidth={2.5} /> Complete Workout
          </button>
        )}
      </div>

      {rest    && <RestPill key={rest.startedAt} seconds={rest.sec} exName={rest.name} onDone={()=>setRest(null)} onRestPause={()=>setRest(p=>p?{...p,sec:15,startedAt:Date.now()}:null)} />}
      {altsFor && <AltsSheet exName={altsFor} equipment={equipment}
        onSwap={(n,c)=>{ setSwapped(p=>({...p,[altsFor]:{name:n,cue:c}})); setAltsFor(null) }}
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
          background:'rgba(255,159,10,0.97)', display:'flex', gap:10, alignItems:'center',
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
                  background:'rgba(255,69,58,0.1)',
                  border:'0.5px solid rgba(255,69,58,0.3)', color:'#FF453A' }}>
                Discard Session
                <span style={{ display:'block', fontSize:12, fontWeight:500,
                  color:'rgba(255,69,58,0.6)', marginTop:1 }}>Removes all logged sets</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
