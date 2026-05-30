'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, ChevronDown, ChevronUp, Check } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings, updateSettings,
         fetchEquipment, saveEquipment, fetchCoachPrefs, saveCoachPrefs } from '@/lib/db'
import { DEFAULT_COACH_PREFS } from '@/lib/program/coach'
import { EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import type { UserOneRm } from '@/types'

const WC: Record<string,string> = {
  A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)'
}

export default function SettingsPage() {
  const router  = useRouter()
  const [rms,     setRms]     = useState<Record<string,string>>({})
  const [round,   setRound]   = useState(5)
  const [group,   setGroup]   = useState<string>('A')
  const [equip,   setEquip]   = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [saved,   setSaved]   = useState<string|null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)
  const [coachPrefs, setCoachPrefs] = useState(DEFAULT_COACH_PREFS)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{ session } } = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      const [r, s, eq, cp] = await Promise.all([
        fetchAllOneRms(), fetchSettings(), fetchEquipment(), fetchCoachPrefs()
      ])
      setCoachPrefs(cp)
      const m: Record<string,string> = {}
      r.forEach((x: UserOneRm) => { m[x.exercise_name] = String(x.weight_lbs) })
      setRms(m); setRound(s.round_to_lbs); setEquip(eq)
    } catch(e) {
      console.error('Settings error:', e)
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { init() }, [init])

  const toggleCoach = async (key: 'rirTrend'|'deloadAlerts'|'setFatigue') => {
    const next = { ...coachPrefs, [key]: !coachPrefs[key] }
    setCoachPrefs(next)
    try { await saveCoachPrefs(next) } catch {}
  }

  const save = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n <= 0) return
    try { await upsertOneRm(name, n); setSaved(name); setTimeout(()=>setSaved(null),1800) }
    catch(e) { console.error(e) }
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

  // ── Header — always visible ──────────────────────────────────────
  const Header = (
    <div className="pt-safe sticky top-0 z-20"
      style={{ background:'rgba(0,0,0,0.95)', backdropFilter:'saturate(180%) blur(24px)',
               WebkitBackdropFilter:'saturate(180%) blur(24px)',
               borderBottom:'1px solid rgba(84,84,88,0.8)' }}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-2">
        <button onClick={() => router.push('/')}
          className="tap w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background:'var(--fill-3)' }}>
          <ChevronLeft size={20} strokeWidth={2.5} style={{ color:'var(--accent)' }} />
        </button>
        <h1 className="t-title2 sf-bold flex-1" style={{ color:'var(--label)' }}>Settings</h1>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin"
             style={{ borderColor:'var(--accent)' }} />
      </div>
      <BottomNav />
    </div>
  )

  if (error) return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="px-4 py-8 text-center">
        <p className="t-headline" style={{ color:'var(--label)' }}>Couldn't load settings</p>
        <p className="t-subhead mt-2" style={{ color:'#8E8E93' }}>Check your connection and try again</p>
        <button onClick={() => { setError(false); setLoading(true); init() }}
          className="ios-btn mt-6" style={{ maxWidth:200, margin:'24px auto 0' }}>
          Retry
        </button>
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>
      {Header}

      <div className="px-4 pt-6 space-y-8">

        {/* ── 1RM Calculator ── */}
        <div>
          <p className="ios-section-label mb-1">1-Rep Max Calculator</p>
          <p className="t-footnote mb-3" style={{ color:'#8E8E93', lineHeight:1.6 }}>
            Enter your 1RM for each exercise. Target weights auto-fill 
            across all 12 weeks. Tap a workout letter to expand it.
          </p>
          <div className="space-y-2.5">
            {WORKOUTS.map(wkt => {
              const c = WC[wkt.key]
              const isOpen = group === wkt.key
              const nonBW = wkt.exercises.filter(e => !e.isBodyweight)
              const entered = nonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length

              return (
                <div key={wkt.key} className="ios-group overflow-hidden">
                  <button className="ios-row ios-row-first tap w-full"
                          onClick={() => setGroup(isOpen ? '' : wkt.key)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-subhead sf-heavy"
                         style={{ background:`color-mix(in srgb, ${c} 20%, transparent)`, color: c }}>
                      {wkt.key}
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>
                        {wkt.shortName}
                      </p>
                      <p className="t-caption1 mt-0.5"
                         style={{ color: entered===nonBW.length ? 'var(--green)' : 'var(--orange)' }}>
                        {entered} of {nonBW.length} entered
                        {entered===nonBW.length ? ' ✓' : ' — tap to fill in'}
                      </p>
                    </div>
                    {isOpen
                      ? <ChevronUp   size={16} style={{ color:'#8E8E93', flexShrink:0 }} />
                      : <ChevronDown size={16} style={{ color:'#8E8E93', flexShrink:0 }} />}
                  </button>

                  {isOpen && wkt.exercises.map((ex, i) => {
                    if (ex.isBodyweight) return (
                      <div key={ex.name} className="ios-row">
                        <div className="flex-1 min-w-0">
                          <p className="t-subhead" style={{ color:'var(--label-2)' }}>{ex.name}</p>
                          <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>Bodyweight</p>
                        </div>
                        <span className="t-caption2 px-2 py-1 rounded-lg"
                              style={{ background:'var(--fill-3)', color:'#8E8E93' }}>BW</span>
                      </div>
                    )

                    const isSaved = saved === ex.name
                    const hasVal  = !!(rms[ex.name] && parseFloat(rms[ex.name]) > 0)
                    return (
                      <div key={ex.name} className="ios-row"
                           style={{ background: isSaved
                             ? 'color-mix(in srgb, var(--green) 12%, var(--bg-2))'
                             : 'var(--bg-2)' }}>
                        <div className="flex-1 min-w-0 pr-2">
                          <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>
                            {ex.name}
                          </p>
                          <p className="t-caption1 mt-0.5"
                             style={{ color: hasVal ? '#8E8E93' : 'var(--orange)' }}>
                            {hasVal ? ex.muscle : `Enter 1RM · ${ex.muscle}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {isSaved && <Check size={14} strokeWidth={3} style={{ color:'var(--green)' }} />}
                          <input
                            type="number" inputMode="decimal" placeholder="0"
                            value={rms[ex.name] ?? ''}
                            onChange={e => setRms(p => ({ ...p, [ex.name]: e.target.value }))}
                            onBlur={e  => save(ex.name, e.target.value)}
                            style={{
                              width:72, height:40, textAlign:'right', padding:'0 10px',
                              fontSize:15, fontWeight:700,
                              background: hasVal ? 'var(--fill-3)' : 'color-mix(in srgb, var(--orange) 15%, var(--fill-3))',
                              color:'var(--label)',
                              border: hasVal ? 'none' : '1px solid color-mix(in srgb, var(--orange) 50%, transparent)',
                              borderRadius:10, outline:'none',
                            }}
                          />
                          <span className="t-caption1" style={{ color:'#8E8E93' }}>lbs</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Rounding ── */}
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
          <p className="ios-section-footer mt-2">
            Workout alternatives will show your available equipment first.
          </p>
        </div>

        {/* ── Coaching Intelligence ── */}
        <div>
          <p className="ios-section-label mb-2">Coaching Intelligence</p>
          <div className="ios-group">
            {([
              { key:'rirTrend'    as const, title:'Fatigue Tracking',   desc:'Flags when a lift feels harder at the same weight over time' },
              { key:'deloadAlerts' as const, title:'Smart Deload Alerts', desc:'Warns when performance signals suggest a recovery week' },
              { key:'setFatigue'  as const, title:'Set Fatigue Analysis', desc:'Suggests rep vs load progression from your set drop-off' },
            ]).map((row, i) => {
              const on = coachPrefs[row.key]
              return (
                <button key={row.key} onClick={()=>toggleCoach(row.key)}
                  className={`ios-row w-full ${i===0?'ios-row-first':''}`}
                  style={{ textAlign:'left' }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
                    <p className="t-body" style={{ color:'var(--label)', fontWeight:600 }}>{row.title}</p>
                    <p className="t-caption" style={{ color:'#8E8E93', marginTop:2, lineHeight:1.4 }}>{row.desc}</p>
                  </div>
                  {/* iOS toggle */}
                  <div style={{ width:51, height:31, borderRadius:999, flexShrink:0, position:'relative',
                    background: on ? '#30D158' : 'rgba(118,118,128,0.32)', transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:2, left: on ? 22 : 2, width:27, height:27,
                      borderRadius:'50%', background:'#fff', transition:'left 0.2s',
                      boxShadow:'0 1px 3px rgba(0,0,0,0.3)' }} />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption" style={{ color:'#8E8E93', marginTop:8, paddingInline:4, lineHeight:1.5 }}>
            Signals appear in Insights and only when there's something actionable — your screen stays clean.
          </p>
        </div>

        {/* ── Back to Home ── */}
        <button onClick={() => router.push('/')}
          className="tap w-full py-4 rounded-2xl t-subhead sf-semibold"
          style={{ background:'var(--fill-3)', color:'#8E8E93' }}>
          ← Back to Home
        </button>

      </div>
      <BottomNav />
    </div>
  )
}
