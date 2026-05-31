'use client'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EXERCISE_MUSCLE, type RawSet } from '@/lib/program/analytics'

// ── Volume landmarks per muscle (direct sets/week, intermediate lifter)
// Source: Israetel / RP Strength framework; MRV = direct sets only,
// indirect volume from compounds already factored in per rpstrength.com
const THRESHOLDS: Record<string, { mev: number; mav: number; mrv: number }> = {
  'Chest':      { mev: 8,  mav: 12, mrv: 20 },
  'Back':       { mev: 10, mav: 14, mrv: 25 },
  'Shoulders':  { mev: 6,  mav: 8,  mrv: 18 },
  'Side Delts': { mev: 6,  mav: 12, mrv: 26 },
  'Rear Delts': { mev: 6,  mav: 10, mrv: 26 },
  'Biceps':     { mev: 8,  mav: 12, mrv: 20 },
  'Triceps':    { mev: 6,  mav: 10, mrv: 18 },
  'Quads':      { mev: 8,  mav: 12, mrv: 20 },
  'Hamstrings': { mev: 6,  mav: 10, mrv: 20 },
  'Glutes':     { mev: 4,  mav: 8,  mrv: 16 },
  'Calves':     { mev: 8,  mav: 14, mrv: 24 },
  'Core':       { mev: 6,  mav: 10, mrv: 16 },
}

// Muscle display order — push / pull / legs / core
const MUSCLE_ORDER = [
  'Chest','Shoulders','Side Delts','Triceps',
  'Back','Rear Delts','Biceps',
  'Quads','Hamstrings','Glutes','Calves',
  'Core',
]

