'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronRight, Check, RotateCcw, X } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import OnermSection from '@/components/OnermSection'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG, PHASE_LABELS, getWorkouts } from '@/lib/program/data'
import type { ProgramFormat } from '@/types'
import { EXERCISE_ALTS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import { fetchExercisePreferences, saveExercisePreference, fetchEquipment, fetchSettings } from '@/lib/db'
import type { Exercise } from '@/types'

const WC: Record<string,string> = { A:'#0A84FF', B:'#30D158', C:'#BF5AF2', D:'#FF9F0A' }

const PHASES = [
  { label:'Phase 1',    subtitle:'Accumulation',      weeks:'Wk 1–3',  color:'#0A84FF', note:'10–12 reps · RIR 3 · Build foundation' },
  { label:'Deload',     subtitle:'Active Recovery',   weeks:'Wk 4',    color:'#8E8E93', note:'50% volume · RIR 4+ · Full recovery' },
  { label:'Phase 2',    subtitle:'Volume Build',      weeks:'Wk 5–7',  color:'#30D158', note:'8–10 reps · RIR 2 · Peak volume' },
  { label:'Deload',     subtitle:'Active Recovery',   weeks:'Wk 8',    color:'#8E8E93', note:'50% volume · RIR 4+ · Full recovery' },
  { label:'Phase 3',    subtitle:'Intensification',   weeks:'Wk 9–11', color:'#BF5AF2', note:'6–8 reps · RIR 1–2 · Strength peak' },
  { label:'Deload',     subtitle:'Final Recovery',    weeks:'Wk 12',   color:'#8E8E93', note:'50% volume · RIR 4+ · PR attempts' },
]

// ── Swap Sheet ────────────────────────────────────────────────────
function SwapSheet({ ex, equipment, preference, onSwap, onReset, onClose }: {
  ex: Exercise; equipment: string[]
  preference: {name:string;cue:string} | null
  onSwap:(name:string,cue:string)=>void
  onReset:()=>void; onClose:()=>void
}) {
  const alts  = EXERCISE_ALTS[ex.name] ?? {}
  const keys  = Object.keys(alts) as EquipmentKey[]
  const avail = keys.filter(k => equipment.includes(k))
  const other = keys.filter(k => !equipment.includes(k))

  const Sect = ({ title, items, dim=false }: { title:string; items:EquipmentKey[]; dim?:boolean }) => (
    <div style={{ opacity: dim?0.55:1 }}>
      <p style={{ fontSize:11, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>{title}</p>
      <div className="ios-group">
        {items.flatMap((k,gi) => (alts[k]??[]).map((alt,ai) => {
          const active = preference?.name === alt.name
          return (
            <button key={`${k}-${ai}`} onClick={() => onSwap(alt.name, alt.cue)}
              className={`ios-row tap w-full ${gi===0&&ai===0?'ios-row-first':''}`}
              style={{ background: active ? 'rgba(255,159,10,0.12)' : 'var(--bg-2)' }}>
              <span style={{ fontSize:18, width:28, flexShrink:0 }}>{EQUIPMENT_ICONS[k]}</span>
              <div className="flex-1 text-left">
                <p style={{ fontSize:15, fontWeight:600, color:'#fff' }}>{alt.name}</p>
                <p style={{ fontSize:12, color:'#8E8E93', fontStyle:'italic', marginTop:2, lineHeight:1.4 }}>{alt.cue}</p>
              </div>
              {active
                ? <Check size={16} strokeWidth={2.5} style={{ color:'#FF9F0A', flexShrink:0 }} />
                : <ChevronRight size={14} style={{ color:'#8E8E93', flexShrink:0 }} />}
            </button>
          )
        }))}
      </div>
    </div>
  )

  return (
    <div className="sheet-scrim" onClick={onClose}>
      <div className="sheet-panel" onClick={e=>e.stopPropagation()}
           style={{ maxHeight:'82vh', display:'flex', flexDirection:'column' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', padding:'16px 20px 12px' }}>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ fontSize:11, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.06em' }}>Swap for all 12 weeks</p>
            <p style={{ fontSize:18, fontWeight:700, color:'#fff', marginTop:2 }}>{ex.name}</p>
            {preference && (
              <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:6,
                padding:'5px 10px', borderRadius:8, background:'rgba(255,159,10,0.12)',
                border:'0.5px solid rgba(255,159,10,0.3)', width:'fit-content' }}>
                <span style={{ fontSize:12, color:'#FF9F0A' }}>Currently: {preference.name}</span>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0 }}>
            <X size={15} style={{ color:'#8E8E93' }} />
          </button>
        </div>
        <div style={{ height:0.5, background:'rgba(84,84,88,0.6)' }} />
        <div className="overflow-y-auto flex-1" style={{ padding:16, display:'flex', flexDirection:'column', gap:16 }}>
          {avail.length > 0 && <Sect title="Your Equipment" items={avail} />}
          {other.length > 0 && <Sect title="Other Options" items={other} dim />}
        </div>
        <div style={{ padding:'8px 16px 4px', display:'flex', flexDirection:'column', gap:8 }}>
          {preference && (
            <button onClick={onReset} style={{ width:'100%', padding:12, borderRadius:12,
              background:'rgba(255,69,58,0.1)', border:'0.5px solid rgba(255,69,58,0.3)',
              fontSize:14, fontWeight:600, color:'#FF453A', display:'flex',
              alignItems:'center', justifyContent:'center', gap:6 }}>
              <RotateCcw size={14} /> Reset to {ex.name}
            </button>
          )}
          <button onClick={onClose} style={{ width:'100%', padding:14, borderRadius:14,
            background:'rgba(118,118,128,0.18)', fontSize:15, fontWeight:600, color:'#8E8E93' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────
export default function ProgramPage() {
  const router = useRouter()
  const [prefs,     setPrefs]     = useState<Record<string,{name:string;cue:string}>>({})
  const [equipment, setEquipment] = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [loading,   setLoading]   = useState(true)
  const [swapEx,    setSwapEx]    = useState<Exercise|null>(null)
  const [saved,     setSaved]     = useState<string|null>(null)
  const [saveErr,   setSaveErr]   = useState<string|null>(null)
  const [programFormat, setProgramFormat] = useState<ProgramFormat>(() => {
    if (typeof window === 'undefined') return '4day'
    return (localStorage.getItem('cg_format') as ProgramFormat) ?? '4day'
  })

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const {data:{session}} = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      const [p, eq, s] = await Promise.all([fetchExercisePreferences(), fetchEquipment(), fetchSettings()])
      setPrefs(p); setEquipment(eq)
      const fmt = (s.program_format as ProgramFormat) ?? '4day'
      setProgramFormat(fmt)
      if (typeof window !== 'undefined') localStorage.setItem('cg_format', fmt)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { init() }, [init])

  const handleSwap = async (origEx: Exercise, name: string, cue: string) => {
    // Optimistic update
    const updated = { ...prefs, [origEx.name]: { name, cue } }
    setPrefs(updated)
    setSwapEx(null)
    setSaveErr(null)
    try {
      await saveExercisePreference(origEx.name, { name, cue })
      setSaved(origEx.name)
      setTimeout(() => setSaved(null), 2500)
    } catch(e: any) {
      // Revert on failure
      setPrefs(prev => { const r={...prev}; delete r[origEx.name]; return r })
      setSaveErr(e?.message ?? 'Save failed — check Supabase table exists')
      setTimeout(() => setSaveErr(null), 5000)
    }
  }

  const handleReset = async (origEx: Exercise) => {
    const prev = { ...prefs }
    const updated = { ...prefs }
    delete updated[origEx.name]
    setPrefs(updated)
    setSwapEx(null)
    try {
      await saveExercisePreference(origEx.name, null)
    } catch(e: any) {
      setPrefs(prev)
      setSaveErr(e?.message ?? 'Reset failed')
      setTimeout(() => setSaveErr(null), 5000)
    }
  }

  const displayName = (ex: Exercise) => prefs[ex.name]?.name ?? ex.name
  const hasSwap     = (ex: Exercise) => !!prefs[ex.name]

  if (loading) return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid transparent',
        borderTopColor:'#FF9F0A', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  const customCount = Object.keys(prefs).length

  return (
    <div style={{ minHeight:'100svh', background:'#000' }}>

      {/* Header — no back button, this is a nav tab */}
      <div style={{ position:'sticky', top:0, zIndex:20, paddingTop:'env(safe-area-inset-top)',
        background:'rgba(8,8,14,0.97)', backdropFilter:'saturate(200%) blur(28px)',
        WebkitBackdropFilter:'saturate(200%) blur(28px)',
        borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px 13px' }}>
          <div>
            <p style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.6)', textTransform:'uppercase', letterSpacing:'0.1em' }}>12 Weeks · Galpin</p>
            <p style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.7px', lineHeight:1.1, marginTop:1 }}>Program</p>
          </div>
          {customCount > 0 && (
            <div style={{ padding:'5px 12px', borderRadius:8, background:'rgba(255,159,10,0.13)',
              border:'0.5px solid rgba(255,159,10,0.28)' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#FF9F0A' }}>
                {customCount} custom
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{ padding:'16px 14px', display:'flex', flexDirection:'column', gap:20 }}>

        {/* Phase timeline */}
        <div>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
            letterSpacing:'0.08em', marginBottom:12 }}>Program Structure</p>
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {PHASES.map((ph, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                borderRadius:14, background:'rgba(118,118,128,0.08)',
                border:`0.5px solid ${ph.color === '#8E8E93' ? 'rgba(84,84,88,0.3)' : `${ph.color}33`}` }}>
                <div style={{ width:4, height:36, borderRadius:99, background: ph.color, flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                    <span style={{ fontSize:14, fontWeight:700, color: ph.color }}>{ph.label}</span>
                    <span style={{ fontSize:12, color:'#8E8E93' }}>{ph.subtitle}</span>
                    <span style={{ fontSize:11, fontWeight:600, color:'#8E8E93', marginLeft:'auto' }}>{ph.weeks}</span>
                  </div>
                  <p style={{ fontSize:12, color:'rgba(142,142,147,0.7)', marginTop:2 }}>{ph.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Customize note */}
        <div style={{ padding:'12px 16px', borderRadius:14, background:'rgba(255,159,10,0.08)',
          border:'0.5px solid rgba(255,159,10,0.25)', display:'flex', gap:10 }}>
          <span style={{ fontSize:18, flexShrink:0 }}>💡</span>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.7)', lineHeight:1.6 }}>
            Tap any exercise below to swap it for the <strong style={{ color:'#FF9F0A', fontWeight:700 }}>entire 12-week program</strong>.
            Your equipment preferences are filtered automatically.
          </p>
        </div>

        {/* Workout cards */}
        {getWorkouts(programFormat).map(wkt => {
          const c = WC[wkt.key]
          return (
            <div key={wkt.key}>
              {/* Workout header */}
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:34, height:34, borderRadius:10, flexShrink:0,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  background:`color-mix(in srgb, ${c} 18%, transparent)`,
                  fontSize:14, fontWeight:800, color: c }}>
                  {wkt.key}
                </div>
                <div style={{ flex:1 }}>
                  <p style={{ fontSize:16, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>{wkt.shortName}</p>
                  <p style={{ fontSize:12, color:'#8E8E93' }}>{wkt.focus}</p>
                </div>
                <div style={{ padding:'4px 10px', borderRadius:8,
                  background:`color-mix(in srgb, ${c} 12%, transparent)` }}>
                  <span style={{ fontSize:11, fontWeight:700, color: c }}>
                    {wkt.exercises.length} exercises
                  </span>
                </div>
              </div>

              {/* Exercise list */}
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {wkt.exercises.map((ex, i) => {
                  const isCustom = hasSwap(ex)
                  const dispName = displayName(ex)
                  const isSaved  = saved === ex.name
                  const hasAlts  = !!(EXERCISE_ALTS[ex.name] && Object.keys(EXERCISE_ALTS[ex.name]).length > 0)
                  return (
                    <button key={ex.name} onClick={() => hasAlts && setSwapEx(ex)}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                        borderRadius:12, background: isSaved ? 'rgba(48,209,88,0.1)' :
                          isCustom ? 'rgba(255,159,10,0.08)' : 'rgba(118,118,128,0.08)',
                        border:`0.5px solid ${isSaved ? 'rgba(48,209,88,0.4)' :
                          isCustom ? 'rgba(255,159,10,0.35)' : 'rgba(84,84,88,0.3)'}`,
                        cursor: hasAlts ? 'pointer' : 'default',
                        transition:'all 0.2s', width:'100%', textAlign:'left' }}>
                      {/* Type indicator */}
                      <div style={{ width:6, height:6, borderRadius:'50%', flexShrink:0,
                        background: ex.type==='primary' ? c : ex.type==='secondary' ?
                          `color-mix(in srgb, ${c} 60%, transparent)` : 'rgba(84,84,88,0.5)' }} />
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <p style={{ fontSize:14, fontWeight: isCustom ? 700 : 600,
                            color: isCustom ? '#fff' : 'rgba(255,255,255,0.85)',
                            letterSpacing:'-0.2px' }} className="truncate">
                            {dispName}
                          </p>
                          {isCustom && !isSaved && (
                            <span style={{ fontSize:10, fontWeight:700, padding:'2px 6px',
                              borderRadius:6, background:'rgba(255,159,10,0.2)',
                              color:'#FF9F0A', flexShrink:0 }}>custom</span>
                          )}
                          {isSaved && (
                            <Check size={13} strokeWidth={3} style={{ color:'#30D158', flexShrink:0 }} />
                          )}
                        </div>
                        <p style={{ fontSize:11, color:'#8E8E93', marginTop:1 }}>
                          {ex.muscle} · {ex.type}
                          {isCustom && <span style={{ color:'rgba(255,159,10,0.6)' }}> · was {ex.name}</span>}
                        </p>
                      </div>
                      {hasAlts && (
                        <div style={{ width:26, height:26, borderRadius:8, flexShrink:0,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          background: isCustom ? 'rgba(255,159,10,0.15)' : 'rgba(84,84,88,0.2)' }}>
                          <ChevronRight size={13} style={{ color: isCustom ? '#FF9F0A' : '#8E8E93' }} />
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* ── 1RM Calibration (moved from Settings) ── */}
        <OnermSection format={programFormat} />

        <div style={{ height:8 }} />
      </div>

      {/* Save error toast */}
      {saveErr && (
        <div style={{ position:'fixed', bottom:'calc(var(--safe-bottom) + 72px)', left:16, right:16, zIndex:100,
          padding:'12px 16px', borderRadius:14, background:'rgba(255,69,58,0.95)',
          border:'0.5px solid rgba(255,69,58,0.5)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <p style={{ fontSize:13, color:'#fff', lineHeight:1.5, flex:1 }}>
            {saveErr.includes('does not exist') || saveErr.includes('relation')
              ? 'Table missing — run the SQL migration in Supabase first'
              : saveErr}
          </p>
        </div>
      )}

      {swapEx && (
        <SwapSheet
          ex={swapEx}
          equipment={equipment}
          preference={prefs[swapEx.name] ?? null}
          onSwap={(name, cue) => handleSwap(swapEx, name, cue)}
          onReset={() => handleReset(swapEx)}
          onClose={() => setSwapEx(null)}
        />
      )}

      <BottomNav />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
