import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { WORKOUTS_5DAY, WEEK_CONFIG, CURRENT_PROGRAM_ID } from './data'
import { PHAT_PROGRAM, getPHATWeekConfig } from './phat'
import { SCULPT_PROGRAM } from './womensToning'
import { PHAT_CUSTOM_PROGRAM, PHAT_CUSTOM_ID, phatCustomWorkouts, phatCustomPrescription, type Prescription } from './phatCustom'

// ── Galpin 5-Day — wrap existing data into Program interface ──────────────────
const GALPIN_PROGRAM: Program = {
  id:           CURRENT_PROGRAM_ID,
  name:         'Galpin 5-Day Hypertrophy',
  shortName:    '5-Day Hypertrophy',
  author:       'Dr. Andy Galpin / Norton Methodology',
  description:  '12-week periodized hypertrophy block built on Galpin and Schoenfeld principles. Three phases (Accumulation → Intensification → Peak) with deloads at weeks 4, 8 and 12. MAV-compliant volume for all muscle groups across a 5-day Push/Pull/Legs split.',
  focus:        'Hypertrophy',
  daysPerWeek:  5,
  totalWeeks:   12,
  split:        'Push / Pull / Legs',
  workouts:     WORKOUTS_5DAY,
  getWeekConfig: (week: number, _dayType?: DayType): WeekConfig => WEEK_CONFIG[week] ?? WEEK_CONFIG[1],
}

// ── Registry — add any future programs here ───────────────────────────────────
export const PROGRAM_LIBRARY: Program[] = [
  GALPIN_PROGRAM,
  PHAT_PROGRAM,
  PHAT_CUSTOM_PROGRAM,
  SCULPT_PROGRAM,
]

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getProgram(id?: string): Program {
  return PROGRAM_LIBRARY.find(p => p.id === id) ?? GALPIN_PROGRAM
}

export function getWeekConfig(programId: string | undefined, week: number, dayType?: DayType): WeekConfig {
  return getProgram(programId).getWeekConfig(week, dayType)
}


// ── Per-exercise scheduling ───────────────────────────────────────────
// Most programs prescribe by exercise TYPE (primary/secondary/isolation)
// via getWeekConfig. Some — currently PHAT Custom — prescribe per
// exercise, per day, per week, and swap exercises between blocks. These
// two helpers give callers one path that works for both models.

/** The day's exercise list for a given week (handles block substitutions). */
export function getWeekWorkouts(programId: string | undefined, week: number): Workout[] {
  if (programId === PHAT_CUSTOM_ID) return phatCustomWorkouts(week)
  return getProgram(programId).workouts
}

/** Exact per-exercise prescription, or null if the program prescribes by type. */
export function getPrescription(
  programId: string | undefined, dayKey: string, exerciseName: string, week: number,
): Prescription | null {
  if (programId === PHAT_CUSTOM_ID) return phatCustomPrescription(dayKey, exerciseName, week)
  return null
}
