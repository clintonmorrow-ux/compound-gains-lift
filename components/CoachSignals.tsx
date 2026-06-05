'use client'
import { TrendingDown, TrendingUp, Activity, Battery, ChevronRight } from 'lucide-react'
import type { RirTrendSignal, DeloadSignal, IntraSetSignal } from '@/lib/program/coach'

// Shared signal card — single visual language for all coach insights
function SignalCard({ accent, icon, tag, title, body }: {
  accent: string; icon: React.ReactNode; tag: string; title: string; body: string
}) {
  return (
    <div style={{ display:'flex', gap:12, padding:'14px 16px', borderRadius:16,
      background:`color-mix(in srgb, ${accent} 8%, transparent)`,
      border:`0.5px solid color-mix(in srgb, ${accent} 30%, transparent)` }}>
      <div style={{ width:36, height:36, borderRadius:11, flexShrink:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        background:`color-mix(in srgb, ${accent} 16%, transparent)` }}>
        {icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ fontSize:10, fontWeight:800, color:accent, textTransform:'uppercase',
          letterSpacing:'0.08em', marginBottom:3 }}>{tag}</p>
        <p style={{ fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'-0.2px',
          marginBottom:2, lineHeight:1.3 }}>{title}</p>
        <p style={{ fontSize:13, color:'#8E8E93', lineHeight:1.45 }}>{body}</p>
      </div>
    </div>
  )
}

export default function CoachSignals({ rirTrends, deload, intraSet, prefs }: {
  rirTrends: RirTrendSignal[]
  deload: DeloadSignal
  intraSet: IntraSetSignal[]
  prefs: { rirTrend:boolean; deloadAlerts:boolean; setFatigue:boolean }
}) {
  const cards: React.ReactNode[] = []

  // Deload (highest priority — full-width emphasis handled by caller's banner;
  // here we show it as a card only if triggered)
  if (prefs.deloadAlerts && deload.triggered) {
    cards.push(
      <SignalCard key="deload" accent="#FFB23E"
        icon={<Battery size={18} strokeWidth={2} style={{ color:'#FFB23E' }} />}
        tag="Recovery Signal"
        title={`${deload.indicatorsHit} fatigue indicators detected`}
        body={deload.reasons.join(' · ') + '. A deload week could maximise your next training block.'} />
    )
  }

  // RIR fatigue trends
  if (prefs.rirTrend) {
    rirTrends.filter(s => s.direction === 'fatigue').forEach((s, i) =>
      cards.push(
        <SignalCard key={`fat-${i}`} accent="#F25C54"
          icon={<TrendingDown size={18} strokeWidth={2} style={{ color:'#F25C54' }} />}
          tag="Fatigue Watch" title={s.exercise} body={s.message} />
      )
    )
  }

  // Intra-set: rep progression suggestions
  if (prefs.setFatigue) {
    intraSet.filter(s => s.suggestion === 'reps').forEach((s, i) =>
      cards.push(
        <SignalCard key={`reps-${i}`} accent="#17BEBB"
          icon={<Activity size={18} strokeWidth={2} style={{ color:'#17BEBB' }} />}
          tag="Set Fatigue" title={s.exercise} body={s.message} />
      )
    )
  }

  // Positive signals last (ready for load / RIR rising)
  if (prefs.rirTrend) {
    rirTrends.filter(s => s.direction === 'ready').forEach((s, i) =>
      cards.push(
        <SignalCard key={`rdy-${i}`} accent="#2DD4A0"
          icon={<TrendingUp size={18} strokeWidth={2} style={{ color:'#2DD4A0' }} />}
          tag="Ready to Progress" title={s.exercise} body={s.message} />
      )
    )
  }
  if (prefs.setFatigue) {
    intraSet.filter(s => s.suggestion === 'load').forEach((s, i) =>
      cards.push(
        <SignalCard key={`load-${i}`} accent="#2DD4A0"
          icon={<TrendingUp size={18} strokeWidth={2} style={{ color:'#2DD4A0' }} />}
          tag="Ready to Progress" title={s.exercise} body={s.message} />
      )
    )
  }

  if (!cards.length) return null

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <p style={{ fontSize:11, fontWeight:700, color:'#8E8E93', textTransform:'uppercase',
          letterSpacing:'0.08em' }}>Coach</p>
        <div style={{ flex:1, height:0.5, background:'rgba(84,84,88,0.4)' }} />
        <span style={{ fontSize:11, color:'#8E8E93' }}>{cards.length} signal{cards.length>1?'s':''}</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
        {cards}
      </div>
    </div>
  )
}
