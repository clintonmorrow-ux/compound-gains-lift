'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LogOut, ChevronRight } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { getProgram, PROGRAM_LIBRARY } from '@/lib/program/programLibrary'
import type { Program } from '@/types'
import { fetchSettings, updateSettings, fetchEquipment, saveEquipment,
         fetchCoachPrefs, saveCoachPrefs } from '@/lib/db'
import { DEFAULT_COACH_PREFS } from '@/lib/program/coach'
import { EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'

export default function SettingsPage() {
  const router = useRouter()
  const [round,         setRound]         = useState(5)
  const [equip,         setEquip]         = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [loading,       setLoading]       = useState(true)
  const [coachPrefs,    setCoachPrefs]    = useState(DEFAULT_COACH_PREFS)

  const [userEmail,     setUserEmail]     = useState('')
  const [signingOut,    setSigningOut]    = useState(false)
  const [activeProgramId, setActiveProgramId] = useState('galpin-5day-hypertrophy')
  const [previewProgram,  setPreviewProgram]  = useState<Program|null>(null)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{ session } } = await sb.auth.getSession()
      if (session?.user?.email) setUserEmail(session.user.email)
      const [s, eq, cp] = await Promise.all([fetchSettings(), fetchEquipment(), fetchCoachPrefs()])
      setCoachPrefs(cp)
      // Prefer the DB value; fall back to the locally-stored selection
      // (what the workout screen reads) so the two never disagree.
      const lsPid = typeof window !== 'undefined' ? localStorage.getItem('cg_program') : null
      const pid = s.active_program_id ?? lsPid ?? 'galpin-5day-hypertrophy'
      setActiveProgramId(pid)
      if (typeof window !== 'undefined') localStorage.setItem('cg_program', pid)
      setRound(s.round_to_lbs)
      setEquip(eq)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { init() }, [init])

  const toggleCoach = async (key: 'rirTrend'|'deloadAlerts'|'setFatigue') => {
    const next = { ...coachPrefs, [key]: !coachPrefs[key] }
    setCoachPrefs(next)
    try { await saveCoachPrefs(next) } catch {}
  }



  const switchProgram = async (id: string) => {
    if (id === activeProgramId) return
    setActiveProgramId(id)
    if (typeof window !== 'undefined') localStorage.setItem('cg_program', id)
    try {
      await updateSettings({ active_program_id: id, current_week: 1, cycle_number: 1,
        week_started_at: new Date().toISOString() })
      router.refresh()
    } catch(e) { console.error('Failed to switch program:', e) }
  }

  const changeRound = async (v: number) => {
    setRound(v)
    try { await updateSettings({ round_to_lbs: v }) } catch {}
  }

  const toggleEquip = async (k: string) => {
    const next = equip.includes(k) ? equip.filter(e=>e!==k) : [...equip, k]
    setEquip(next)
    try { await saveEquipment(next) } catch {}
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const sb = createClient()
      await sb.auth.signOut()
      router.push('/login')
    } catch { setSigningOut(false) }
  }

  const Header = (
    <div className="pt-safe sticky top-0 z-20"
      style={{ background:'rgba(6,24,32,0.82)', backdropFilter:'saturate(200%) blur(28px)',
               WebkitBackdropFilter:'saturate(200%) blur(28px)',
               borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
      <div style={{ padding:'10px 18px 13px' }}>
        <p style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.6)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          App Configuration
        </p>
        <p style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.7px', lineHeight:1.1, marginTop:1 }}>
          Settings
        </p>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen" style={{ background:'transparent' }}>
      {Header}
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin"
             style={{ borderColor:'var(--accent)' }} />
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'transparent' }}>
      {Header}

      <div className="px-4 pt-6 space-y-8">

        {/* ── Program Library ── */}
        <div>
          <p className="ios-section-label mb-2">Active Program</p>
          <div className="ios-group" style={{ overflow:'hidden' }}>
            {PROGRAM_LIBRARY.map((prog, i) => {
              const active = activeProgramId === prog.id
              const accentColor = prog.focus.includes('Strength') ? '#17BEBB' : '#2DD4A0'
              return (
                <button key={prog.id} onClick={() => { if (prog.id !== activeProgramId) setPreviewProgram(prog) }}
                  className="w-full" style={{
                    display:'block', textAlign:'left', padding:'14px 16px',
                    borderBottom: i < PROGRAM_LIBRARY.length-1 ? '0.5px solid rgba(84,84,88,0.3)' : 'none',
                    background: active ? `color-mix(in srgb, ${accentColor} 7%, rgba(28,28,36,1))` : 'rgba(28,28,36,1)',
                    cursor:'pointer', border:'none',
                  }}>
                  <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                        <p style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.3px' }}>
                          {prog.name}
                        </p>
                        {active && (
                          <span style={{ fontSize:9, fontWeight:800, color: accentColor,
                            background:`color-mix(in srgb, ${accentColor} 15%, transparent)`,
                            border:`0.5px solid ${accentColor}55`,
                            padding:'1px 7px', borderRadius:99, textTransform:'uppercase', letterSpacing:'0.08em' }}>
                            Active
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize:12, color:'#8E8E93', marginBottom:6 }}>by {prog.author}</p>
                      <p style={{ fontSize:12, color:'rgba(142,142,147,0.7)', lineHeight:1.5 }}>
                        {prog.description}
                      </p>
                      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:8 }}>
                        {[
                          prog.focus,
                          `${prog.daysPerWeek} days/week`,
                          `${prog.totalWeeks} weeks`,
                          prog.split,
                        ].map(tag => (
                          <span key={tag} style={{
                            fontSize:10, fontWeight:600,
                            color: tag === prog.focus ? accentColor : '#636366',
                            background: tag === prog.focus
                              ? `color-mix(in srgb, ${accentColor} 12%, transparent)`
                              : 'rgba(11,42,51,0.7)',
                            border: tag === prog.focus
                              ? `0.5px solid ${accentColor}40`
                              : '0.5px solid rgba(84,84,88,0.3)',
                            padding:'2px 8px', borderRadius:99,
                          }}>{tag}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2,
                      background: active ? accentColor : 'rgba(84,84,88,0.3)',
                      display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                      {active && <span style={{ fontSize:11, color:'#000', fontWeight:900 }}>✓</span>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption1 mt-2 px-1" style={{ color:'#8E8E93', lineHeight:1.5 }}>
            Switching resets to Week 1 of the new program. Your exercise history and weight suggestions carry over for all matching lifts.
          </p>
        </div>

        {/* ── Equipment ── */}
        <div>
          <p className="ios-section-label mb-2">Available Equipment</p>
          <div className="ios-group">
            {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((k, i) => {
              const on = equip.includes(k)
              return (
                <button key={k} onClick={() => toggleEquip(k)}
                  className={`ios-row tap w-full ${i===0?'ios-row-first':''}`}>
                  <span style={{ fontSize:18, width:30, flexShrink:0, textAlign:'center' }}>
                    {EQUIPMENT_ICONS[k]}
                  </span>
                  <p className="t-subhead flex-1 text-left"
                     style={{ color: on ? 'var(--label)' : '#8E8E93' }}>
                    {EQUIPMENT_LABELS[k]}
                  </p>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ background: on ? 'var(--accent)' : 'var(--fill-3)' }}>
                    {on && <Check size={12} strokeWidth={3} style={{ color:'#fff' }} />}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption1 mt-2 px-1" style={{ color:'#8E8E93', lineHeight:1.5 }}>
            Workout alternatives will show your available equipment first.
          </p>
        </div>

        {/* ── Weight Rounding ── */}
        <div>
          <p className="ios-section-label mb-2">Round weights to nearest</p>
          <div className="ios-group">
            {[2.5, 5, 10].map((v, i) => (
              <button key={v} onClick={() => changeRound(v)}
                className={`ios-row tap w-full ${i===0?'ios-row-first':''}`}>
                <span className="t-body flex-1 text-left" style={{ color:'var(--label)' }}>
                  {v} lbs
                </span>
                {round===v && <Check size={19} strokeWidth={2.5} style={{ color:'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>



        {/* ── Coaching Intelligence ── */}
        <div>
          <p className="ios-section-label mb-2">Coaching Intelligence</p>
          <div className="ios-group">
            {([
              { key:'rirTrend'    as const, title:'Fatigue Tracking',    desc:'Flags when a lift feels harder at the same weight' },
              { key:'deloadAlerts' as const, title:'Smart Deload Alerts', desc:'Warns when performance signals suggest a recovery week' },
              { key:'setFatigue'  as const, title:'Set Fatigue Analysis', desc:'Suggests rep vs load progression from your set drop-off' },
            ]).map((row, i) => {
              const on = coachPrefs[row.key]
              return (
                <button key={row.key} onClick={() => toggleCoach(row.key)}
                  className={`ios-row w-full ${i===0?'ios-row-first':''}`}
                  style={{ textAlign:'left' }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
                    <p className="t-body" style={{ color:'var(--label)', fontWeight:600 }}>{row.title}</p>
                    <p className="t-caption1" style={{ color:'#8E8E93', marginTop:2, lineHeight:1.4 }}>{row.desc}</p>
                  </div>
                  <div style={{ width:48, height:28, borderRadius:999, flexShrink:0, position:'relative',
                    background: on ? 'var(--green)' : 'rgba(118,118,128,0.32)', transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:3, left: on ? 22 : 3, width:22, height:22,
                      borderRadius:'50%', background:'#fff', transition:'left 0.2s',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.35)' }} />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption1 mt-2 px-1" style={{ color:'#8E8E93', lineHeight:1.5 }}>
            Signals appear in Insights only when there's something actionable.
          </p>
        </div>

        {/* ── Account ── */}
        <div>
          <p className="ios-section-label mb-2">Account</p>
          <div className="ios-group">
            <div className="ios-row ios-row-first">
              <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                background:'rgba(255,178,62,0.15)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:13, fontWeight:800, color:'var(--accent)' }}>
                {userEmail ? userEmail[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>Signed in</p>
                <p className="t-caption1 mt-0.5 truncate" style={{ color:'#8E8E93' }}>{userEmail}</p>
              </div>
            </div>
            <button onClick={handleSignOut} disabled={signingOut}
              className="ios-row tap w-full"
              style={{ opacity: signingOut ? 0.6 : 1 }}>
              {signingOut
                ? <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                       style={{ borderColor:'#F25C54' }} />
                : <LogOut size={18} strokeWidth={1.8} style={{ color:'#F25C54', flexShrink:0 }} />}
              <span className="t-subhead flex-1 text-left" style={{ color:'#F25C54' }}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </div>

        <div style={{ height:8 }} />
      </div>



      {/* ── Program Preview Sheet ── */}
      {previewProgram && (
        <div className="sheet-scrim" onClick={() => setPreviewProgram(null)}>
          <div onClick={e => e.stopPropagation()}
               style={{ background:'var(--bg-2,#111118)', borderRadius:'24px 24px 0 0',
                 maxHeight:'90vh', display:'flex', flexDirection:'column',
                 border:'0.5px solid rgba(84,84,88,0.4)' }}>

            {/* Drag handle */}
            <div style={{ width:36, height:4, borderRadius:99, background:'rgba(84,84,88,0.5)',
              margin:'16px auto 0', flexShrink:0 }} />

            {/* Scrollable body */}
            <div style={{ overflowY:'auto', padding:'16px 18px 0', flex:1 }}>

              {/* Header */}
              <div style={{ marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <p style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.6px', lineHeight:1.1 }}>
                      {previewProgram.name}
                    </p>
                    <p style={{ fontSize:13, color:'rgba(142,142,147,0.7)', marginTop:3 }}>
                      by {previewProgram.author}
                    </p>
                  </div>
                  <button onClick={() => setPreviewProgram(null)}
                    style={{ width:30, height:30, borderRadius:'50%', background:'rgba(84,84,88,0.3)',
                      border:'none', color:'#8E8E93', fontSize:16, flexShrink:0, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
                </div>
                <p style={{ fontSize:13, color:'rgba(255,255,255,0.6)', lineHeight:1.6, marginBottom:12 }}>
                  {previewProgram.description}
                </p>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {[previewProgram.focus, `${previewProgram.daysPerWeek} days/week`,
                    `${previewProgram.totalWeeks} weeks`, previewProgram.split].map(tag => {
                    const isFirst = tag === previewProgram.focus
                    const accent = previewProgram.focus.includes('Strength') ? '#17BEBB' : '#2DD4A0'
                    return (
                      <span key={tag} style={{
                        fontSize:10, fontWeight:600,
                        color: isFirst ? accent : '#636366',
                        background: isFirst ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'rgba(11,42,51,0.85)',
                        border: isFirst ? `0.5px solid ${accent}40` : '0.5px solid rgba(84,84,88,0.4)',
                        padding:'3px 9px', borderRadius:99,
                      }}>{tag}</span>
                    )
                  })}
                </div>
              </div>

              {/* Workout breakdown */}
              <p style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.6)',
                textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:10 }}>
                Workouts
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
                {previewProgram.workouts.map(wkt => {
                  const colors: Record<string,string> = {
                    A:'#17BEBB', B:'#2DD4A0', C:'#A885F2', D:'#FFB23E', E:'#F25C54'
                  }
                  const c = colors[wkt.key] ?? '#8E8E93'
                  const isPower = wkt.dayType === 'power'
                  const isHyper = wkt.dayType === 'hypertrophy'
                  return (
                    <div key={wkt.key} style={{ borderRadius:14,
                      background:'rgba(28,28,36,0.9)', border:'0.5px solid rgba(84,84,88,0.35)',
                      overflow:'hidden' }}>
                      {/* Workout header */}
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
                        borderBottom:'0.5px solid rgba(84,84,88,0.25)' }}>
                        <div style={{ width:30, height:30, borderRadius:9, flexShrink:0,
                          background:`color-mix(in srgb, ${c} 18%, transparent)`,
                          color: c, display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:13, fontWeight:800 }}>{wkt.key}</div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <p style={{ fontSize:13, fontWeight:700, color:'#fff' }}>{wkt.shortName}</p>
                            {(isPower || isHyper) && (
                              <span style={{ fontSize:9, fontWeight:700, padding:'1px 6px', borderRadius:99,
                                color: isPower ? '#17BEBB' : '#2DD4A0',
                                background: isPower ? 'rgba(23,190,187,0.12)' : 'rgba(45,212,160,0.12)',
                                border: `0.5px solid ${isPower ? 'rgba(23,190,187,0.3)' : 'rgba(45,212,160,0.3)'}` }}>
                                {isPower ? '⚡ Power' : '🔥 Hypertrophy'}
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize:11, color:'#636366', marginTop:1 }}>{wkt.focus}</p>
                        </div>
                        <span style={{ fontSize:10, color:'#636366', flexShrink:0 }}>
                          {wkt.duration ?? `${wkt.exercises.length} ex`}
                        </span>
                      </div>
                      {/* Exercise list */}
                      <div style={{ padding:'8px 14px 10px' }}>
                        {wkt.exercises.map((ex, i) => (
                          <div key={ex.name} style={{ display:'flex', alignItems:'center', gap:8,
                            paddingBlock:5,
                            borderBottom: i < wkt.exercises.length-1 ? '0.5px solid rgba(84,84,88,0.18)' : 'none' }}>
                            <div style={{ width:5, height:5, borderRadius:'50%', flexShrink:0,
                              background: ex.type==='primary' ? c : ex.type==='secondary' ? 'rgba(142,142,147,0.5)' : 'rgba(84,84,88,0.35)' }} />
                            <p style={{ fontSize:12, color: ex.type==='primary' ? 'rgba(255,255,255,0.9)' : '#8E8E93',
                              fontWeight: ex.type==='primary' ? 600 : 400, flex:1 }}>{ex.name}</p>
                            <p style={{ fontSize:10, color:'#3A3A3C', flexShrink:0 }}>
                              {ex.type === 'primary' ? '● ' : ex.type === 'secondary' ? '○ ' : '◌ '}{ex.muscle}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sticky CTA */}
            <div style={{ padding:'14px 18px', paddingBottom:'calc(14px + env(safe-area-inset-bottom))',
              borderTop:'0.5px solid rgba(84,84,88,0.3)', background:'rgba(10,10,16,0.98)',
              flexShrink:0 }}>
              <button onClick={async () => {
                  await switchProgram(previewProgram.id)
                  setPreviewProgram(null)
                }}
                style={{ width:'100%', height:54, borderRadius:16, fontSize:17, fontWeight:800,
                  background: previewProgram.focus.includes('Strength') ? '#17BEBB' : '#2DD4A0',
                  color:'#000', border:'none', cursor:'pointer', letterSpacing:'-0.2px' }}>
                Switch to {previewProgram.shortName}
              </button>
              <p style={{ fontSize:11, color:'rgba(84,84,88,0.7)', textAlign:'center', marginTop:8, lineHeight:1.4 }}>
                Resets to Week 1 · Your exercise history and weight suggestions carry over
              </p>
            </div>

          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
