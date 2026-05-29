'use client'
import { useEffect, useState, useCallback } from 'react'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { WORKOUTS } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings, updateSettings, fetchEquipment, saveEquipment } from '@/lib/db'
import { EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'
import type { UserOneRm } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }

export default function SettingsPage() {
  const [rms,   setRms]   = useState<Record<string,string>>({})
  const [round, setRound] = useState(5)
  const [group, setGroup] = useState<string>('A')
  const [equip, setEquip] = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [saved, setSaved] = useState<string|null>(null)

  const init = useCallback(async () => {
    const [r, s, eq] = await Promise.all([fetchAllOneRms(), fetchSettings(), fetchEquipment()])
    const m: Record<string,string> = {}
    r.forEach((x: UserOneRm) => { m[x.exercise_name] = String(x.weight_lbs) })
    setRms(m); setRound(s.round_to_lbs); setEquip(eq)
  }, [])
  useEffect(() => { init() }, [init])

  const save = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n)) return
    await upsertOneRm(name, n)
    setSaved(name)
    setTimeout(() => setSaved(null), 1800)
  }

  const changeRound = async (v: number) => {
    setRound(v); await updateSettings({ round_to_lbs: v })
  }

  const toggleEquip = async (k: string) => {
    const next = equip.includes(k) ? equip.filter(e => e !== k) : [...equip, k]
    setEquip(next); await saveEquipment(next)
  }

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'saturate(180%) blur(24px)', WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'0.5px solid var(--sep)' }}>
        <div className="px-5 pb-3 pt-2">
          <h1 className="t-large-title sf-bold" style={{ color:'var(--label)' }}>Settings</h1>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-8">

        {/* ── 1RM Calculator — FIRST and prominent ── */}
        <div>
          <p className="ios-section-label mb-1">1-Rep Max Calculator</p>
          <p className="t-footnote mb-3" style={{ color:'var(--label-3)', lineHeight:1.5 }}>
            Enter your 1RM (or heaviest single rep) for each exercise. 
            Target weights auto-fill across all 12 weeks. Tap a workout to expand.
          </p>
          <div className="space-y-3">
            {WORKOUTS.map(wkt => {
              const c      = WC[wkt.key]
              const isOpen = group === wkt.key
              return (
                <div key={wkt.key} className="ios-group overflow-hidden">

                  {/* Workout header */}
                  <button className="ios-row ios-row-first tap w-full"
                          onClick={() => setGroup(isOpen ? '' : wkt.key)}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-footnote sf-heavy"
                         style={{ background:`color-mix(in srgb, ${c} 18%, transparent)`, color: c }}>
                      {wkt.key}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{wkt.shortName}</p>
                      <p className="t-caption1 mt-0.5" style={{ color:'var(--label-3)' }}>
                        {wkt.exercises.filter(e => !e.isBodyweight).length} exercises
                        {' · '}
                        {wkt.exercises.filter(e => !e.isBodyweight && rms[e.name] && parseFloat(rms[e.name]) > 0).length} entered
                      </p>
                    </div>
                    {isOpen
                      ? <ChevronUp  size={16} style={{ color:'var(--label-4)', flexShrink:0 }} />
                      : <ChevronDown size={16} style={{ color:'var(--label-4)', flexShrink:0 }} />}
                  </button>

                  {/* Exercise input rows */}
                  {isOpen && wkt.exercises.map(ex => {
                    if (ex.isBodyweight) return (
                      <div key={ex.name} className="ios-row">
                        <div className="flex-1 min-w-0">
                          <p className="t-subhead" style={{ color:'var(--label-2)' }}>{ex.name}</p>
                          <p className="t-caption1 mt-0.5" style={{ color:'var(--label-4)' }}>Bodyweight — no entry needed</p>
                        </div>
                        <span className="t-caption2 px-2.5 py-1 rounded-lg"
                              style={{ background:'var(--fill-3)', color:'var(--label-3)' }}>BW</span>
                      </div>
                    )

                    const isSaved = saved === ex.name
                    const hasVal  = !!(rms[ex.name] && parseFloat(rms[ex.name]) > 0)
                    return (
                      <div key={ex.name} className="ios-row"
                           style={{ background: isSaved ? 'color-mix(in srgb, var(--green) 10%, var(--bg-2))' : 'var(--bg-2)' }}>
                        <div className="flex-1 min-w-0 pr-3">
                          <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                          <p className="t-caption1 mt-0.5"
                             style={{ color: hasVal ? 'var(--label-3)' : 'var(--orange)' }}>
                            {hasVal ? `${ex.muscle} · ${ex.type}` : `Tap to enter · ${ex.muscle}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSaved && <Check size={15} style={{ color:'var(--green)' }} strokeWidth={2.5} />}
                          <input
                            type="number" inputMode="decimal" placeholder="—"
                            value={rms[ex.name] ?? ''}
                            onChange={e => setRms(p => ({...p, [ex.name]: e.target.value}))}
                            onBlur={e  => save(ex.name, e.target.value)}
                            style={{
                              width:76, height:40, textAlign:'right', padding:'0 12px',
                              fontSize:15, fontWeight:600, letterSpacing:'-0.3px',
                              background:'var(--fill-3)', color:'var(--label)',
                              border: hasVal ? 'none' : '1px solid color-mix(in srgb, var(--orange) 50%, transparent)',
                              borderRadius:10, outline:'none',
                            }}
                          />
                          <span className="t-caption1" style={{ color:'var(--label-4)', minWidth:22 }}>lbs</span>
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
                <span className="t-body flex-1 text-left" style={{ color:'var(--label)' }}>{v} lbs</span>
                {round===v && <Check size={18} style={{ color:'var(--accent)' }} strokeWidth={2.5} />}
              </button>
            ))}
          </div>
          <p className="ios-section-footer mt-1.5">Applied to all calculated target weights.</p>
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
                  <span className="t-body w-7 flex-shrink-0">{EQUIPMENT_ICONS[k]}</span>
                  <p className="t-subhead flex-1 text-left"
                     style={{ color: on ? 'var(--label)' : 'var(--label-3)' }}>
                    {EQUIPMENT_LABELS[k]}
                  </p>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ background: on ? 'var(--accent)' : 'var(--fill-3)' }}>
                    {on && <Check size={11} strokeWidth={3} style={{ color:'#fff' }} />}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="ios-section-footer mt-1.5">
            Alternatives in workouts prioritise your selected equipment.
          </p>
        </div>

      </div>
      <BottomNav />
    </div>
  )
}
