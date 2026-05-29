'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Zap, CheckCircle2 } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { WORKOUTS, WEEK_CONFIG, PHASE_LABELS } from '@/lib/program/data'
import { fetchSettings, updateSettings, fetchRecentSessions } from '@/lib/db'

const WKT_COLOR = { A:'--a', B:'--b', C:'--c', D:'--d' } as const
const WKT_BG    = { A:'--a-bg', B:'--b-bg', C:'--c-bg', D:'--d-bg' } as const
const PHASE_CLASS: Record<number,string> = {
  1:'phase-1',2:'phase-1',3:'phase-1',4:'phase-deload',
  5:'phase-2',6:'phase-2',7:'phase-2',8:'phase-deload',
  9:'phase-3',10:'phase-3',11:'phase-3',12:'phase-deload',
}

export default function Dashboard() {
  const [week,    setWeek]    = useState(1)
  const [done,    setDone]    = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const init = useCallback(async () => {
    const sb = createClient()
    const { data: { session } } = await sb.auth.getSession()
    if (!session) await sb.auth.signInAnonymously()
    const [settings, sessions] = await Promise.all([fetchSettings(), fetchRecentSessions(20)])
    setWeek(settings.current_week)
    setDone((sessions as any[])
      .filter(s => s.week_number === settings.current_week && s.completed_at)
      .map(s => s.workout_key))
    setLoading(false)
  }, [])

  useEffect(() => { init() }, [init])

  const changeWeek = async (d: number) => {
    const n = Math.max(1, Math.min(12, week + d))
    setWeek(n)
    await updateSettings({ current_week: n })
  }

  const cfg         = WEEK_CONFIG[week]
  const nextWorkout = WORKOUTS.find(w => !done.includes(w.key))

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ background:'var(--bg)' }}>
      <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
           style={{ borderColor:'var(--accent)' }} />
    </div>
  )

  return (
    <div className="min-h-screen pb-nav" style={{ background:'var(--bg)' }}>

      {/* ── Header ── */}
      <div className="pt-safe px-5 pb-4"
           style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center justify-between pt-3">
          {/* Brand */}
          <div>
            <p className="label" style={{ color:'var(--accent)' }}>Compound Gains</p>
            <h1 className="text-[28px] font-black tracking-tight leading-none mt-0.5"
                style={{ color:'var(--text)' }}>Lift</h1>
          </div>

          {/* Week picker */}
          <div className="flex items-center gap-1"
               style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, padding:'6px 8px' }}>
            <button onClick={() => changeWeek(-1)} className="pressable p-1">
              <ChevronLeft size={16} style={{ color:'var(--text-2)' }} />
            </button>
            <div className="text-center w-12">
              <p className="text-[11px] font-semibold" style={{ color:'var(--text-2)' }}>WEEK</p>
              <p className="text-[22px] font-black leading-none" style={{ color:'var(--text)' }}>
                {week}<span className="text-sm font-normal" style={{ color:'var(--text-3)' }}>/12</span>
              </p>
            </div>
            <button onClick={() => changeWeek(+1)} className="pressable p-1">
              <ChevronRight size={16} style={{ color:'var(--text-2)' }} />
            </button>
          </div>
        </div>

        {/* Phase + progress */}
        <div className="flex items-center gap-3 mt-3">
          <span className={`pill ${PHASE_CLASS[week]}`}>{PHASE_LABELS[week]}</span>
          <div className="flex-1 h-[3px] rounded-full overflow-hidden"
               style={{ background:'var(--surface-3)' }}>
            <div className="h-full rounded-full transition-all duration-500"
                 style={{ width:`${((week-1)/12)*100}%`, background:'var(--accent)' }} />
          </div>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-5">

        {/* ── Next Workout ── */}
        {nextWorkout ? (
          <div className="fade-up">
            <p className="label mb-3">Up Next</p>
            <Link href={`/workout/${week}/${nextWorkout.key}`}>
              <div className="pressable card p-5"
                   style={{ borderColor:`color-mix(in srgb, var(${WKT_COLOR[nextWorkout.key as keyof typeof WKT_COLOR]}) 30%, transparent)` }}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-xl flex items-center justify-center"
                           style={{ background:`var(${WKT_BG[nextWorkout.key as keyof typeof WKT_BG]})` }}>
                        <Zap size={14} style={{ color:`var(${WKT_COLOR[nextWorkout.key as keyof typeof WKT_COLOR]})` }} />
                      </div>
                      <span className="label" style={{ color:`var(${WKT_COLOR[nextWorkout.key as keyof typeof WKT_COLOR]})` }}>
                        Workout {nextWorkout.key}
                      </span>
                    </div>
                    <h2 className="text-[26px] font-black leading-tight tracking-tight"
                        style={{ color:'var(--text)' }}>
                      {nextWorkout.shortName}
                    </h2>
                    <p className="text-[13px] mt-1 leading-snug" style={{ color:'var(--text-2)' }}>
                      {nextWorkout.focus}
                    </p>
                    <p className="text-[12px] mt-3" style={{ color:'var(--text-3)' }}>
                      {nextWorkout.exercises.length} exercises · {cfg.sets.primary} primary sets · RIR {cfg.rir}
                    </p>
                  </div>
                </div>
                <div className="btn-primary mt-5 flex items-center justify-center gap-2"
                     style={{ background:`var(${WKT_COLOR[nextWorkout.key as keyof typeof WKT_COLOR]})` }}>
                  <Zap size={16} />
                  Start Workout
                </div>
              </div>
            </Link>
          </div>
        ) : (
          <div className="fade-up card p-6 text-center">
            <CheckCircle2 size={36} className="mx-auto mb-3" style={{ color:'var(--success)' }} />
            <p className="text-[17px] font-bold" style={{ color:'var(--text)' }}>Week {week} Complete</p>
            <p className="text-[13px] mt-1" style={{ color:'var(--text-2)' }}>
              All 4 workouts done. Move to week {Math.min(week+1,12)} when ready.
            </p>
          </div>
        )}

        {/* ── Week Grid ── */}
        <div className="fade-up" style={{ animationDelay:'0.05s' }}>
          <p className="label mb-3">This Week</p>
          <div className="grid grid-cols-4 gap-2.5">
            {WORKOUTS.map(w => {
              const isDone = done.includes(w.key)
              const c = WKT_COLOR[w.key as keyof typeof WKT_COLOR]
              const bg = WKT_BG[w.key as keyof typeof WKT_BG]
              return (
                <Link key={w.key} href={`/workout/${week}/${w.key}`}>
                  <div className="pressable card-sm flex flex-col items-center py-4 gap-1.5"
                       style={{
                         background: isDone ? `var(${bg})` : 'var(--surface)',
                         borderColor: isDone ? `color-mix(in srgb, var(${c}) 40%, transparent)` : 'var(--border)',
                       }}>
                    <span className="text-[13px] font-black" style={{ color: isDone ? `var(${c})` : 'var(--text-3)' }}>
                      {w.key}
                    </span>
                    {isDone
                      ? <CheckCircle2 size={14} style={{ color:`var(${c})` }} />
                      : <div className="w-3.5 h-3.5 rounded-full" style={{ border:'1.5px solid var(--border-md)' }} />
                    }
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Week note ── */}
        <div className="fade-up" style={{ animationDelay:'0.1s' }}>
          <div className="card-sm px-4 py-3.5">
            <p className="text-[13px] leading-relaxed" style={{ color:'var(--text-2)' }}>
              {cfg.note}
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
