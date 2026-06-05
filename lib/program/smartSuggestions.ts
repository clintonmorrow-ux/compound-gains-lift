import { WEEK_CONFIG } from './data'
import { mround } from './calculator'
import type { ExerciseType, WeekConfig } from '@/types'

export type SuggestionDirection = 'up' | 'down' | 'maintain' | 'new'

export interface SmartSuggestion {
  weight:          number
  direction:       SuggestionDirection
  reason:          string
  estimatedOneRm:  number
  confidence:      'high' | 'medium' | 'low'
}

interface RecentSet {
  weight_lbs: number
  reps:       number
  rir?:       number | null   // included when available; improves e1RM accuracy
}

/**
 * Epley 1RM estimate.
 * When RIR is known, use reps + RIR (= reps to failure) for a true e1RM.
 * Without RIR, logged reps alone underestimate 1RM — e.g. 120 lbs × 12 reps
 * gives e1RM 168 lbs, but if those reps were done at RIR 3 the true e1RM
 * is 120 × (1 + 15/30) = 180 lbs, shifting the prescribed weight from
 * 115 lbs back up to 120 lbs. When RIR is unknown, default to 2 (reasonable
 * assumption for Phase 1 training rather than assuming sets were done to failure).
 */
function epleyOneRm(weight: number, reps: number, rir?: number | null): number {
  const repsToFailure = reps + (rir ?? 2)
  return weight * (1 + repsToFailure / 30)
}

/**
 * Weighted average — more recent sets weighted higher (3×, 2×, 1×)
 */
function weightedAvgOneRm(sets: RecentSet[]): number {
  if (sets.length === 0) return 0
  const weights = sets.map((_, i) => Math.max(sets.length - i, 1))
  const total   = weights.reduce((a, b) => a + b, 0)
  const sum     = sets.reduce((acc, s, i) => acc + epleyOneRm(s.weight_lbs, s.reps, s.rir) * weights[i], 0)
  return sum / total
}

/**
 * SMART WEIGHT SUGGESTION ENGINE
 *
 * Based on:
 * - Galpin: track RIR drift over consecutive sessions. If actual performance
 *   consistently deviates from prescribed RIR, adjust load to re-anchor.
 * - Norton (Double Progression): once an athlete completes ALL sets at the
 *   top of the rep range for the prescribed RIR, it is time to increase load.
 *   Conversely, if they cannot hit the bottom of the rep range, reduce load.
 *
 * Algorithm:
 * 1. Estimate current 1RM from recent logged sets (Epley formula, weighted).
 * 2. Compare to the user's declared 1RM to detect performance drift.
 * 3. Apply Norton's rep-completion signal from the most recent session.
 * 4. Produce a suggested weight for the upcoming week's prescription.
 */
export function calculateSmartSuggestion(
  recentSets:   RecentSet[],     // most recent first, all sets for this exercise
  exerciseType: ExerciseType,
  weekNumber:   number,
  userOneRm:    number,          // from 1RM Calculator page (0 if not set)
  roundTo:      number = 5,
  cfgOverride?: WeekConfig,
): SmartSuggestion | null {

  // Need at least 3 logged sets to produce a reliable suggestion
  if (recentSets.length < 3) return null

  const cfg         = cfgOverride ?? WEEK_CONFIG[weekNumber]
  if (!cfg) return null

  const repsStr     = cfg.reps[exerciseType]            // e.g. "10–12"
  const [minReps, maxReps] = repsStr.replace('–','-').split('-').map(Number)
  const targetRir   = cfg.rir
  const pct         = cfg.percentages[exerciseType]

  // ── Step 1: Estimate current 1RM from recent performance ──────────
  const avgEstimate = weightedAvgOneRm(recentSets)
  const baseline    = userOneRm > 0 ? userOneRm : avgEstimate

  // ── Step 2: Detect performance drift vs declared 1RM ──────────────
  const ratio = avgEstimate / baseline   // > 1 = stronger than baseline
  let adjustedOneRm = baseline
  let direction: SuggestionDirection = 'maintain'
  let reason = ''
  let confidence: 'high' | 'medium' | 'low' = recentSets.length >= 6 ? 'high' : 'medium'

  if (ratio > 1.05) {
    // Performing meaningfully above declared 1RM → Galpin: re-anchor load
    adjustedOneRm = avgEstimate
    direction     = 'up'
    reason        = `Your recent sets estimate a 1RM of ~${Math.round(avgEstimate)} lbs — higher than your logged baseline. Weight increased to match.`
  } else if (ratio < 0.93) {
    // Performing below baseline → Galpin: fatigue or over-estimated 1RM
    adjustedOneRm = avgEstimate
    direction     = 'down'
    confidence    = 'medium'
    reason        = `Recent performance estimates a 1RM of ~${Math.round(avgEstimate)} lbs — below your baseline. Weight reduced to restore target RIR.`
  } else {
    adjustedOneRm = baseline
    direction     = 'maintain'
    reason        = `Performance is tracking with your logged 1RM. Staying the course.`
  }

  // ── Step 3: Norton double-progression signal ──────────────────────
  // Use the most recent full session's sets (up to 5 most recent sets)
  const lastSession = recentSets.slice(0, Math.min(5, cfg.sets[exerciseType]))
  if (lastSession.length > 0) {
    const avgReps    = lastSession.reduce((a, s) => a + s.reps, 0) / lastSession.length
    const avgWeight  = lastSession.reduce((a, s) => a + s.weight_lbs, 0) / lastSession.length
    const prescWt    = mround(adjustedOneRm * pct, roundTo)

    if (avgReps >= maxReps && Math.abs(avgWeight - prescWt) / prescWt < 0.08) {
      // Hit top of rep range at prescribed weight → Norton: increase load
      adjustedOneRm  = adjustedOneRm * 1.025   // ~2.5% progressive overload
      direction      = 'up'
      reason         = `You hit ${maxReps} reps (top of range) last session — progressive overload applied (+2.5% to 1RM estimate).`
      confidence     = 'high'
    } else if (avgReps < minReps && Math.abs(avgWeight - prescWt) / prescWt < 0.08) {
      // Couldn't reach min reps at prescribed weight → Norton: reduce load
      // Recalculate 1RM from what they actually achieved
      const actualEst = weightedAvgOneRm(lastSession)
      adjustedOneRm   = actualEst * 0.98    // small additional buffer
      direction       = 'down'
      reason          = `Last session averaged ${Math.round(avgReps)} reps — below the ${minReps}-rep minimum. Weight recalibrated from actual performance.`
      confidence      = 'high'
    }
  }

  // ── Step 4: Produce suggestion ────────────────────────────────────
  const suggested = mround(adjustedOneRm * pct, roundTo)

  // Sanity check — don't suggest something ridiculous
  if (suggested <= 0 || !isFinite(suggested)) return null

  return {
    weight:         suggested,
    direction,
    reason,
    estimatedOneRm: Math.round(adjustedOneRm),
    confidence,
  }
}
