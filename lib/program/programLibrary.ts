import type { Program, WeekConfig, DayType } from '@/types'
import { WORKOUTS_5DAY, WEEK_CONFIG, CURRENT_PROGRAM_ID } from './data'
import { PHAT_PROGRAM, getPHATWeekConfig } from './phat'
import { RP_PROGRAM } from './rpHypertrophy'
import { SCULPT_PROGRAM } from './womensToning'
import { VITALITY_PROGRAM } from './seniors'
import { LONGEVITY_PROGRAM } from './longevity'

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
  RP_PROGRAM,
  SCULPT_PROGRAM,
  VITALITY_PROGRAM,
  LONGEVITY_PROGRAM,
]

// ── Helpers ───────────────────────────────────────────────────────────────────
export function getProgram(id?: string): Program {
  return PROGRAM_LIBRARY.find(p => p.id === id) ?? GALPIN_PROGRAM
}

export function getWeekConfig(programId: string | undefined, week: number, dayType?: DayType): WeekConfig {
  return getProgram(programId).getWeekConfig(week, dayType)
}
