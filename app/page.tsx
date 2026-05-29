'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Zap } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG, PHASE_LABELS } from '@/lib/program/data'
import { fetchSettings, updateSettings, fetchRecentSessions } from '@/lib/db'

const COLORS = { A: '#3B82F6', B: '#22C55E', C: '#A855F7', D: '#F97316' }

export default function Dashboard() {
  const [week, setWeek]           = useState(1)
  const [done, setDone]           = useState<string[]>([])
  const [loading, setLoading]     = useState(true)

  const init = useCallback(async () => {
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) await supabase.auth.signInAnonymously()
    const [settings, sessions] = await Promise.all([fetchSettings(), fetchRecentSessions(20)])
    setWeek(settings.current_week)
    setDone((sessions as any[]).filter(s => s.week_number === settings.current_week && s.completed_at).map(s => s.workout_key))
    setLoading(false)
  }, [])

  useEffect(() => { init() }, [init])

  const changeWeek = async (delta: number) => {
    const next = Math.max(1, Math.min(12, week + delta))
    setWeek(next)
    await updateSettings({ current_week: next })
  }

  const cfg = WEEK_CONFIG[week]
  const nextWorkout = WORKOUTS.find(w => !done.includes(w.key))
  const phaseClass = cfg.isDeload ? 'phase-deload' : week <= 3 ? 'phase-1' : week <= 7 ? 'phase-2' : 'phase-3'

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
    </div>
  )

  return (
    <div className="min-h-screen safe-bottom" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <div className="safe-top px-5 pt-4 pb-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.25em] uppercase" style={{ color: 'var(--accent)' }}>Compound Gains</p>
            <h1 className="text-3xl font-black tracking-tight leading-none" style={{ color: 'var(--text)' }}>LIFT</h1>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => changeWeek(-1)} className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-60" style={{ background: 'var(--surface-2)' }}>
              <ChevronLeft size={18} style={{ color: 'var(--muted)' }} />
            </button>
            <div className="w-14 text-center">
              <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Week</p>
              <p className="text-2xl font-black leading-none" style={{ color: 'var(--text)' }}>{week}<span className="text-xs font-normal" style={{ color: 'var(--muted)' }}>/12</span></p>
            </div>
            <button onClick={() => changeWeek(+1)} className="w-9 h-9 rounded-xl flex items-center justify-center active:opacity-60" style={{ background: 'var(--surface-2)' }}>
              <ChevronRight size={18} style={{ color: 'var(--muted)' }} />
            </button>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <span className={`${phaseClass} text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider`}>{PHASE_LABELS[week]}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div className="h-full rounded-full" style={{ width: `${((week - 1) / 12) * 100}%`, background: 'var(--accent)' }} />
          </div>
        </div>
        <p className="mt-1.5 text-xs leading-snug" style={{ color: 'var(--muted)' }}>{cfg.note}</p>
      </div>

      <div className="px-4 py-5 space-y-5">
        {/* Next workout */}
        {nextWorkout && (
          <div className="fade-in">
            <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: 'var(--muted)' }}>Up Next</p>
            <Link href={`/workout/${week}/${nextWorkout.key}`}>
              <div className="rounded-2xl p-5 active:scale-[0.98] transition-transform"
                   style={{ background: `${COLORS[nextWorkout.key as keyof typeof COLORS]}18`, border: `1px solid ${COLORS[nextWorkout.key as keyof typeof COLORS]}40` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-extrabold tracking-widest uppercase mb-1.5" style={{ color: COLORS[nextWorkout.key as keyof typeof COLORS] }}>Workout {nextWorkout.key}</p>
                    <h2 className="text-2xl font-black leading-tight" style={{ color: 'var(--text)' }}>{nextWorkout.shortName}</h2>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted-light)' }}>{nextWorkout.focus}</p>
                    <p className="text-xs mt-3" style={{ color: 'var(--muted)' }}>{nextWorkout.exercises.length} exercises · {cfg.sets.primary} sets (primary) · RIR {cfg.rir}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: COLORS[nextWorkout.key as keyof typeof COLORS] }}>
                    <Zap size={22} color="#fff" />
                  </div>
                </div>
                <div className="mt-4 py-3.5 rounded-xl text-center text-sm font-extrabold tracking-wider" style={{ background: COLORS[nextWorkout.key as keyof typeof COLORS], color: '#fff' }}>
                  START WORKOUT
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Week grid */}
        <div>
          <p className="text-[11px] font-bold tracking-[0.2em] uppercase mb-2.5" style={{ color: 'var(--muted)' }}>Week {week} — All Workouts</p>
          <div className="grid grid-cols-2 gap-2.5">
            {WORKOUTS.map(w => {
              const isDone = done.includes(w.key)
              const c = COLORS[w.key as keyof typeof COLORS]
              return (
                <Link key={w.key} href={`/workout/${week}/${w.key}`}>
                  <div className="rounded-xl p-3.5 active:scale-[0.97] transition-transform"
                       style={{ background: isDone ? `${c}18` : 'var(--surface)', border: `1px solid ${isDone ? c + '55' : 'var(--border)'}` }}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-extrabold tracking-widest" style={{ color: isDone ? c : 'var(--muted)' }}>WKT {w.key}</span>
                      {isDone && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: `${c}25`, color: c }}>✓ Done</span>}
                    </div>
                    <p className="text-sm font-bold" style={{ color: 'var(--text)' }}>{w.shortName}</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{w.exercises.length} exercises</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
