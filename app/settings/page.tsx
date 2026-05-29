'use client'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { WORKOUTS } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings, updateSettings } from '@/lib/db'
import type { UserOneRm } from '@/types'

const WKT_COLOR = { A:'--a', B:'--b', C:'--c', D:'--d' } as const

export default function SettingsPage() {
  const router = useRouter()
  const [oneRms,    setOneRms]    = useState<Record<string,string>>({})
  const [roundTo,   setRoundTo]   = useState(5)
  const [openGroup, setOpenGroup] = useState<string>('A')
  const [saved,     setSaved]     = useState<string|null>(null)

  const init = useCallback(async () => {
    const [rms, settings] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const m: Record<string,string> = {}
    rms.forEach((r: UserOneRm) => { m[r.exercise_name] = String(r.weight_lbs) })
    setOneRms(m)
    setRoundTo(settings.round_to_lbs)
  }, [])
  useEffect(() => { init() }, [init])

  const handleSave = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n)) return
    await upsertOneRm(name, n)
    setSaved(name)
    setTimeout(() => setSaved(null), 1800)
  }

  const handleRound = async (v: number) => {
    setRoundTo(v)
    await updateSettings({ round_to_lbs: v })
  }

  return (
    <div className="min-h-screen pb-nav" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="pt-safe px-5 pb-4 sticky top-0 z-20"
           style={{ background:'rgba(12,12,20,0.9)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-3 pt-3">
          <button onClick={() => router.back()}
            className="pressable w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:'var(--surface-2)' }}>
            <ArrowLeft size={17} style={{ color:'var(--text-2)' }} />
          </button>
          <div>
            <h1 className="text-[20px] font-black tracking-tight" style={{ color:'var(--text)' }}>
              1RM Calculator
            </h1>
            <p className="text-[12px]" style={{ color:'var(--text-2)' }}>
              Target weights auto-fill from these values
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">

        {/* Rounding */}
        <div className="card p-4">
          <p className="label mb-3">Round weights to nearest</p>
          <div className="flex gap-2">
            {[2.5, 5, 10].map(v => (
              <button key={v} onClick={() => handleRound(v)}
                className="pressable flex-1 h-12 rounded-xl text-[14px] font-bold transition-all"
                style={{
                  background: roundTo===v ? 'var(--accent)'    : 'var(--surface-2)',
                  color:       roundTo===v ? '#fff'             : 'var(--text-2)',
                  border:      `1px solid ${roundTo===v ? 'transparent' : 'var(--border)'}`,
                }}>
                {v} lbs
              </button>
            ))}
          </div>
        </div>

        {/* Exercises by workout */}
        {WORKOUTS.map(wkt => {
          const c = `var(${WKT_COLOR[wkt.key as keyof typeof WKT_COLOR]})`
          const isOpen = openGroup === wkt.key
          return (
            <div key={wkt.key} className="card overflow-hidden"
                 style={{ borderColor: isOpen ? `color-mix(in srgb, ${c} 35%, transparent)` : 'var(--border)' }}>

              <button className="w-full flex items-center justify-between px-4 py-4 pressable"
                      onClick={() => setOpenGroup(isOpen ? '' : wkt.key)}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-[13px] font-black"
                       style={{ background:`color-mix(in srgb, ${c} 15%, transparent)`, color: c }}>
                    {wkt.key}
                  </div>
                  <div className="text-left">
                    <p className="text-[15px] font-bold" style={{ color:'var(--text)' }}>{wkt.shortName}</p>
                    <p className="text-[12px]" style={{ color:'var(--text-2)' }}>{wkt.exercises.length} exercises</p>
                  </div>
                </div>
                <div className="text-[11px] font-semibold px-2.5 py-1 rounded-lg"
                     style={{ background:'var(--surface-2)', color:'var(--text-3)' }}>
                  {isOpen ? 'Close' : 'Open'}
                </div>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2">
                  <div className="h-px mb-3" style={{ background:'var(--border)' }} />
                  {wkt.exercises.map(ex => {
                    if (ex.isBodyweight) return (
                      <div key={ex.name} className="flex items-center justify-between h-14 px-4 rounded-2xl"
                           style={{ background:'var(--surface-2)' }}>
                        <div>
                          <p className="text-[14px] font-medium" style={{ color:'var(--text-2)' }}>{ex.name}</p>
                          <p className="text-[11px]" style={{ color:'var(--text-3)' }}>Bodyweight</p>
                        </div>
                        <span className="pill" style={{ background:'var(--surface-3)', color:'var(--text-3)' }}>BW</span>
                      </div>
                    )

                    const isSaved = saved === ex.name
                    return (
                      <div key={ex.name}
                        className="flex items-center justify-between h-14 px-4 rounded-2xl transition-all"
                        style={{
                          background: isSaved ? 'var(--success-bg)'  : 'var(--surface-2)',
                          border:`1px solid ${isSaved ? 'rgba(52,211,153,0.25)' : 'transparent'}`,
                        }}>
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="text-[14px] font-semibold truncate" style={{ color:'var(--text)' }}>{ex.name}</p>
                          <p className="text-[11px]" style={{ color:'var(--text-2)' }}>{ex.muscle} · {ex.type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isSaved && <Check size={14} style={{ color:'var(--success)' }} />}
                          <input
                            type="number" inputMode="decimal" placeholder="—"
                            value={oneRms[ex.name] ?? ''}
                            onChange={e => setOneRms(p => ({ ...p, [ex.name]: e.target.value }))}
                            onBlur={e => handleSave(ex.name, e.target.value)}
                            className="w-20 h-9 text-right rounded-xl px-3 text-[14px] font-bold outline-none"
                            style={{ background:'var(--surface-3)', color:'var(--text)', border:'1px solid var(--border-md)' }}
                          />
                          <span className="text-[12px] w-6" style={{ color:'var(--text-3)' }}>lbs</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <BottomNav />
    </div>
  )
}
