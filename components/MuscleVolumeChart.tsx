'use client'
import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { EXERCISE_MUSCLE, type RawSet } from '@/lib/program/analytics'
import { PHASE_LABELS } from '@/lib/program/data'

// ── Volume landmarks (direct sets/week, intermediate lifter)
// Source: Israetel / RP Strength. MRV = direct sets only —
// indirect volume from compound movements already factored in.
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

const SECTIONS = [
  { title: 'Push', muscles: ['Chest','Shoulders','Side Delts','Triceps'] },
  { title: 'Pull', muscles: ['Back','Rear Delts','Biceps'] },
  { title: 'Legs', muscles: ['Quads','Hamstrings','Glutes','Calves'] },
  { title: 'Core', muscles: ['Core'] },
]

// Extended RawSet that includes week_number
interface SetWithWeek extends RawSet {
  week_number: number | null
  session_id: string
}

// ── Single bar row ────────────────────────────────────────────────────
function MuscleRow({ muscle, sets }: { muscle: string; sets: number }) {
  const t = THRESHOLDS[muscle]
  if (!t) return null

  // Position MRV at 85% of track width — leaves room to show over-MRV
  const scale = t.mrv / 0.85
  const mevX  = (t.mev / scale) * 100
  const mavX  = (t.mav / scale) * 100
  const mrvX  = (t.mrv / scale) * 100
  const barW  = Math.min((sets / scale) * 100, 100)

  const zone  = sets === 0     ? 'none'
              : sets < t.mev   ? 'below'
              : sets < t.mav   ? 'building'
              : sets <= t.mrv  ? 'optimal'
              :                  'over'

  const barColor = { none:'transparent', below:'#F25C54',
                     building:'#FFB23E', optimal:'#2DD4A0', over:'#F25C54' }[zone]

  const zoneLabel = { none:'', below:'Below MEV', building:'Building',
                      optimal:'Optimal', over:'Over MRV' }[zone]

  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      {/* Label */}
      <p style={{ width:76, fontSize:12, fontWeight:600, color:'#fff', textAlign:'right',
        flexShrink:0, letterSpacing:'-0.1px', lineHeight:1.2 }}>
        {muscle}
      </p>

      {/* Zone-track bar */}
      <div style={{ flex:1, position:'relative' }}>
        <div style={{ position:'relative', height:10, borderRadius:6, overflow:'hidden',
          background:'rgba(44,44,46,0.9)' }}>
          {/* Zone backgrounds */}
          <div style={{ position:'absolute', left:0, width:`${mevX}%`,       height:'100%', background:'rgba(242,92,84,0.15)' }} />
          <div style={{ position:'absolute', left:`${mevX}%`, width:`${mavX-mevX}%`, height:'100%', background:'rgba(255,178,62,0.15)' }} />
          <div style={{ position:'absolute', left:`${mavX}%`, width:`${mrvX-mavX}%`, height:'100%', background:'rgba(45,212,160,0.15)' }} />
          <div style={{ position:'absolute', left:`${mrvX}%`, right:0,       height:'100%', background:'rgba(242,92,84,0.15)' }} />

          {/* Bar */}
          {sets > 0 && (
            <div style={{ position:'absolute', left:0, width:`${barW}%`, height:'100%',
              background:barColor, borderRadius:6, opacity:0.9,
              transition:'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
          )}

          {/* Threshold lines */}
          <div style={{ position:'absolute', left:`${mevX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(255,178,62,0.8)', transform:'translateX(-50%)' }} />
          <div style={{ position:'absolute', left:`${mavX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(45,212,160,0.8)', transform:'translateX(-50%)' }} />
          <div style={{ position:'absolute', left:`${mrvX}%`, top:0, bottom:0, width:1.5,
            background:'rgba(242,92,84,0.8)', transform:'translateX(-50%)' }} />
        </div>
      </div>

      {/* Count + zone label */}
      <div style={{ width:72, flexShrink:0, display:'flex', alignItems:'center', gap:5 }}>
        <span style={{ fontSize:14, fontWeight:800,
          color: zone==='none' ? '#3A3A3C' : barColor,
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.5px',
          minWidth:22, textAlign:'right' }}>
          {sets}
        </span>
        {zoneLabel && (
          <span style={{ fontSize:9, fontWeight:700, color:barColor, letterSpacing:'0.02em',
            opacity:0.85, lineHeight:1.2, maxWidth:44 }}>
            {zoneLabel}
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main chart ────────────────────────────────────────────────────────
export default function MuscleVolumeChart({ sets }: { sets: RawSet[] }) {
  const allSets = sets as SetWithWeek[]

  // Discover which program weeks have any data
  const weeksWithData = useMemo(() => {
    const s = new Set<number>()
    allSets.forEach(x => { if (x.week_number != null) s.add(x.week_number) })
    return [...s].sort((a, b) => a - b)
  }, [allSets])

  // Default to the highest week that has data (most recent training)
  const [selectedWeek, setSelectedWeek] = useState<number>(() =>
    weeksWithData.length > 0 ? weeksWithData[weeksWithData.length - 1] : 1
  )

  const currentIdx  = weeksWithData.indexOf(selectedWeek)
  const canPrev     = currentIdx > 0
  const canNext     = currentIdx < weeksWithData.length - 1

  const goTo = (w: number) => setSelectedWeek(w)

  // Count sets per muscle for the selected program week
  const muscleSets = useMemo(() => {
    const counts: Record<string, number> = {}
    allSets.forEach(s => {
      if (s.week_number !== selectedWeek) return
      const muscle = EXERCISE_MUSCLE[s.exercise_name]
      if (!muscle) return
      counts[muscle] = (counts[muscle] ?? 0) + 1
    })
    return counts
  }, [allSets, selectedWeek])

  const phaseLabel = PHASE_LABELS[selectedWeek] ?? ''

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:14 }}>
        <p style={{ flex:1, fontSize:11, fontWeight:700, color:'#8E8E93',
          textTransform:'uppercase', letterSpacing:'0.08em' }}>
          Weekly Volume
        </p>
        {/* Week navigation */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <button onClick={() => canPrev && goTo(weeksWithData[currentIdx - 1])}
            style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center',
              justifyContent:'center', background: canPrev ? 'rgba(118,118,128,0.2)' : 'rgba(44,44,46,0.5)',
              border:'none', cursor: canPrev ? 'pointer' : 'default' }}>
            <ChevronLeft size={14} strokeWidth={2.5}
              style={{ color: canPrev ? '#8E8E93' : '#3A3A3C' }} />
          </button>
          <div style={{ textAlign:'center', minWidth:110 }}>
            <p style={{ fontSize:14, fontWeight:700, color:'#fff', lineHeight:1 }}>
              Week {selectedWeek}
            </p>
            {phaseLabel && (
              <p style={{ fontSize:10, color:'#8E8E93', marginTop:2, letterSpacing:'0.02em' }}>
                {phaseLabel}
              </p>
            )}
          </div>
          <button onClick={() => canNext && goTo(weeksWithData[currentIdx + 1])}
            style={{ width:28, height:28, borderRadius:8, display:'flex', alignItems:'center',
              justifyContent:'center', background: canNext ? 'rgba(118,118,128,0.2)' : 'rgba(44,44,46,0.5)',
              border:'none', cursor: canNext ? 'pointer' : 'default' }}>
            <ChevronRight size={14} strokeWidth={2.5}
              style={{ color: canNext ? '#8E8E93' : '#3A3A3C' }} />
          </button>
        </div>
      </div>

      {/* Week dots — quick jump between all trained weeks */}
      {weeksWithData.length > 1 && (
        <div style={{ display:'flex', gap:4, marginBottom:14, paddingLeft:86, flexWrap:'wrap' }}>
          {weeksWithData.map(w => (
            <button key={w} onClick={() => goTo(w)}
              style={{ width:22, height:22, borderRadius:6, fontSize:10, fontWeight:700,
                background: w === selectedWeek ? '#FFB23E' : 'rgba(118,118,128,0.2)',
                color: w === selectedWeek ? '#000' : '#8E8E93',
                border: 'none', cursor: 'pointer' }}>
              {w}
            </button>
          ))}
        </div>
      )}

      {/* Legend */}
      <div style={{ display:'flex', gap:10, marginBottom:14, paddingLeft:86, flexWrap:'wrap' }}>
        {[
          { color:'rgba(255,178,62,0.8)', label:'MEV' },
          { color:'rgba(45,212,160,0.8)',  label:'MAV' },
          { color:'rgba(242,92,84,0.8)',  label:'MRV' },
        ].map(l => (
          <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
            <div style={{ width:2, height:10, borderRadius:1, background:l.color }} />
            <span style={{ fontSize:10, fontWeight:700, color:'#8E8E93' }}>{l.label}</span>
          </div>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          {[
            { color:'#F25C54', label:'Low' },
            { color:'#FFB23E', label:'Building' },
            { color:'#2DD4A0', label:'Optimal' },
          ].map(l => (
            <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
              <div style={{ width:8, height:8, borderRadius:2, background:l.color, opacity:0.85 }} />
              <span style={{ fontSize:10, color:'#8E8E93' }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* No data state */}
      {weeksWithData.length === 0 ? (
        <p style={{ fontSize:14, color:'#8E8E93', paddingLeft:86, lineHeight:1.6 }}>
          Log some sets and they'll appear here grouped by your program week — no calendar tracking.
        </p>
      ) : (
        <>
          {SECTIONS.map(section => (
            <div key={section.title} style={{ marginBottom:16 }}>
              <p style={{ fontSize:10, fontWeight:700,
                color:'rgba(142,142,147,0.5)', textTransform:'uppercase',
                letterSpacing:'0.1em', marginBottom:8, paddingLeft:86 }}>
                {section.title}
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {section.muscles.map(m => (
                  <MuscleRow key={m} muscle={m} sets={muscleSets[m] ?? 0} />
                ))}
              </div>
            </div>
          ))}
          <p style={{ fontSize:10, color:'rgba(84,84,88,0.6)', marginTop:4,
            paddingLeft:86, lineHeight:1.5 }}>
            Thresholds from Israetel / RP Strength · direct sets only · intermediate
          </p>
        </>
      )}
    </div>
  )
}
