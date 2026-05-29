'use client'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Save, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { WORKOUTS } from '@/lib/program/data'
import { fetchAllOneRms, upsertOneRm, fetchSettings, updateSettings } from '@/lib/db'
import type { UserOneRm } from '@/types'

const COLORS: Record<string, string> = { A: '#3B82F6', B: '#22C55E', C: '#A855F7', D: '#F97316' }

export default function SettingsPage() {
  const router = useRouter()
  const [oneRms,     setOneRms]     = useState<Record<string, string>>({})
  const [roundTo,    setRoundTo]    = useState(5)
  const [openGroup,  setOpenGroup]  = useState<string>('A')
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState<string | null>(null)

  const init = useCallback(async () => {
    const [rms, settings] = await Promise.all([fetchAllOneRms(), fetchSettings()])
    const map: Record<string, string> = {}
    rms.forEach((r: UserOneRm) => { map[r.exercise_name] = String(r.weight_lbs) })
    setOneRms(map)
    setRoundTo(settings.round_to_lbs)
  }, [])

  useEffect(() => { init() }, [init])

  const handleSave = async (exerciseName: string, value: string) => {
    const num = parseFloat(value)
    if (!value || isNaN(num)) return
    setSaving(true)
    await upsertOneRm(exerciseName, num)
    setSaved(exerciseName)
    setTimeout(() => setSaved(null), 1500)
    setSaving(false)
  }

  const handleRoundChange = async (val: number) => {
    setRoundTo(val)
    await updateSettings({ round_to_lbs: val })
  }

  return (
    <div className="min-h-screen safe-bottom" style={{ background: 'var(--bg)' }}>
      <div className="safe-top px-4 pt-4 pb-4 sticky top-0 z-20" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl active:opacity-60" style={{ background: 'var(--surface-2)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted)' }} />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>1RM Calculator</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Weights auto-fill from these values</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Round-to setting */}
        <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: 'var(--muted)' }}>Round weights to nearest</p>
          <div className="flex gap-2">
            {[2.5, 5, 10].map(v => (
              <button key={v} onClick={() => handleRoundChange(v)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors"
                style={{ background: roundTo === v ? 'var(--accent)' : 'var(--surface-2)', color: roundTo === v ? '#fff' : 'var(--muted-light)' }}>
                {v} lbs
              </button>
            ))}
          </div>
        </div>

        {/* Exercises by workout */}
        {WORKOUTS.map(wkt => {
          const color   = COLORS[wkt.key]
          const isOpen  = openGroup === wkt.key
          return (
            <div key={wkt.key} className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: `1px solid ${isOpen ? color + '55' : 'var(--border)'}` }}>
              <button className="w-full px-4 py-3.5 flex items-center justify-between active:opacity-70"
                      onClick={() => setOpenGroup(isOpen ? '' : wkt.key)}>
                <div>
                  <p className="text-[11px] font-extrabold tracking-widest uppercase" style={{ color }}>Workout {wkt.key}</p>
                  <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{wkt.shortName}</p>
                </div>
                {isOpen ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
              </button>

              {isOpen && (
                <div className="px-4 pb-4 space-y-2.5">
                  {wkt.exercises.map(ex => {
                    if (ex.isBodyweight) return (
                      <div key={ex.name} className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                        <div className="flex-1">
                          <p className="text-sm font-medium" style={{ color: 'var(--muted-light)' }}>{ex.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>Bodyweight — no entry needed</p>
                        </div>
                        <span className="text-xs px-2 py-1 rounded-lg" style={{ background: 'var(--border)', color: 'var(--muted)' }}>BW</span>
                      </div>
                    )

                    const isSaved = saved === ex.name
                    return (
                      <div key={ex.name} className="flex items-center gap-3 py-2.5 px-3 rounded-xl"
                           style={{ background: isSaved ? `${color}15` : 'var(--surface-2)', border: `1px solid ${isSaved ? color + '44' : 'transparent'}` }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{ex.name}</p>
                          <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{ex.muscle} · {ex.type}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <input
                            type="number"
                            inputMode="decimal"
                            placeholder="0"
                            value={oneRms[ex.name] ?? ''}
                            onChange={e => setOneRms(prev => ({ ...prev, [ex.name]: e.target.value }))}
                            onBlur={e => handleSave(ex.name, e.target.value)}
                            className="w-20 text-right py-1.5 px-2.5 rounded-lg text-sm font-bold outline-none"
                            style={{ background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)' }}
                          />
                          <span className="text-xs" style={{ color: 'var(--muted)' }}>lbs</span>
                          {isSaved && <span style={{ color }}>✓</span>}
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
