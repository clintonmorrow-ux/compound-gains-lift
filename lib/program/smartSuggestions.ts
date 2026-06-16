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
 * Source of truth = your LOGGED SETS, not a manually entered number.
 * - Estimate current 1RM directly from recent logged performance
 *   (RIR-aware Epley, recency-weighted). The declared 1RM is only a seed
 *   used before enough sets exist.
 * - Norton (Double Progression): if you cleared the top of the rep range at
 *   the prescribed weight, step the load up; if you came in under the rep
 *   minimum, recalibrate down to that actual performance.
 *
 * Because the prescription is tied directly to your logged 1RM, it tracks
 * your real strength automatically — there is no separate "baseline" for it
 * to drift away from, so the coaching language always reflects your own data.
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

  // ── Source of truth: your 1RM DERIVED FROM LOGGED SETS ─────────────
  // We estimate your current 1RM directly from what you've actually lifted
  // (RIR-aware Epley, recency-weighted) rather than trusting a manually
  // entered number. The declared 1RM is used only as a seed if the logged
  // estimate is somehow unavailable.
  const loggedOneRm = weightedAvgOneRm(recentSets)
  let workingOneRm  = loggedOneRm > 0 ? loggedOneRm : userOneRm
  let direction: SuggestionDirection = 'maintain'
  let reason     = `Based on your logged sets, your estimated 1RM is ~${Math.round(workingOneRm)} lbs — weight set to match.`
  let confidence: 'high' | 'medium' | 'low' = recentSets.length >= 6 ? 'high' : 'medium'

  // ── Norton double-progression from your most recent session ────────
  // The prescribed weight already tracks your logged 1RM; Norton adds the
  // deliberate push (you cleared the top of the range) or pullback (you
  // came in under the rep target) on top of it.
  const lastSession = recentSets.slice(0, Math.min(5, cfg.sets[exerciseType]))
  if (lastSession.length > 0) {
    const avgReps    = lastSession.reduce((a, s) => a + s.reps, 0) / lastSession.length
    const avgWeight  = lastSession.reduce((a, s) => a + s.weight_lbs, 0) / lastSession.length
    const prescWt    = mround(workingOneRm * pct, roundTo)

    if (avgReps >= maxReps && Math.abs(avgWeight - prescWt) / prescWt < 0.08) {
      // Cleared the top of the rep range at the prescribed weight → progress
      workingOneRm = workingOneRm * 1.025   // ~2.5% progressive overload
      direction    = 'up'
      reason       = `You hit ${maxReps} reps (top of range) last session — your logged 1RM is now ~${Math.round(workingOneRm)} lbs, so the load steps up.`
      confidence   = 'high'
    } else if (avgReps < minReps && Math.abs(avgWeight - prescWt) / prescWt < 0.08) {
      // Came in under the rep minimum → recalibrate to that actual performance
      workingOneRm = weightedAvgOneRm(lastSession)
      direction    = 'down'
      reason       = `Last session averaged ${Math.round(avgReps)} reps — under the ${minReps}-rep target — so your logged 1RM recalibrates to ~${Math.round(workingOneRm)} lbs from that performance.`
      confidence   = 'high'
    }
  }

  // ── Produce suggestion ─────────────────────────────────────────────
  const suggested = mround(workingOneRm * pct, roundTo)

  // Sanity check — don't suggest something ridiculous
  if (suggested <= 0 || !isFinite(suggested)) return null

  return {
    weight:         suggested,
    direction,
    reason,
    estimatedOneRm: Math.round(workingOneRm),
    confidence,
  }
}
