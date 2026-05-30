'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, CheckCircle2, ArrowLeftRight, X, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import { getTargetWeight, getSetsForWeek, getRepsForWeek } from '@/lib/program/calculator'
import { fetchAllOneRms, fetchSettings, createSession, completeSession,
         logSet, getRecentSetsForExercise, fetchEquipment } from '@/lib/db'
import { getRestSeconds, fireRestCompleteNotification, requestNotificationPermission } from '@/lib/program/restTimes'
import { EXERCISE_ALTS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { calculateSmartSuggestion, type SmartSuggestion } from '@/lib/program/smartSuggestions'
import type { Exercise, WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'#0A84FF', B:'#30D158', C:'#BF5AF2', D:'#FF9F0A' }

// ── Inline Set Row ────────────────────────────────────────────────
function SetRow({ setNum, target, repsRange, lastWeight, existing, onLog, isBodyweight }: {
  setNum:number; target:number; repsRange:string; lastWeight:number|null
  existing:any|null; onLog:(w:number|null,r:number)=>Promise<void>; isBodyweight:boolean
}) {
  const [_, maxR] = repsRange.replace('–','-').split('-').map(Number)
  const initWt = existing?.weight_lbs?.toString()
    ?? (target > 0 ? target.toString() : lastWeight ? lastWeight.toString() : '')
  const initRp = existing?.reps?.toString() ?? ''

  const [wt,   setWt]   = useState(initWt)
  const [reps, setReps] = useState(initRp)
  const [busy, setBusy] = useState(false)
  const isDone = !!existing

  const ready  = !isDone && !busy && (isBodyweight || wt.length > 0) && reps.length > 0

  const commit = async () => {
    if (!ready) return
    setBusy(true)
    await onLog(isBodyweight ? null : (parseFloat(wt)||null), parseInt(reps)||(maxR||10))
    setBusy(false)
  }

  const rowBg     = isDone ? 'rgba(48,209,88,0.1)'  : 'rgba(118,118,128,0.1)'
  const rowBorder = isDone ? 'rgba(48,209,88,0.35)' : 'rgba(84,84,88,0.4)'
  const inputBg   = isDone ? 'transparent'          : 'rgba(118,118,128,0.18)'
  const inputClr  = isDone ? '#8E8E93'               : 'var(--label)'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, height:52, paddingInline:12,
      borderRadius:14, background:rowBg, border:`0.5px solid ${rowBorder}` }}>

      {/* Badge */}
      <div style={{ width:28, height:28, borderRadius:'50%', flexShrink:0, display:'flex',
        alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800,
        background: isDone ? '#30D158' : 'rgba(84,84,88,0.35)',
        color: isDone ? '#000' : '#8E8E93' }}>
        {isDone ? '✓' : setNum}
      </div>

      {/* Weight */}
      {isBodyweight
        ? <span style={{ flex:1, fontSize:14, color:'#8E8E93', textAlign:'center' }}>Bodyweight</span>
        : <input type="number" inputMode="decimal"
            placeholder={target>0 ? String(target) : lastWeight ? String(lastWeight) : '—'}
            value={wt} onChange={e=>setWt(e.target.value)} onFocus={e=>e.target.select()}
            readOnly={isDone}
            style={{ flex:1, height:32, textAlign:'center', borderRadius:8, outline:'none',
              fontSize:15, fontWeight:700, letterSpacing:'-0.4px',
              background:inputBg, color:inputClr, border:'none' }} />}

      <span style={{ fontSize:13, color:'rgba(84,84,88,0.8)', flexShrink:0 }}>×</span>

      {/* Reps */}
      <input type="number" inputMode="numeric"
        placeholder={String(maxR||10)}
        value={reps} onChange={e=>setReps(e.target.value)} onFocus={e=>e.target.select()}
        readOnly={isDone}
        style={{ width:56, height:36, textAlign:'center', borderRadius:10, outline:'none',
          fontSize:16, fontWeight:700, letterSpacing:'-0.5px',
          background:inputBg, color:inputClr, border:'none' }} />

      <span style={{ fontSize:12, color:'#8E8E93', flexShrink:0, minWidth:28 }}>reps</span>

      {/* CTA */}
      <button onClick={commit} disabled={!ready && !isDone}
        style={{ width:36, height:36, borderRadius:'50%', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: isDone ? 'rgba(48,209,88,0.2)' : ready ? '#FF9F0A' : 'rgba(84,84,88,0.2)',
          transition:'background 0.15s, transform 0.1s' }}>
        {busy
          ? <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid transparent',
              borderTopColor:'#fff', animation:'spin 0.7s linear infinite' }} />
          : <Check size={15} strokeWidth={3}
              style={{ color: isDone ? '#30D158' : ready ? '#fff' : '#8E8E93' }} />}
      </button>
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
      <span style={{ fontSize:18, fontWeight:700, color:'#fff', fontVariantNumeric:'tabular-nums', letterSpacing:'-0.5px' }}>
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

