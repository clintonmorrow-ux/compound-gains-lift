'use client'
import { useEffect, useState, useCallback } from 'react'
import { ChevronRight, Check } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { WORKOUTS } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings, updateSettings } from '@/lib/db'
import type { UserOneRm } from '@/types'

const WC: Record<string,string> = { A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)', D:'var(--wkt-d)' }

export default function SettingsPage() {
  const [rms,   setRms]   = useState<Record<string,string>>({})
  const [round, setRound] = useState(5)
  const [group, setGroup] = useState<string>('A')
  const [saved, setSaved] = useState<string|null>(null)

  const init = useCallback(async () => {
    const [r, s] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const m: Record<string,string> = {}
    r.forEach((x: UserOneRm) => { m[x.exercise_name] = String(x.weight_lbs) })
    setRms(m); setRound(s.round_to_lbs)
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

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="pt-safe sticky top-0 z-20"
        style={{ background:'rgba(0,0,0,0.88)', backdropFilter:'saturate(180%) blur(24px)', WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'0.5px solid var(--sep)' }}>
        <div className="px-5 pb-3 pt-2">
          <h1 className="t-large-title sf-bold" style={{ color:'var(--label)' }}>1RM</h1>
          <p className="t-subhead mt-0.5" style={{ color:'var(--label-3)' }}>Target weights auto-fill from these values</p>
        </div>
      </div>

      <div className="px-4 pt-6 space-y-7">

        {/* Rounding */}
        <div>
          <p className="ios-section-label mb-2">Round weights to nearest</p>
          <div className="ios-group">
            {[2.5, 5, 10].map((v, i) => (
              <button key={v} onClick={() => changeRound(v)}
                className={`ios-row tap ${i===0?'ios-row-first':''} w-full`}>
                <span className="t-body flex-1 text-left" style={{ color:'var(--label)' }}>{v} lbs</span>
                {round===v && <Check size={18} style={{ color:'var(--accent)' }} strokeWidth={2.5} />}
              </button>
            ))}
          </div>
        </div>

        {/* Exercises */}
        {WORKOUTS.map(wkt => {
          const c      = WC[wkt.key]
          const isOpen = group === wkt.key
          return (
            <div key={wkt.key}>
              <p className="ios-section-label mb-2">Workout {wkt.key} — {wkt.shortName}</p>
              <div className="ios-group">
                {wkt.exercises.map((ex, i) => {
                  if (ex.isBodyweight) return (
                    <div key={ex.name} className={`ios-row ${i===0?'ios-row-first':''}`}>
                      <div className="flex-1 min-w-0">
                        <p className="t-subhead" style={{ color:'var(--label-2)' }}>{ex.name}</p>
                        <p className="t-caption1 mt-0.5" style={{ color:'var(--label-4)' }}>{ex.muscle}</p>
                      </div>
                      <span className="t-footnote px-2.5 py-1 rounded-lg" style={{ background:'var(--fill-3)', color:'var(--label-3)' }}>BW</span>
                    </div>
                  )

                  const isSaved = saved === ex.name
                  return (
                    <div key={ex.name}
                      className={`ios-row ${i===0?'ios-row-first':''}`}
                      style={{ background: isSaved ? `color-mix(in srgb, var(--green) 10%, var(--bg-2))` : 'var(--bg-2)' }}>
                      <div className="flex-1 min-w-0 pr-2">
                        <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                        <p className="t-caption1 mt-0.5" style={{ color:'var(--label-3)' }}>{ex.muscle} · {ex.type}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isSaved && <Check size={15} style={{ color:'var(--green)' }} strokeWidth={2.5} />}
                        <input
                          type="number" inputMode="decimal" placeholder="—"
                          value={rms[ex.name] ?? ''}
                          onChange={e => setRms(p => ({...p, [ex.name]: e.target.value}))}
                          onBlur={e => save(ex.name, e.target.value)}
                          className="text-right rounded-xl outline-none"
                          style={{ width:72, height:36, padding:'0 12px', fontSize:15, fontWeight:600, background:'var(--fill-3)', color:'var(--label)', border:'none' }}
                        />
                        <span className="t-footnote" style={{ color:'var(--label-4)', minWidth:20 }}>lbs</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

      </div>
      <BottomNav />
    </div>
  )
}