// ── Week utilities ────────────────────────────────────────────────────
function getWeekKey(date: Date): string {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 4 - (d.getDay() || 7))
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${d.getFullYear()}-W${week.toString().padStart(2, '0')}`
}

function weekLabel(key: string): string {
  const [yearStr, weekStr] = key.split('-W')
  const year = parseInt(yearStr), week = parseInt(weekStr)
  const jan4 = new Date(year, 0, 4)
  const mon  = new Date(jan4)
  mon.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (week - 1) * 7)
  const sun  = new Date(mon); sun.setDate(mon.getDate() + 6)
  const fmt  = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const isThisWeek = getWeekKey(new Date()) === key
  return isThisWeek ? 'This Week' : `${fmt(mon)} – ${fmt(sun)}`
}

function shiftWeek(key: string, d: number): string {
  const [yearStr, weekStr] = key.split('-W')
  const year = parseInt(yearStr), week = parseInt(weekStr)
  const jan4 = new Date(year, 0, 4)
  const mon  = new Date(jan4)
  mon.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (week - 1) * 7)
  mon.setDate(mon.getDate() + d * 7)
  return getWeekKey(mon)
}

// ── Zone bar row ──────────────────────────────────────────────────────
function MuscleRow({ muscle, sets }: { muscle: string; sets: number }) {
  const t = THRESHOLDS[muscle]
  if (!t) return null

  // Scale: MRV sits at 85% of track width, leaving room for overtraining display
  const scale = t.mrv / 0.85
  const mevX  = (t.mev / scale) * 100
  const mavX  = (t.mav / scale) * 100
  const mrvX  = (t.mrv / scale) * 100
  const barW  = Math.min((sets / scale) * 100, 100)

  // Determine zone and bar color
  const zone  = sets === 0     ? 'none'
              : sets < t.mev   ? 'below'
              : sets < t.mav   ? 'mev'
              : sets <= t.mrv  ? 'optimal'
              :                  'over'

  const barColor = zone === 'none'    ? 'transparent'
                 : zone === 'below'   ? '#FF453A'
                 : zone === 'mev'     ? '#FF9F0A'
                 : zone === 'optimal' ? '#30D158'
                 :                     '#FF453A'

  const zoneLabel = zone === 'none'    ? ''
                  : zone === 'below'   ? 'Below MEV'
                  : zone === 'mev'     ? 'Building'
                  : zone === 'optimal' ? 'Optimal'
                  :                     'Over MRV'

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {/* Muscle label */}
      <p style={{ width:76, fontSize:12, fontWeight:600, color:'#fff',
        textAlign:'right', flexShrink:0, letterSpacing:'-0.1px', lineHeight:1.2 }}>
        {muscle}
      </p>

      {/* Track + bar */}
      <div style={{ flex:1, position:'relative' }}>
        {/* Zone background segments */}
        <div style={{ position:'relative', height:10, borderRadius:6, overflow:'hidden',
          background:'rgba(44,44,46,0.9)' }}>

          {/* Below MEV zone — subtle red */}
          <div style={{ position:'absolute', left:0, width:`${mevX}%`, height:'100%',
            background:'rgba(255,69,58,0.18)' }} />
          {/* MEV→MAV zone — subtle orange */}
          <div style={{ position:'absolute', left:`${mevX}%`, width:`${mavX - mevX}%`,
            height:'100%', background:'rgba(255,159,10,0.18)' }} />
          {/* MAV→MRV zone — subtle green */}
          <div style={{ position:'absolute', left:`${mavX}%`, width:`${mrvX - mavX}%`,
            height:'100%', background:'rgba(48,209,88,0.18)' }} />
          {/* Above MRV zone — subtle red */}
          <div style={{ position:'absolute', left:`${mrvX}%`, right:0, height:'100%',
            background:'rgba(255,69,58,0.18)' }} />

          {/* Actual bar */}
          {sets > 0 && (
            <div style={{ position:'absolute', left:0, width:`${barW}%`, height:'100%',
              background: barColor, borderRadius:6, opacity:0.9,
              transition:'width 0.6s cubic-bezier(0.4,0,0.2,1)' }} />
          )}

          {/* MEV line */}
          <div style={{ position:'absolute', left:`${mevX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(255,159,10,0.7)', transform:'translateX(-50%)' }} />
          {/* MAV line */}
          <div style={{ position:'absolute', left:`${mavX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(48,209,88,0.7)', transform:'translateX(-50%)' }} />
          {/* MRV line */}
          <div style={{ position:'absolute', left:`${mrvX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(255,69,58,0.7)', transform:'translateX(-50%)' }} />
        </div>
      </div>

      {/* Count + zone label */}
      <div style={{ width:68, flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ fontSize:14, fontWeight:800, color: zone==='none' ? '#3A3A3C' : barColor,
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.5px', minWidth:20, textAlign:'right' }}>
          {sets}
        </span>
        {zoneLabel && (
          <span style={{ fontSize:9, fontWeight:700, color: barColor, letterSpacing:'0.02em',
            opacity:0.85, lineHeight:1.2 }}>
            {zoneLabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main chart component ──────────────────────────────────────────────
export default function MuscleVolumeChart({ sets }: { sets: RawSet[] }) {
  // Get all weeks present in data + current week
  const allWeeks = useMemo(() => {
    const keys = new Set<string>([getWeekKey(new Date())])
    sets.forEach(s => keys.add(getWeekKey(new Date(s.completed_at))))
    return [...keys].sort().reverse()  // newest first
  }, [sets])

  const [weekKey, setWeekKey] = useState(() => getWeekKey(new Date()))

  const canNext = weekKey !== getWeekKey(new Date())
  const canPrev = allWeeks.length > 0

  // Count sets per muscle for selected week
  const muscleSets = useMemo(() => {
    const mon = (() => {
      const [y, w] = weekKey.split('-W').map(Number)
      const jan4 = new Date(y, 0, 4)
      const d = new Date(jan4)
      d.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (w - 1) * 7)
      return d
    })()
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6); sun.setHours(23, 59, 59, 999)

    const counts: Record<string, number> = {}
    sets.forEach(s => {
      const d = new Date(s.completed_at)
      if (d < mon || d > sun) return
      const muscle = EXERCISE_MUSCLE[s.exercise_name]
      if (!muscle) return
      counts[muscle] = (counts[muscle] ?? 0) + 1
    })
    return counts
  }, [sets, weekKey])

  // Ref thresholds — use the same scale so lines align visually
  // We pick a single reference scale based on the max MRV / 0.85
  const MAX_MRV = Math.max(...Object.values(THRESHOLDS).map(t => t.mrv))
  const refScale = MAX_MRV / 0.85  // for the axis labels

  const axisLabels = useMemo(() => {
    // MEV varies per muscle; show generic set-count labels under the track
    // Use the median thresholds for label placement
    const allMevs = Object.values(THRESHOLDS).map(t => t.mev)
    const allMavs = Object.values(THRESHOLDS).map(t => t.mav)
    return {
      mev: Math.round(allMevs.reduce((a,b)=>a+b,0)/allMevs.length),
      mav: Math.round(allMavs.reduce((a,b)=>a+b,0)/allMavs.length),
      mrv: MAX_MRV,
    }
  }, [MAX_MRV])

  return (
    <div>
      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
        <p style={{ flex:1, fontSize:11, fontWeight:700, color:'#8E8E93',
          textTransform:'uppercase', letterSpacing:'0.08em' }}>Weekly Volume</p>
        {/* Week navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={()=>setWeekKey(k=>shiftWeek(k,-1))}
            style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center',
              justifyContent:'center', background:'rgba(118,118,128,0.2)',
              border:'none', cursor:'pointer' }}>
            <ChevronLeft size={14} strokeWidth={2.5} style={{ color:'#8E8E93' }} />
          </button>
          <span style={{ fontSize:13, fontWeight:600, color:'#fff', minWidth:96, textAlign:'center' }}>
            {weekLabel(weekKey)}
          </span>
          <button onClick={()=>{ if(canNext) setWeekKey(k=>shiftWeek(k,1)) }}
            style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center',
              justifyContent:'center', background: canNext ? 'rgba(118,118,128,0.2)' : 'rgba(44,44,46,0.5)',
              border:'none', cursor: canNext ? 'pointer' : 'default' }}>
            <ChevronRight size={14} strokeWidth={2.5} style={{ color: canNext ? '#8E8E93' : '#3A3A3C' }} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display:'flex', gap:12, marginBottom:14, paddingLeft:86 }}>
        {([
          { color:'rgba(255,69,58,0.7)',   label:'MEV' },
          { color:'rgba(48,209,88,0.7)',   label:'MAV' },
          { color:'rgba(255,69,58,0.7)',   label:'MRV' },
        ]).map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:2, height:10, borderRadius:1, background:l.color }} />
            <span style={{ fontSize:10, fontWeight:700, color:'#8E8E93', letterSpacing:'0.04em' }}>
              {l.label}
            </span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:10 }}>
          {([
            { color:'#FF453A', label:'Low' },
            { color:'#FF9F0A', label:'Building' },
            { color:'#30D158', label:'Optimal' },
          ]).map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:l.color, opacity:0.85 }} />
              <span style={{ fontSize:10, color:'#8E8E93' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Section dividers + rows */}
      {[
        { title:'Push', muscles:['Chest','Shoulders','Side Delts','Triceps'] },
        { title:'Pull', muscles:['Back','Rear Delts','Biceps'] },
        { title:'Legs', muscles:['Quads','Hamstrings','Glutes','Calves'] },
        { title:'Core', muscles:['Core'] },
      ].map(section => (
        <div key={section.title} style={{ marginBottom:16 }}>
          <p style={{ fontSize:10, fontWeight:700, color:'rgba(142,142,147,0.5)',
            textTransform:'uppercase', letterSpacing:'0.1em',
            marginBottom:8, paddingLeft:86 }}>
            {section.title}
          </p>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {section.muscles.map(m => (
              <MuscleRow key={m} muscle={m} sets={muscleSets[m] ?? 0} />
            ))}
          </div>
        </div>
      ))}

      {/* Source note */}
      <p style={{ fontSize:10, color:'rgba(84,84,88,0.7)', marginTop:4, lineHeight:1.5, paddingLeft:86 }}>
        Thresholds from Israetel / RP Strength (direct sets/week, intermediate).
        Indirect volume from compounds not counted.
      </p>
    </div>
  )
}