// ── Alts Sheet ────────────────────────────────────────────────────
function AltsSheet({ exName, equipment, onSwap, onClose }: {
  exName:string; equipment:string[]; onSwap:(n:string,c:string)=>void; onClose:()=>void
}) {
  const alts  = EXERCISE_ALTS[exName] ?? {}
  const keys  = Object.keys(alts) as EquipmentKey[]
  const avail = keys.filter(k=>equipment.includes(k))
  const other = keys.filter(k=>!equipment.includes(k))
  const Section = ({ title, items, dim=false }: { title:string; items:EquipmentKey[]; dim?:boolean }) => (
    <div style={{ opacity: dim ? 0.55 : 1 }}>
      <p style={{ fontSize:11, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{title}</p>
      <div className="ios-group">
        {items.flatMap((k,gi)=>(alts[k]??[]).map((alt,ai)=>(
          <button key={`${k}-${ai}`} onClick={()=>onSwap(alt.name,alt.cue)}
            className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}>
            <span style={{ fontSize:18, width:28, textAlign:'center', flexShrink:0 }}>{EQUIPMENT_ICONS[k]}</span>
            <div className="flex-1 text-left">
              <p style={{ fontSize:15, fontWeight:600, color:'var(--label)' }}>{alt.name}</p>
              <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', marginTop:2, lineHeight:1.4 }}>{alt.cue}</p>
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
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%', background:'rgba(118,118,128,0.2)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
            <X size={15} style={{ color:'#8E8E93' }} />
          </button>
        </div>
        <div style={{ height:0.5, background:'rgba(84,84,88,0.6)' }} />
        <div className="overflow-y-auto flex-1" style={{ padding:'16px', display:'flex', flexDirection:'column', gap:20 }}>
          {avail.length>0 && <Section title="Your Equipment" items={avail} />}
          {other.length>0 && <Section title="Other Options" items={other} dim />}
        </div>
        <div style={{ padding:'12px 16px 4px' }}>
          <button onClick={onClose} style={{ width:'100%', padding:'14px', borderRadius:14,
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
  const [altsFor,   setAltsFor]   = useState<string|null>(null)
  const [rest,      setRest]      = useState<{sec:number;name:string}|null>(null)
  const [done,      setDone]      = useState(false)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const {data:{session}} = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      await requestNotificationPermission()
      const [rmArr, settings, equip] = await Promise.all([fetchAllOneRms(), fetchSettings(), fetchEquipment()])
      const rm:Record<string,number>={}; rmArr.forEach((x:any)=>{rm[x.exercise_name]=x.weight_lbs})
      setRms(rm); setRound(settings.round_to_lbs); setEquipment(equip)
      // Load recent performance for each exercise
      const lastMap:Record<string,number|null>={}, smartM:Record<string,SmartSuggestion|null>={}
      await Promise.all(workout.exercises.map(async ex=>{
        if (ex.isBodyweight) { smartM[ex.name]=null; lastMap[ex.name]=null; return }
        const recent = await getRecentSetsForExercise(ex.name, 15)
        lastMap[ex.name]  = recent[0]?.weight_lbs ?? null
        smartM[ex.name]   = calculateSmartSuggestion(recent, ex.type, wk, rm[ex.name]??0, settings.round_to_lbs)
      }))
      setLasts(lastMap); setSmartMap(smartM)
      const sess = await createSession(wk, key)
      setSid(sess.id)
    } catch(e){ console.error('Init error:',e) }
  }, [wk, key, workout.exercises])

  useEffect(()=>{ init() }, [init])

  const total  = workout.exercises.reduce((a,ex)=>a+getSetsForWeek(ex.type,wk), 0)
  const logged = Object.values(sets).reduce((a,s)=>a+s.length, 0)
  const pct    = total>0 ? logged/total : 0

  const effName = (ex:Exercise) => swapped[ex.name]?.name ?? ex.name
  const effCue  = (ex:Exercise) => swapped[ex.name]?.cue  ?? ex.cue
  const tgt     = (ex:Exercise) => {
    if (ex.isBodyweight) return 0
    const sm=smartMap[ex.name]; if (sm) return sm.weight
    return getTargetWeight(rms[ex.name]??0, ex.type, wk, round)
  }

  const handleLog = async (origEx:Exercise, setNum:number, weight:number|null, reps:number) => {
    if (!sid) return
    const row = await logSet(sid, effName(origEx), setNum, weight, reps)
    const newSets = {...sets, [origEx.name]: [...(sets[origEx.name]??[]), row]}
    setSets(newSets)
    setRest({ sec: getRestSeconds(wk, origEx.type), name: effName(origEx) })
    const allDoneNow = getSetsForWeek(origEx.type, wk) <= (newSets[origEx.name]?.length??0)
    if (allDoneNow) {
      const next = workout.exercises.find(e => (newSets[e.name]?.length??0) < getSetsForWeek(e.type,wk))
      if (next) setTimeout(()=>setOpen(next.name), 400)
    }
  }

  // ── Complete screen ──
  if (done) return (
    <div style={{ position:'fixed', inset:0, background:'#000',
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:28, padding:'0 32px' }}>
      <div style={{ width:88, height:88, borderRadius:'50%', background:'rgba(48,209,88,0.15)',
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        <Trophy size={44} style={{ color:'#30D158' }} strokeWidth={1.5} />
      </div>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>
          Workout Complete
        </p>
        <h2 style={{ fontSize:34, fontWeight:800, color:'#fff', letterSpacing:'-1px', lineHeight:1.1 }}>
          Week {wk} · {workout.shortName}
        </h2>
        <p style={{ fontSize:17, color:'#8E8E93', marginTop:10 }}>{logged} sets logged</p>
      </div>
      <button onClick={()=>router.push('/')}
        style={{ width:'100%', maxWidth:280, height:54, borderRadius:16, fontSize:17, fontWeight:700,
          background: accent, color:'#fff', letterSpacing:'-0.3px' }}>
        Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'#000' }}>

      {/* ── Sticky header ── */}
      <div className="pt-safe sticky top-0 z-30" style={{
        background:'rgba(0,0,0,0.94)',
        backdropFilter:'saturate(180%) blur(28px)', WebkitBackdropFilter:'saturate(180%) blur(28px)',
        borderBottom:`0.5px solid rgba(84,84,88,0.6)` }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px 10px' }}>
          <button onClick={()=>router.back()} style={{ width:36, height:36, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <ChevronLeft size={17} strokeWidth={2.5} style={{ color: accent }} />
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}
               className="truncate">{workout.shortName}</p>
            <p style={{ fontSize:12, color:'#8E8E93', marginTop:1 }}>
              Week {wk} · {cfg.phase.split('—')[0].trim()} · RIR {cfg.rir}
            </p>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 14px',
            borderRadius:999, background:'rgba(118,118,128,0.15)', border:'0.5px solid rgba(84,84,88,0.5)' }}>
            <span style={{ fontSize:18, fontWeight:800, color: accent, fontVariantNumeric:'tabular-nums' }}>{logged}</span>
            <span style={{ fontSize:12, color:'#8E8E93' }}>/ {total}</span>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height:3, background:'rgba(118,118,128,0.2)', margin:'0 0 0' }}>
          <div style={{ height:'100%', background: accent, width:`${pct*100}%`,
            transition:'width 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow:`0 0 8px ${accent}88` }} />
        </div>
      </div>

      {/* ── Exercise list ── */}
      <div style={{ padding:'14px 14px', display:'flex', flexDirection:'column', gap:8 }}>
        {workout.exercises.map((origEx, idx) => {
          const exSets   = getSetsForWeek(origEx.type, wk)
          const exReps   = getRepsForWeek(origEx.type, wk)
          const exLogged = sets[origEx.name] ?? []
          const isComp   = exLogged.length >= exSets
          const isOpen   = open === origEx.name
          const target   = tgt(origEx)
          const smart    = smartMap[origEx.name]
          const lastWt   = lasts[origEx.name] ?? null
          const isSwap   = !!swapped[origEx.name]

          return (
            <div key={origEx.name} style={{
              borderRadius:18,
              background: isOpen ? '#13131F' : '#0D0D14',
              border:`0.5px solid ${isOpen ? `${accent}50` : 'rgba(84,84,88,0.4)'}`,
              borderLeft: `3px solid ${isComp ? '#30D158' : isOpen ? accent : 'rgba(84,84,88,0.4)'}`,
              overflow:'hidden',
              transition:'border-color 0.25s, background 0.25s, opacity 0.25s',
              opacity: isComp && !isOpen ? 0.5 : 1,
            }}>

              {/* ── Header (always visible) ── */}
              <button onClick={()=>setOpen(isOpen ? '' : origEx.name)}
                style={{ width:'100%', padding:'11px 14px',
                  display:'flex', alignItems:'center', gap:8 }}>
                {/* Set dots */}
                <div style={{ display:'flex', flexDirection:'column', gap:3, flexShrink:0, width:24 }}>
                  {Array.from({length:exSets}).map((_,i)=>(
                    <div key={i} style={{ height:4, borderRadius:99,
                      background: i<exLogged.length ? '#30D158' : 'rgba(84,84,88,0.4)',
                      transition:'background 0.3s' }} />
                  ))}
                </div>

                {/* Name + muscle */}
                <div style={{ flex:1, minWidth:0, textAlign:'left' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <p style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}
                       className="truncate">{effName(origEx)}</p>
                    {isSwap && <span style={{ fontSize:10, fontWeight:700, padding:'1px 5px', borderRadius:5,
                      background:'rgba(10,132,255,0.2)', color:'#0A84FF', flexShrink:0 }}>alt</span>}
                  </div>
                  <p style={{ fontSize:12, color:'#8E8E93', marginTop:2 }}>
                    {origEx.muscle}
                    {!origEx.isBodyweight && target > 0 && (
                      <span style={{ color: smart?.direction==='up' ? '#30D158' : smart?.direction==='down' ? '#FF9F0A' : accent }}>
                        {' · '}{target} lbs{smart?.direction==='up' ? ' ↑' : smart?.direction==='down' ? ' ↓' : ''}
                      </span>
                    )}
                  </p>
                </div>

                {/* Progress + chevron */}
                <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:14, fontWeight:800, color: isComp ? '#30D158' : '#fff',
                    fontVariantNumeric:'tabular-nums' }}>
                    {exLogged.length}<span style={{ color:'#8E8E93', fontWeight:500 }}>/{exSets}</span>
                  </span>
                  <div style={{ width:22, height:22, borderRadius:'50%', background:'rgba(118,118,128,0.15)',
                    display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <ChevronRight size={12} strokeWidth={2.5} style={{ color:'#8E8E93',
                      transform: isOpen ? 'rotate(90deg)' : 'none', transition:'transform 0.2s' }} />
                  </div>
                </div>
              </button>

              {/* ── Expanded ── */}
              {isOpen && (
                <div style={{ padding:'0 12px 12px' }}>

                  {/* Prescription strip */}
                  <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 12px',
                    borderRadius:12, background:'rgba(118,118,128,0.1)', marginBottom:14,
                    border:'0.5px solid rgba(84,84,88,0.35)' }}>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{exSets} sets</span>
                    <span style={{ color:'rgba(84,84,88,0.8)', fontSize:13 }}>·</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>{exReps} reps</span>
                    <span style={{ color:'rgba(84,84,88,0.8)', fontSize:13 }}>·</span>
                    <span style={{ fontSize:13, fontWeight:600, color:'#fff' }}>RIR {cfg.rir}</span>
                    {smart?.direction !== 'maintain' && smart && (
                      <>
                        <span style={{ color:'rgba(84,84,88,0.8)', fontSize:13 }}>·</span>
                        <span style={{ fontSize:12, fontWeight:700, padding:'2px 8px', borderRadius:6,
                          background: smart.direction==='up' ? 'rgba(48,209,88,0.15)' : 'rgba(255,159,10,0.15)',
                          color: smart.direction==='up' ? '#30D158' : '#FF9F0A' }}>
                          {smart.direction==='up' ? '↑ Smart' : '↓ Calibrated'}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Target weight + last session */}
                  {!origEx.isBodyweight && (
                    <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:10 }}>
                      <div>
                        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93',
                          textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:2 }}>Target</p>
                        <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                          <span style={{ fontSize:42, fontWeight:800, color:'#fff',
                            letterSpacing:'-2px', lineHeight:1 }}>
                            {target > 0 ? target : '—'}
                          </span>
                          {target > 0 && <span style={{ fontSize:16, color:'#8E8E93' }}>lbs</span>}
                        </div>
                      </div>
                      {lastWt && (
                        <div style={{ textAlign:'right', paddingBottom:4 }}>
                          <p style={{ fontSize:11, fontWeight:600, color:'#8E8E93',
                            textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Last Session</p>
                          <p style={{ fontSize:18, fontWeight:700, color:'rgba(255,255,255,0.4)',
                            letterSpacing:'-0.5px' }}>{lastWt} lbs</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Set table */}
                  <div style={{ marginBottom:10 }}>
                    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                      {Array.from({length:exSets},(_,i)=>i+1).map(n => (
                        <SetRow key={n} setNum={n} target={target} repsRange={exReps}
                          lastWeight={lastWt} isBodyweight={!!origEx.isBodyweight}
                          existing={exLogged.find((l:any)=>l.set_number===n) ?? null}
                          onLog={(w,r)=>handleLog(origEx,n,w,r)} />
                      ))}
                    </div>
                  </div>

                  {/* Cue + swap */}
                  <div style={{ display:'flex', alignItems:'flex-start',
                    justifyContent:'space-between', gap:10, marginTop:6 }}>
                    <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic',
                      lineHeight:1.6, flex:1 }}>
                      {effCue(origEx)}
                    </p>
                    {EXERCISE_ALTS[origEx.name] && (
                      <button onClick={()=>setAltsFor(origEx.name)}
                        style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px',
                          borderRadius:10, background:'rgba(10,132,255,0.12)',
                          border:'0.5px solid rgba(10,132,255,0.3)', flexShrink:0 }}>
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

        {/* ── Finish ── */}
        {logged >= total && (
          <button onClick={async()=>{ if(sid) await completeSession(sid); setDone(true) }}
            style={{ width:'100%', height:56, borderRadius:18, fontSize:17, fontWeight:700,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              background:`linear-gradient(135deg, #30D158, #34C759)`,
              color:'#fff', letterSpacing:'-0.3px', marginTop:4,
              boxShadow:'0 4px 24px rgba(48,209,88,0.35)' }}>
            <CheckCircle2 size={20} strokeWidth={2.5} />
            Complete Workout
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
