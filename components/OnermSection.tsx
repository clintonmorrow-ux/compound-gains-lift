'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'
import { WORKOUTS, WORKOUTS_5DAY } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings } from '@/lib/db'
import type { UserOneRm, ProgramFormat } from '@/types'

const WC: Record<string,string> = {
  A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)',
  D:'var(--wkt-d)', E:'#FF453A',
}

export default function OnermSection({ format }: { format: ProgramFormat }) {
  const [rms,   setRms]   = useState<Record<string,string>>({})
  const [group, setGroup] = useState<string>('')
  const [saved, setSaved] = useState<string|null>(null)

  useEffect(() => {
    Promise.all([fetchAllOneRms(), fetchSettings()]).then(([r]) => {
      const m: Record<string,string> = {}
      ;(r as UserOneRm[]).forEach(x => { m[x.exercise_name] = String(x.weight_lbs) })
      setRms(m)
    }).catch(console.error)
  }, [])

  const save = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n <= 0) return
    try { await upsertOneRm(name, n); setSaved(name); setTimeout(()=>setSaved(null), 1800) }
    catch(e) { console.error(e) }
  }

  const list = format === '5day' ? WORKOUTS_5DAY : WORKOUTS
  const allNonBW = list.flatMap(w => w.exercises).filter(e => !e.isBodyweight)
  const totalEntered = allNonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length
  const allDone = totalEntered === allNonBW.length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <p className="ios-section-label">1RM Calibration</p>
        <span style={{
          fontSize:11, fontWeight:700, letterSpacing:'0.02em',
          color: allDone ? 'var(--green)' : 'var(--orange)',
          background: allDone ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'color-mix(in srgb, var(--orange) 12%, transparent)',
          border: `0.5px solid ${allDone ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'color-mix(in srgb, var(--orange) 30%, transparent)'}`,
          padding:'2px 9px', borderRadius:99,
        }}>
          {totalEntered}/{allNonBW.length} set
        </span>
      </div>
      <p className="t-footnote" style={{ color:'#8E8E93', marginBottom:14, lineHeight:1.6 }}>
        Target weights and smart suggestions are calibrated from your 1RM. Tap a workout to enter or update.
      </p>

      <div className="space-y-2">
        {list.map(wkt => {
          const c = WC[wkt.key] ?? '#8E8E93'
          const isOpen = group === wkt.key
          const nonBW = wkt.exercises.filter(e => !e.isBodyweight)
          const entered = nonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length
          const wktDone = entered === nonBW.length

          return (
            <div key={wkt.key} className="ios-group overflow-hidden">
              <button className="ios-row ios-row-first tap w-full"
                      onClick={() => setGroup(isOpen ? '' : wkt.key)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-subhead sf-heavy"
                     style={{ background:`color-mix(in srgb, ${c} 20%, transparent)`, color: c }}>
                  {wkt.key}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{wkt.shortName}</p>
                  <p className="t-caption1 mt-0.5" style={{ color: wktDone ? 'var(--green)' : 'var(--orange)' }}>
                    {entered} of {nonBW.length} entered{wktDone ? ' ✓' : ' — tap to fill in'}
                  </p>
                </div>
                {isOpen
                  ? <ChevronUp   size={16} style={{ color:'#8E8E93', flexShrink:0 }} />
                  : <ChevronDown size={16} style={{ color:'#8E8E93', flexShrink:0 }} />}
              </button>

              {isOpen && wkt.exercises.map(ex => {
                if (ex.isBodyweight) return (
                  <div key={ex.name} className="ios-row">
                    <div className="flex-1 min-w-0">
                      <p className="t-subhead" style={{ color:'var(--label-2)' }}>{ex.name}</p>
                      <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>Bodyweight exercise</p>
                    </div>
                    <span className="t-caption2 px-2 py-1 rounded-lg"
                          style={{ background:'var(--fill-3)', color:'#8E8E93' }}>BW</span>
                  </div>
                )

                const isSaved = saved === ex.name
                const hasVal  = !!(rms[ex.name] && parseFloat(rms[ex.name]) > 0)
                return (
                  <div key={ex.name} className="ios-row"
                       style={{ background: isSaved ? 'color-mix(in srgb, var(--green) 12%, var(--bg-2))' : 'var(--bg-2)' }}>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                      <p className="t-caption1 mt-0.5" style={{ color: hasVal ? '#8E8E93' : 'var(--orange)' }}>
                        {hasVal ? ex.muscle : `Enter 1RM · ${ex.muscle}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSaved && <Check size={14} strokeWidth={3} style={{ color:'var(--green)' }} />}
                      <input
                        type="number" inputMode="decimal" placeholder="0"
                        value={rms[ex.name] ?? ''}
                        onChange={e => setRms(p => ({ ...p, [ex.name]: e.target.value }))}
                        onBlur={e => save(ex.name, e.target.value)}
                        style={{
                          width:72, height:40, textAlign:'right', padding:'0 10px',
                          fontSize:15, fontWeight:700, outline:'none', borderRadius:10,
                          background: hasVal ? 'var(--fill-3)' : 'color-mix(in srgb, var(--orange) 15%, var(--fill-3))',
                          color:'var(--label)',
                          border: hasVal ? 'none' : '1px solid color-mix(in srgb, var(--orange) 50%, transparent)',
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
  )
}
