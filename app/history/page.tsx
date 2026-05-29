'use client'
import { useEffect, useState, useCallback } from 'react'
import { ArrowLeft, Dumbbell, ChevronRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'
import { fetchRecentSessions } from '@/lib/db'
import { WORKOUTS } from '@/lib/program/data'
import type { WorkoutKey } from '@/types'

const WKT_COLOR = { A:'--a', B:'--b', C:'--c', D:'--d' } as const

function duration(start: string, end: string | null) {
  if (!end) return null
  const m = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000)
  return m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`
}

function relativeDate(dateStr: string) {
  const date  = new Date(dateStr)
  const today = new Date()
  const diff  = Math.floor((today.getTime() - date.getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

export default function HistoryPage() {
  const router = useRouter()
  const [sessions, setSessions] = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  const init = useCallback(async () => {
    const data = await fetchRecentSessions(30)
    setSessions(data)
    setLoading(false)
  }, [])
  useEffect(() => { init() }, [init])

  return (
    <div className="min-h-screen pb-nav" style={{ background:'var(--bg)' }}>

      {/* Header */}
      <div className="pt-safe px-5 pb-4"
           style={{ background:'rgba(12,12,20,0.9)', backdropFilter:'blur(16px)', WebkitBackdropFilter:'blur(16px)', borderBottom:'1px solid var(--border)' }}>
        <div className="flex items-center gap-3 pt-3">
          <button onClick={() => router.back()}
            className="pressable w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background:'var(--surface-2)' }}>
            <ArrowLeft size={17} style={{ color:'var(--text-2)' }} />
          </button>
          <div>
            <h1 className="text-[20px] font-black tracking-tight" style={{ color:'var(--text)' }}>History</h1>
            <p className="text-[12px]" style={{ color:'var(--text-2)' }}>
              {sessions.length} sessions logged
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 rounded-full border-2 border-t-transparent animate-spin"
                 style={{ borderColor:'var(--accent)' }} />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center"
                 style={{ background:'var(--surface-2)' }}>
              <Dumbbell size={28} style={{ color:'var(--text-3)' }} />
            </div>
            <div className="text-center">
              <p className="text-[17px] font-bold" style={{ color:'var(--text)' }}>No sessions yet</p>
              <p className="text-[13px] mt-1" style={{ color:'var(--text-2)' }}>
                Complete your first workout to see it here
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sessions.map((s: any, i: number) => {
              const wkt  = WORKOUTS.find(w => w.key === s.workout_key)
              const c    = `var(${WKT_COLOR[s.workout_key as WorkoutKey] ?? '--accent'})`
              const dur  = duration(s.started_at, s.completed_at)
              const sets = s.logged_sets?.length ?? 0
              return (
                <div key={s.id}
                  className="card px-4 py-4 flex items-center gap-4 fade-up"
                  style={{ animationDelay: `${i * 0.04}s` }}>
                  {/* Workout key badge */}
                  <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 text-[14px] font-black"
                       style={{ background:`color-mix(in srgb, ${c} 15%, transparent)`, color: c }}>
                    {s.workout_key}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold truncate" style={{ color:'var(--text)' }}>
                        {wkt?.shortName ?? s.workout_key}
                      </p>
                      {!s.completed_at && (
                        <span className="pill" style={{ background:'rgba(251,191,36,0.15)', color:'var(--warning)' }}>
                          Incomplete
                        </span>
                      )}
                    </div>
                    <p className="text-[12px] mt-0.5" style={{ color:'var(--text-2)' }}>
                      Week {s.week_number}
                      {sets > 0 && <span> · {sets} sets</span>}
                      {dur  && <span> · {dur}</span>}
                      <span style={{ color:'var(--text-3)' }}> · {relativeDate(s.started_at)}</span>
                    </p>
                  </div>

                  <ChevronRight size={15} style={{ color:'var(--text-3)', flexShrink:0 }} />
                </div>
              )
            })}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
