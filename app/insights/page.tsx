'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, TrendingUp, Flame, Award, AlertTriangle } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import BodyHeatmap from '@/components/BodyHeatmap'
import { createClient } from '@/lib/supabase/client'
import { fetchAllLoggedSets, fetchCoachPrefs } from '@/lib/db'
import CoachSignals from '@/components/CoachSignals'
import { detectRirTrends, detectDeloadReadiness, analyzeIntraSetFatigue, DEFAULT_COACH_PREFS, type CoachSet } from '@/lib/program/coach'
import { WORKOUTS } from '@/lib/program/data'
import {
  e1rmSeries, weeklyVolume, regionIntensity, muscleVolume,
  personalRecords, detectPlateaus, trainingIndex, EXERCISE_MUSCLE, type RawSet
} from '@/lib/program/analytics'

// Lightweight inline line chart (SVG)
function Sparkline({ data, color }: { data:number[]; color:string }) {
  if (data.length < 2) return null
  const w=280, h=64, pad=4
  const min=Math.min(...data), max=Math.max(...data)
  const range = max-min || 1
  const pts = data.map((v,i) => {
    const x = pad + (i/(data.length-1))*(w-2*pad)
    const y = h-pad - ((v-min)/range)*(h-2*pad)
    return `${x},${y}`
  }).join(' ')
  const lastX = pad + (w-2*pad)
  const lastY = h-pad - ((data[data.length-1]-min)/range)*(h-2*pad)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:64 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`g-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pad},${h-pad} ${pts} ${lastX},${h-pad}`} fill={`url(#g-${color})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={color} />
    </svg>
  )
}

export default function InsightsPage() {
  const router = useRouter()
  const [sets,    setSets]    = useState<RawSet[]>([])
  const [coachPrefs, setCoachPrefs] = useState(DEFAULT_COACH_PREFS)
  const [loading, setLoading] = useState(true)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{ session } } = await sb.auth.getSession()
      if (!session) await sb.auth.signInAnonymously()
      const [allSets, cp] = await Promise.all([fetchAllLoggedSets(), fetchCoachPrefs()])
      setSets(allSets); setCoachPrefs(cp)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])
  useEffect(()=>{ init() }, [init])

  const Header = (
    <div className="pt-safe sticky top-0 z-20" style={{
      background:'rgba(0,0,0,0.95)', backdropFilter:'saturate(180%) blur(24px)',
      WebkitBackdropFilter:'saturate(180%) blur(24px)', borderBottom:'1px solid rgba(84,84,88,0.8)' }}>
      <div className="flex items-center gap-3 px-4 pb-3 pt-2">
        <button onClick={()=>router.push('/')} style={{ width:40, height:40, borderRadius:'50%',
          background:'var(--fill-3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          <ChevronLeft size={20} strokeWidth={2.5} style={{ color:'var(--accent)' }} />
        </button>
        <h1 className="t-title2 sf-bold" style={{ color:'var(--label)' }}>Insights</h1>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin" style={{ borderColor:'var(--accent)' }} />
      </div>
      <BottomNav />
    </div>
  )

  // Empty state
  if (sets.length === 0) return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="px-6 py-20 text-center">
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(118,118,128,0.15)',
          display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px' }}>
          <TrendingUp size={30} style={{ color:'#8E8E93' }} />
        </div>
        <p className="t-headline sf-semibold" style={{ color:'var(--label)' }}>No data yet</p>
        <p className="t-subhead mt-2" style={{ color:'#8E8E93', lineHeight:1.5 }}>
          Log a few workouts and your strength trends, muscle balance, and PRs will appear here.
        </p>
        <button onClick={()=>router.push('/')} className="ios-btn mt-6" style={{ maxWidth:220, margin:'24px auto 0' }}>
          Start a Workout
        </button>
      </div>
      <BottomNav />
    </div>
  )

  // Compute analytics
  const idx       = trainingIndex(sets)
  // Coach signals (computed from RIR + set order data)
  const coachSets   = sets as unknown as CoachSet[]
  const rirTrends   = detectRirTrends(coachSets)
  const deloadSig   = detectDeloadReadiness(coachSets)
  const intraSet    = analyzeIntraSetFatigue(coachSets)
  const regions   = regionIntensity(sets, 30)
  const mv         = muscleVolume(sets, 30)
  const prs       = personalRecords(sets).slice(0, 6)
  const plateaus  = detectPlateaus(sets)
  const volume    = weeklyVolume(sets).slice(-8)
  const sessions  = new Set(sets.map(s => s.completed_at.slice(0,10))).size

  // Top lifts by data volume for trend charts
  const topLifts = Array.from(new Set(sets.map(s=>s.exercise_name)))
    .map(ex => ({ ex, series: e1rmSeries(sets, ex) }))
    .filter(x => x.series.length >= 2)
    .sort((a,b)=>b.series.length-a.series.length)
    .slice(0, 4)

  const muscleSorted = Object.entries(mv).sort((a,b)=>b[1]-a[1])
  const maxMv = Math.max(1, ...Object.values(mv))
  const WC = ['#0A84FF','#30D158','#BF5AF2','#FF9F0A']

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="px-4 pt-5 space-y-7">

        {/* ── Coach Signals ── */}
        <CoachSignals rirTrends={rirTrends} deload={deloadSig} intraSet={intraSet} prefs={coachPrefs} />

        {/* ── Training Index ── */}
        <div style={{ borderRadius:18, padding:'20px', textAlign:'center',
          background:'linear-gradient(135deg, rgba(10,132,255,0.18), rgba(191,90,242,0.12))',
          border:'0.5px solid rgba(10,132,255,0.3)' }}>
          <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.1em' }}>
            Training Index
          </p>
          <p style={{ fontSize:56, fontWeight:800, color:'#fff', letterSpacing:'-2px', lineHeight:1.1, marginTop:4 }}>
            {idx}
          </p>
          <div style={{ display:'flex', justifyContent:'center', gap:20, marginTop:8 }}>
            <span style={{ fontSize:13, color:'#8E8E93' }}>{sessions} sessions</span>
            <span style={{ fontSize:13, color:'#8E8E93' }}>{prs.length} PRs</span>
          </div>
        </div>

        {/* ── Muscle Heatmap ── */}
        <div>
          <p className="ios-section-label mb-1">Muscle Volume · Last 30 Days</p>
          <p className="t-footnote mb-3" style={{ color:'#8E8E93' }}>
            Brighter = more training volume. Surfaces imbalances at a glance.
          </p>
          <div style={{ borderRadius:18, padding:'16px', background:'#0D0D14',
            border:'0.5px solid rgba(84,84,88,0.4)' }}>
            <BodyHeatmap regions={regions} />
            {muscleSorted.length > 0 && (
              <div style={{ marginTop:12, paddingTop:12, borderTop:'0.5px solid rgba(84,84,88,0.4)',
                display:'flex', flexWrap:'wrap', gap:6 }}>
                {muscleSorted.slice(0,4).map(([m]) => (
                  <span key={m} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:7,
                    background:'rgba(48,209,88,0.15)', color:'#30D158' }}>most: {m}</span>
                ))}
                {muscleSorted.slice(-2).map(([m]) => (
                  <span key={m} style={{ fontSize:11, fontWeight:600, padding:'3px 9px', borderRadius:7,
                    background:'rgba(255,159,10,0.15)', color:'#FF9F0A' }}>least: {m}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Plateau alerts ── */}
        {plateaus.length > 0 && (
          <div>
            <p className="ios-section-label mb-2">Plateau Watch</p>
            <div className="ios-group">
              {plateaus.slice(0,4).map((p,i) => (
                <div key={p.exercise} className={`ios-row ${i===0?'ios-row-first':''}`}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:'flex',
                    alignItems:'center', justifyContent:'center', background:'rgba(255,159,10,0.15)' }}>
                    <AlertTriangle size={15} style={{ color:'#FF9F0A' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{p.exercise}</p>
                    <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>
                      e1RM flat over last {p.sessions} sessions — consider a deload or rep change
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Strength trends ── */}
        {topLifts.length > 0 && (
          <div>
            <p className="ios-section-label mb-1">Estimated 1RM Trends</p>
            <p className="t-footnote mb-3" style={{ color:'#8E8E93' }}>
              Calculated from every logged set (Epley formula).
            </p>
            <div className="space-y-3">
              {topLifts.map((lift, i) => {
                const series = lift.series
                const first = series[0].e1rm, last = series[series.length-1].e1rm
                const delta = last - first
                const color = WC[i % WC.length]
                return (
                  <div key={lift.ex} style={{ borderRadius:16, padding:'14px 16px 8px',
                    background:'#0D0D14', border:'0.5px solid rgba(84,84,88,0.4)' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <p style={{ fontSize:14, fontWeight:700, color:'#fff' }}>{lift.ex}</p>
                      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
                        <span style={{ fontSize:18, fontWeight:800, color:'#fff' }}>{last}</span>
                        <span style={{ fontSize:11, color:'#8E8E93' }}>lbs e1RM</span>
                      </div>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2, marginBottom:4 }}>
                      <span style={{ fontSize:12, fontWeight:600,
                        color: delta>0 ? '#30D158' : delta<0 ? '#FF9F0A' : '#8E8E93' }}>
                        {delta>0?'▲':delta<0?'▼':'—'} {Math.abs(delta)} lbs
                      </span>
                      <span style={{ fontSize:12, color:'#8E8E93' }}>over {series.length} sessions</span>
                    </div>
                    <Sparkline data={series.map(s=>s.e1rm)} color={color} />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Weekly volume ── */}
        {volume.length > 1 && (
          <div>
            <p className="ios-section-label mb-1">Weekly Volume</p>
            <p className="t-footnote mb-3" style={{ color:'#8E8E93' }}>
              Total tonnage (weight × reps) per week.
            </p>
            <div style={{ borderRadius:16, padding:'16px', background:'#0D0D14',
              border:'0.5px solid rgba(84,84,88,0.4)', display:'flex', alignItems:'flex-end',
              gap:6, height:120 }}>
              {(() => {
                const max = Math.max(...volume.map(v=>v.volume))
                return volume.map((v,i) => (
                  <div key={v.week} style={{ flex:1, display:'flex', flexDirection:'column',
                    alignItems:'center', justifyContent:'flex-end', height:'100%', gap:4 }}>
                    <div style={{ width:'100%', borderRadius:'4px 4px 0 0',
                      height:`${Math.max(4,(v.volume/max)*80)}%`,
                      background: i===volume.length-1 ? 'var(--accent)' : 'rgba(10,132,255,0.4)' }} />
                    <span style={{ fontSize:9, color:'#8E8E93' }}>{(v.volume/1000).toFixed(0)}k</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        )}

        {/* ── Personal Records ── */}
        {prs.length > 0 && (
          <div>
            <p className="ios-section-label mb-2">Personal Records</p>
            <div className="ios-group">
              {prs.map((pr, i) => (
                <div key={pr.exercise} className={`ios-row ${i===0?'ios-row-first':''}`}>
                  <div style={{ width:32, height:32, borderRadius:9, flexShrink:0, display:'flex',
                    alignItems:'center', justifyContent:'center',
                    background: i===0 ? 'rgba(255,159,10,0.2)' : 'rgba(118,118,128,0.15)' }}>
                    <Award size={16} style={{ color: i===0 ? '#FF9F0A' : '#8E8E93' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{pr.exercise}</p>
                    <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>
                      {pr.weight} lbs × {pr.reps} · {pr.date}
                    </p>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontSize:17, fontWeight:800, color:'#fff' }}>{pr.e1rm}</p>
                    <p style={{ fontSize:10, color:'#8E8E93' }}>e1RM</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
