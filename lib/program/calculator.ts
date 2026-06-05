import { WEEK_CONFIG } from './data'
import type { ExerciseType, WeekConfig } from '@/types'

/** Round to nearest multiple (mirrors Excel MROUND) */
export function mround(value: number, multiple: number): number {
  if (multiple <= 0) return value
  return Math.round(value / multiple) * multiple
}

/** Calculate prescribed weight for a given exercise in a given week */
export function getTargetWeight(
  oneRm: number,
  exerciseType: ExerciseType,
  weekNumber: number,
  roundTo: number = 5,
  cfgOverride?: WeekConfig,
): number {
  const cfg = cfgOverride ?? WEEK_CONFIG[weekNumber]
  if (!cfg || !oneRm) return 0
  const pct = cfg.percentages[exerciseType]
  return mround(oneRm * pct, roundTo)
}

/** Get set count for an exercise type in a given week */
export function getSetsForWeek(
  exerciseType: ExerciseType,
  weekNumber: number,
  cfgOverride?: WeekConfig,
): number {
  const cfg = cfgOverride ?? WEEK_CONFIG[weekNumber]
  return cfg?.sets[exerciseType] ?? 3
}

/** Get rep range string for an exercise type in a given week */
export function getRepsForWeek(
  exerciseType: ExerciseType,
  weekNumber: number,
  cfgOverride?: WeekConfig,
): string {
  const cfg = cfgOverride ?? WEEK_CONFIG[weekNumber]
  return cfg?.reps[exerciseType] ?? '10–12'
}

/** Format weight for display */
export function formatWeight(weight: number | null, unit: 'lbs' | 'kg' = 'lbs'): string {
  if (weight === null || weight === 0) return '—'
  return `${weight} ${unit}`
}

/** Estimate 1RM from weight and reps (Epley formula) */
export function estimateOneRm(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30))
}
