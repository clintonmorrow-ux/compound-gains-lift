// ════════════════════════════════════════════════════════════════════
// Coach — evidence-based training signal analysis
// All computed from already-logged data (RIR, weight, reps, set order)
//
// References:
//  • RIR trend / fatigue: Helms et al. 2016; Jukic et al. Phys Reports 2024
//  • Performance deload:   Coleman, Israetel, Schoenfeld et al. PeerJ 2024
//  • Intra-set fatigue:    Plotkin, Coleman, Schoenfeld et al. PeerJ 2022
// ════════════════════════════════════════════════════════════════════

export interface CoachSet {
  exercise_name: string
  weight_lbs: number | null
  reps: number | null
  rir: number | null
  set_number: number
  session_id: string
  completed_at: string
}

const epley = (w: number, r: number) => w * (1 + r / 30)

// Group sets by session for one exercise, ordered oldest → newest
function sessionsForExercise(sets: CoachSet[], exercise: string) {
  const bySession: Record<string, CoachSet[]> = {}
  sets.filter(s => s.exercise_name === exercise && s.reps != null)
      .forEach(s => { (bySession[s.session_id] ??= []).push(s) })
  return Object.values(bySession)
    .map(group => ({
      date: group[0].completed_at,
      sets: group.sort((a, b) => a.set_number - b.set_number),
    }))
    .sort((a, b) => a.date < b.date ? -1 : 1)
}

// ─────────────────────────────────────────────────────────────────────
// 1. RIR TREND DETECTION
// Compares top-set RIR across recent sessions at similar load.
// Falling RIR at equal load = accumulating fatigue.
// ─────────────────────────────────────────────────────────────────────
export interface RirTrendSignal {
  exercise: string
  direction: 'fatigue' | 'ready' | 'stable'
  rirDelta: number
  sessions: number
  message: string
}

export function detectRirTrends(sets: CoachSet[]): RirTrendSignal[] {
  const exercises = [...new Set(sets.map(s => s.exercise_name))]
  const signals: RirTrendSignal[] = []

  for (const ex of exercises) {
    const sessions = sessionsForExercise(sets, ex)
    if (sessions.length < 3) continue  // need ≥3 sessions for a trend

    // Use last 3 sessions. Top set = heaviest in each session.
    const recent = sessions.slice(-3)
    const topSets = recent.map(sess => {
      const withRir = sess.sets.filter(s => s.rir != null && s.weight_lbs != null)
      if (!withRir.length) return null
      // heaviest set of the session
      return withRir.reduce((a, b) => (b.weight_lbs! > a.weight_lbs!) ? b : a)
    })
    if (topSets.some(s => s === null)) continue

    const weights = topSets.map(s => s!.weight_lbs!)
    const rirs    = topSets.map(s => s!.rir!)

    // Only meaningful if loads are within ~7% of each other (comparable)
    const maxW = Math.max(...weights), minW = Math.min(...weights)
    if (maxW > 0 && (maxW - minW) / maxW > 0.07) continue

    const rirDelta = rirs[rirs.length - 1] - rirs[0]  // negative = harder over time

    if (rirDelta <= -1.5) {
      signals.push({
        exercise: ex, direction: 'fatigue', rirDelta, sessions: recent.length,
        message: `${ex} feels ${Math.abs(rirDelta).toFixed(0)} RIR harder at the same load over ${recent.length} sessions — fatigue may be building.`,
      })
    } else if (rirDelta >= 1.5) {
      signals.push({
        exercise: ex, direction: 'ready', rirDelta, sessions: recent.length,
        message: `${ex} is getting easier at the same load — you're ready to add weight.`,
      })
    }
  }
  // Fatigue signals first, then ready signals
  return signals.sort((a, b) => a.direction === 'fatigue' ? -1 : 1)
}

// ─────────────────────────────────────────────────────────────────────
// 2. PERFORMANCE-BASED DELOAD TRIGGERS
// Multiple independent indicators; 2+ hits → recommend deload.
// ─────────────────────────────────────────────────────────────────────
export interface DeloadSignal {
  triggered: boolean
  indicatorsHit: number
  totalChecked: number
  reasons: string[]
}

