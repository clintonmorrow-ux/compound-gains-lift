'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X, Trophy, Minus, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getRecentSetsForExercise, fetchEquipment, fetchExercisePreferences } from '@/lib/db'
import { getRestSeconds, fireRestCompleteNotification, requestNotificationPermission } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'#0A84FF', B:'#30D158', C:'#BF5AF2', D:'#FF9F0A' }

// ── Active Set Card (current set being logged) ────────────────────
function ActiveSetCard({ setNum, setCount, target, repsRange, lastWeight, isBodyweight, accentColor, onLog }: {
  setNum:number; setCount:number; target:number; repsRange:string
  lastWeight:number|null; isBodyweight:boolean; accentColor:string
  onLog:(w:number|null, r:number, rir:number)=>Promise<void>
}) {
  const parts   = repsRange.replace('–','-').split('-').map(Number)
  const maxReps = parts[1] || parts[0] || 10

  const [wt,   setWt]   = useState(isBodyweight ? 0 : (target > 0 ? target : lastWeight ?? 0))
  const [reps, setReps] = useState(maxReps)
  const [rir,  setRir]  = useState(3)
  const [busy, setBusy] = useState(false)

  const adjust = (field: 'wt'|'reps', delta: number) => {
    if (field === 'wt')   setWt(w  => Math.max(0, w  + delta))
    if (field === 'reps') setReps(r => Math.max(1, r  + delta))
  }

  const commit = async () => {
    if (busy) return
    setBusy(true)
    await onLog(wt > 0 ? wt : null, reps, rir)
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
              value={wt || ''} onChange={e => setWt(parseFloat(e.target.value)||0)}
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

// ── Rest Timer ────────────────────────────────────────────────────
function RestPill({ seconds, exName, onDone }: { seconds:number; exName:string; onDone:()=>void }) {
  const [rem, setRem] = useState(seconds)
  useEffect(() => {
    if (rem<=0) { fireRestCompleteNotification(exName); onDone(); return }
    const t = setTimeout(()=>setRem(r=>r-1), 1000)
    return ()=>clearTimeout(t)
  }, [rem, exName, onDone])
  const m=Math.floor(rem/60), s=rem%60, pct=(rem/seconds)*100
  return (
    <div className="rest-pill">
      <svg width="32" height="32" viewBox="0 0 32 32" style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" stroke="rgba(84,84,88,0.4)" />
        <circle cx="16" cy="16" r="13" fill="none" strokeWidth="2.5" strokeLinecap="round"
          style={{ stroke:'#FF9F0A', strokeDasharray:`${2*Math.PI*13}`,
            strokeDashoffset:`${2*Math.PI*13*(1-pct/100)}`, transition:'stroke-dashoffset 1s linear' }} />
      </svg>
      <span style={{ fontSize:18, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums' }}>
        {m}:{String(s).padStart(2,'0')}
      </span>
      <span style={{ fontSize:12, color:'#8E8E93' }}>rest</span>
      <button onClick={onDone} style={{ padding:'5px 12px', borderRadius:999,
        background:'rgba(118,118,128,0.25)', fontSize:12, fontWeight:600, color:'#8E8E93' }}>
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
  const [progPrefs, setProgPrefs] = useState<Record<string,{name:string;cue:string}>>({})
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;name:string}|null>(null)
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
      const sess = await createSession(wk, key)
      setSid(sess.id)
    } catch(e){ console.error('Init:',e) }
  }, [wk, key, workout.exercises])

  useEffect(()=>{ init() }, [init])

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

  const handleLog = async (origEx:Exercise, setNum:number, weight:number|null, reps:number, rir:number) => {
    if (!sid) return
    const row = await logSet(sid, effName(origEx), setNum, weight, reps)
    const newLogged = [...(sets[origEx.name]??[]), {...row, rir}]
    const newSets   = {...sets, [origEx.name]: newLogged}
    setSets(newSets)
    setRest({ sec: getRestSeconds(wk, origEx.type), name: effName(origEx) })
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
                      onLog={(w,r,rir) => handleLog(origEx, nextSet, w, r, rir)}
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

      {rest    && <RestPill seconds={rest.sec} exName={rest.name} onDone={()=>setRest(null)} />}
      {altsFor && <AltsSheet exName={altsFor} equipment={equipment}
        onSwap={(n,c)=>{ setSwapped(p=>({...p,[altsFor]:{name:n,cue:c}})); setAltsFor(null) }}
        onClose={()=>setAltsFor(null)} />}
    </div>
  )
}
