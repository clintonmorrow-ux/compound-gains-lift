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
        message: `${ex} is getting harder at the same weight — RIR has dropped ${Math.abs(rirDelta).toFixed(0)} points across ${recent.length} sessions. Your muscles are accumulating fatigue over weeks. Consider a deload or reduce volume on this lift.`,
      })
    } else if (rirDelta >= 1.5) {
      signals.push({
        exercise: ex, direction: 'ready', rirDelta, sessions: recent.length,
        message: `${ex} is feeling easier at the same weight across ${recent.length} sessions — you've adapted. Add load next session.`,
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
    reasons.push(`Same weight requires more effort on ${fatigueTrends.length} exercises across recent sessions — cumulative fatigue building`)
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
// Within the most recent session, looks for genuine fatigue signals —
// ONLY at comparable weights (within 7%). A pyramid set (weight going
// up, RIR dropping) is intentional progressive loading, not fatigue.
//
// Three distinct patterns:
//  a) Genuine fatigue: same weight, RIR drops ≥ 3 across sets
//  b) Load-ready: same weight, RIR barely drops AND stays ≥ 2
//  c) Weight progression: increasing load across sets — report
//     actual weight range + RIR range, no false fatigue signal
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
    if (exSets.length < 3) continue
    const ordered = exSets
      .filter(s => s.weight_lbs != null && s.rir != null)
      .sort((a, b) => a.set_number - b.set_number)
    if (ordered.length < 3) continue

    const weights   = ordered.map(s => s.weight_lbs!)
    const rirs      = ordered.map(s => s.rir!)
    const minW      = Math.min(...weights)
    const maxW      = Math.max(...weights)
    const weightSpread = maxW > 0 ? (maxW - minW) / maxW : 0

    // ── Case A: Weight increased across the session (pyramid / progressive loading)
    // RIR dropping here is INTENTIONAL — heavier sets demand more effort.
    // Report the actual pattern without a false fatigue warning.
    if (weightSpread > 0.07) {
      const firstRir = rirs[0], lastRir = rirs[rirs.length - 1]
      const minW_fmt = Math.round(minW), maxW_fmt = Math.round(maxW)
      // Only surface as a signal if it's genuinely interesting
      // (e.g. they pushed to RIR 0 on the top set — worth noting)
      if (lastRir === 0) {
        signals.push({
          exercise: ex, firstSetRir: firstRir, lastSetRir: lastRir,
          gap: firstRir - lastRir, suggestion: 'maintain',
          message: `${ex}: you pyramided from ${minW_fmt} to ${maxW_fmt} lbs — solid progressive loading. Your top set hit RIR 0. Make sure you're recovering fully before the next session.`,
        })
      }
      // Otherwise weight progression without grinding — no signal needed, pattern is correct
      continue
    }

    // ── Case B: Weight consistent across sets — now check for fatigue
    const firstSetRir = rirs[0]
    const lastSetRir  = rirs[rirs.length - 1]
    const gap = firstSetRir - lastSetRir  // positive = fatigue (RIR falling)
    const avgW = Math.round(weights.reduce((a, b) => a + b, 0) / weights.length)

    if (gap >= 3) {
      // Genuine intra-set fatigue at constant load
      signals.push({
        exercise: ex, firstSetRir, lastSetRir, gap, suggestion: 'reps',
        message: `${ex}: RIR dropped from ${firstSetRir} to ${lastSetRir} across your sets at ~${avgW} lbs. Muscle fatigue is accumulating within the session. Build more capacity here by adding reps per set before increasing load.`,
      })
    } else if (gap <= 1 && lastSetRir >= 2) {
      // Minimal fatigue at consistent load — ready to progress
      signals.push({
        exercise: ex, firstSetRir, lastSetRir, gap, suggestion: 'load',
        message: `${ex}: strong consistency at ~${avgW} lbs — RIR held steady at ${firstSetRir}→${lastSetRir}. Your muscles recovered well between sets. You have capacity to add load next session.`,
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