export function detectDeloadReadiness(sets: CoachSet[]): DeloadSignal {
  const reasons: string[] = []
  const exercises = [...new Set(sets.map(s => s.exercise_name))]

  // Indicator A: e1RM declining across last 2+ sessions on ≥2 compound lifts
  let e1rmDeclines = 0
  for (const ex of exercises) {
    const sessions = sessionsForExercise(sets, ex)
    if (sessions.length < 3) continue
    const e1rms = sessions.slice(-3).map(sess => {
      const best = sess.sets
        .filter(s => s.weight_lbs && s.reps)
        .map(s => epley(s.weight_lbs!, s.reps!))
      return best.length ? Math.max(...best) : 0
    })
    // strictly decreasing over the last 3 sessions
    if (e1rms[0] > 0 && e1rms[2] > 0 && e1rms[2] < e1rms[1] && e1rms[1] < e1rms[0]) {
      e1rmDeclines++
    }
  }
  if (e1rmDeclines >= 2) {
    reasons.push(`Estimated 1RM declining on ${e1rmDeclines} exercises across recent sessions`)
  }

  // Indicator B: RIR fatigue trend on ≥2 exercises
  const fatigueTrends = detectRirTrends(sets).filter(s => s.direction === 'fatigue')
  if (fatigueTrends.length >= 2) {
    reasons.push(`Effort rising at the same load on ${fatigueTrends.length} exercises`)
  }

  // Indicator C: multiple exercises hitting RIR 0 repeatedly (grinding)
  let grinders = 0
  for (const ex of exercises) {
    const sessions = sessionsForExercise(sets, ex)
    if (sessions.length < 2) continue
    const last2 = sessions.slice(-2)
    const bothZero = last2.every(sess =>
      sess.sets.some(s => s.rir != null && s.rir === 0))
    if (bothZero) grinders++
  }
  if (grinders >= 3) {
    reasons.push(`Training to failure (RIR 0) on ${grinders} exercises across back-to-back sessions`)
  }

  return {
    triggered: reasons.length >= 2,
    indicatorsHit: reasons.length,
    totalChecked: 3,
    reasons,
  }
}

// ─────────────────────────────────────────────────────────────────────
// 3. INTRA-SET FATIGUE PROFILE
// Within the most recent session, compares first-set vs last-set RIR.
// Big drop-off → progress reps before load. Small drop + low RIR → add load.
// ─────────────────────────────────────────────────────────────────────
export interface IntraSetSignal {
  exercise: string
  firstSetRir: number
  lastSetRir: number
  gap: number
  suggestion: 'reps' | 'load' | 'maintain'
  message: string
}

export function analyzeIntraSetFatigue(sets: CoachSet[]): IntraSetSignal[] {
  // Most recent session only
  const allSessions = sets
    .filter(s => s.rir != null && s.reps != null)
    .reduce((acc, s) => { (acc[s.session_id] ??= []).push(s); return acc }, {} as Record<string, CoachSet[]>)

  const sessionIds = Object.entries(allSessions)
    .map(([id, ss]) => ({ id, date: ss[0].completed_at }))
    .sort((a, b) => a.date < b.date ? 1 : -1)
  if (!sessionIds.length) return []

  const latest = allSessions[sessionIds[0].id]
  const byExercise: Record<string, CoachSet[]> = {}
  latest.forEach(s => { (byExercise[s.exercise_name] ??= []).push(s) })

  const signals: IntraSetSignal[] = []
  for (const [ex, exSets] of Object.entries(byExercise)) {
    if (exSets.length < 3) continue  // need enough sets to see drop-off
    const ordered = exSets.sort((a, b) => a.set_number - b.set_number)
    const firstSetRir = ordered[0].rir!
    const lastSetRir  = ordered[ordered.length - 1].rir!
    const gap = firstSetRir - lastSetRir

    if (gap >= 3) {
      signals.push({
        exercise: ex, firstSetRir, lastSetRir, gap, suggestion: 'reps',
        message: `${ex}: big effort drop-off across sets (RIR ${firstSetRir}→${lastSetRir}). Hold the weight and add reps before increasing load.`,
      })
    } else if (gap <= 1 && lastSetRir >= 2) {
      signals.push({
        exercise: ex, firstSetRir, lastSetRir, gap, suggestion: 'load',
        message: `${ex}: strong all the way through (RIR ${firstSetRir}→${lastSetRir}). Ready to add load next session.`,
      })
    }
  }
  return signals
}

// ─────────────────────────────────────────────────────────────────────
// Coaching preferences (which signals are enabled)
// ─────────────────────────────────────────────────────────────────────
export interface CoachPrefs {
  rirTrend: boolean
  deloadAlerts: boolean
  setFatigue: boolean
}
export const DEFAULT_COACH_PREFS: CoachPrefs = {
  rirTrend: true, deloadAlerts: true, setFatigue: true,
}
