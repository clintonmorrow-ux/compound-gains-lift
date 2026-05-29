'use client'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Calendar, Dumbbell } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { fetchRecentSessions } from '@/lib/db'
import { WORKOUTS, WEEK_CONFIG } from '@/lib/program/data'
import type { WorkoutKey } from '@/types'

const COLORS: Record<string, string> = { A: '#3B82F6', B: '#22C55E', C: '#A855F7', D: '#F97316' }

function formatDuration(start: string, end: string | null) {
  if (!end) return 'In progress'
  const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return mins < 60 ? `${mins} min` : `${Math.floor(mins/60)}h ${mins%60}m`
}

export default function HistoryPage() {
  const router   = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  const init = useCallback(async () => {
    const data = await fetchRecentSessions(30)
    setSessions(data)
    setLoading(false)
  }, [])
  useEffect(() => { init() }, [init])

  const grouped = sessions.reduce((acc: Record<string, any[]>, s) => {
    const date = new Date(s.started_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    ;(acc[date] ??= []).push(s)
    return acc
  }, {})

  return (
    <div className="min-h-screen safe-bottom" style={{ background: 'var(--bg)' }}>
      <div className="safe-top px-4 pt-4 pb-4" style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl active:opacity-60" style={{ background: 'var(--surface-2)' }}>
            <ArrowLeft size={18} style={{ color: 'var(--muted)' }} />
          </button>
          <div>
            <h1 className="text-xl font-black" style={{ color: 'var(--text)' }}>History</h1>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{sessions.length} sessions logged</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-16">
            <Dumbbell size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
            <p className="font-bold" style={{ color: 'var(--muted)' }}>No sessions yet</p>
            <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>Complete your first workout to see it here</p>
          </div>
        ) : Object.entries(grouped).map(([date, daySessions]) => (
          <div key={date}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={13} style={{ color: 'var(--muted)' }} />
              <p className="text-xs font-bold" style={{ color: 'var(--muted)' }}>{date}</p>
            </div>
            <div className="space-y-2">
              {daySessions.map((s: any) => {
                const wkt    = WORKOUTS.find(w => w.key === s.workout_key)
                const color  = COLORS[s.workout_key as WorkoutKey] ?? 'var(--accent)'
                const sets   = s.logged_sets?.length ?? 0
                const done   = !!s.completed_at
                return (
                  <div key={s.id} className="rounded-xl p-4" style={{ background: 'var(--surface)', border: `1px solid ${done ? color + '33' : 'var(--border)'}` }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[11px] font-extrabold tracking-widest uppercase mb-0.5" style={{ color }}>Week {s.week_number} · Workout {s.workout_key}</p>
                        <p className="text-base font-bold" style={{ color: 'var(--text)' }}>{wkt?.shortName ?? s.workout_key}</p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                          {sets} sets · {formatDuration(s.started_at, s.completed_at)}
                          {!done && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ background: 'var(--warning)', color: '#000' }}>INCOMPLETE</span>}
                        </p>
                      </div>
                      {done && <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: `${color}22`, color }}>✓ Done</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
      <BottomNav />
    </div>
  )
}
