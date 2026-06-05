export type ExerciseType = 'primary' | 'secondary' | 'isolation'
export type DayType = 'power' | 'hypertrophy' | 'standard'

export type WorkoutKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'R1' | 'R2'
export type ProgramFormat = '4day' | '5day'

export interface Exercise {
  name: string
  muscle: string
  type: ExerciseType
  cue: string
  isBodyweight?: boolean
}

export interface Workout {
  key: WorkoutKey
  name: string
  shortName: string
  day: string
  focus: string
  restTimes: string
  duration?: string
  dayType?: DayType
  isRest?: boolean
  restRationale?: string
  exercises: Exercise[]
}

export interface WeekConfig {
  sets: { primary: number; secondary: number; isolation: number }
  reps: { primary: string; secondary: string; isolation: string }
  rir: number
  phase: string
  isDeload: boolean
  note: string
  percentages: { primary: number; secondary: number; isolation: number }
}

export interface UserOneRm {
  exercise_name: string
  weight_lbs: number
}

export interface UserSettings {
  program_format?: ProgramFormat
  cycle_number?: number
  week_started_at?: string
  active_program_id?: string
  current_week: number
  round_to_lbs: number
}

export interface LoggedSet {
  id?: string
  session_id?: string
  exercise_name: string
  set_number: number
  weight_lbs: number | null
  reps: number | null
  completed_at?: string
  skipped: boolean
}

export interface Session {
  id: string
  user_id: string
  week_number: number
  workout_key: WorkoutKey
  started_at: string
  completed_at: string | null
  notes?: string
}

export interface SessionWithSets extends Session {
  logged_sets: LoggedSet[]
}

// ── Program library ───────────────────────────────────────────────────
export interface ProgramMeta {
  id: string
  name: string
  shortName: string
  author: string
  description: string
  focus: string
  daysPerWeek: number
  totalWeeks: number
  split: string
}

export interface Program extends ProgramMeta {
  workouts: Workout[]
  getWeekConfig(week: number, dayType?: DayType): WeekConfig
}
