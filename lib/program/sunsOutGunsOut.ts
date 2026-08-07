import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Suns Out Guns Out — 5-Day Split
//
// Transcribed from the Biolayne Workout Builder export (workout 320894),
// 12 weeks in two 6-week blocks. The exercise list is identical in both
// blocks and every week — progression comes from RIR tapering and sets
// being added, with the last week of each block pushing several
// accessories to failure.
//
// The source prescribes no loads and no rest intervals, so weight
// targets use the same reps-to-failure model as the other imported
// programs (%1RM from reps + RIR), and rest follows a hypertrophy
// profile. Both are the app's interpretation, not the source's.
// ═══════════════════════════════════════════════════════════════════════

export const SUNS_OUT_ID = 'suns-out-guns-out-5day'

/** [dayKey][exerciseName] → 12 weekly prescriptions (index 0 = week 1). */
const SCHEDULE: Record<string, Record<string, [number, number, number][]>> = {
  A: {
    'Bench Press': [[3,6,4], [3,6,3], [3,6,2.5], [3,6,2], [3,6,1.5], [4,6,1.5], [3,6,2], [3,6,1.5], [4,6,1.5], [4,6,1], [4,6,0.5], [5,6,0.5]],
    'Neutral Grip Pull-Down': [[2,8,4], [2,8,3], [2,8,2.5], [2,8,2], [2,8,1.5], [2,8,1.5], [2,8,2.5], [2,8,2], [3,8,2], [3,8,2], [3,8,2], [3,8,1.5]],
    'Cable Row': [[2,8,4], [2,8,3], [2,8,2.5], [2,8,2], [2,8,1.5], [2,8,1.5], [2,8,2.5], [2,8,2], [2,8,2], [2,8,2], [3,8,2], [3,8,1.5]],
    'Seated Dumbbell Press': [[3,8,4], [3,8,3], [3,8,2.5], [3,8,2], [3,8,1.5], [3,8,1.5], [3,8,2], [3,8,1.5], [3,8,1], [4,8,1], [4,8,0.5], [5,8,0.5]],
    'Rope Abdominal Crunch': [[2,10,3], [2,10,2], [2,10,1.5], [2,10,1], [2,10,0.5], [2,10,0.5], [2,10,1.5], [2,10,1], [3,10,1], [4,10,1], [4,10,0.5], [4,10,0.5]],
    'Machine Preacher Curl': [[3,12,3], [3,12,2], [3,12,1.5], [3,12,1], [3,12,0.5], [4,12,0.5], [3,12,1.5], [3,12,1], [4,8,1], [4,8,0.5], [4,8,0], [4,8,0]],
    'Rope Press-Down': [[3,12,3], [3,12,2], [3,12,1.5], [3,12,1], [3,12,0.5], [4,12,0.5], [3,12,1.5], [3,12,1], [4,8,1], [4,8,0.5], [4,8,0], [4,8,0]],
  },
  B: {
    'Back Squat': [[2,6,4], [2,6,3], [2,6,2.5], [2,6,2], [2,6,1.5], [2,6,1], [2,6,2.5], [2,6,2], [3,6,2], [3,6,2], [3,6,1.5], [3,6,1.5]],
    'Barbell RDL': [[2,6,4], [2,6,3], [2,6,2.5], [2,6,2], [2,6,1.5], [2,6,1], [2,6,2.5], [2,6,2], [3,6,2], [3,6,2], [3,6,1.5], [3,6,1.5]],
    'Barbell Hip Thrust': [[2,8,3], [2,8,2], [2,8,1.5], [2,8,1], [2,8,0.5], [2,8,0.5], [2,8,1.5], [2,8,1], [2,8,1], [2,8,1], [3,8,1], [3,8,0.5]],
    'Machine Leg Extension': [[2,12,3], [2,12,2], [2,12,1.5], [2,12,1], [2,12,0.5], [2,12,0.5], [2,12,1.5], [2,12,1], [2,12,0.5], [3,12,0.5], [3,12,0.5], [3,12,0]],
    'Prone Leg Curl': [[2,12,3], [2,12,2], [2,12,1.5], [2,12,1], [2,12,0.5], [2,12,0.5], [2,12,1.5], [2,12,1], [2,12,0.5], [3,12,0.5], [3,12,0.5], [3,12,0]],
    'Standing Calf Raise': [[2,10,3], [2,10,2], [2,10,1.5], [2,10,1], [2,10,0.5], [2,10,0.5], [2,10,2], [2,10,1.5], [2,10,1], [3,10,1], [3,10,0.5], [3,10,0]],
  },
  C: {
    'Incline Dumbbell Press': [[3,10,4], [3,10,3], [3,10,2.5], [3,10,2], [3,10,1.5], [3,10,1], [3,10,2], [3,10,1.5], [4,10,1.5], [4,10,1], [4,10,0.5], [4,10,0.5]],
    'Pec Deck Machine': [[3,15,3], [3,15,2], [3,15,1.5], [3,15,1], [3,15,0.5], [4,15,0.5], [3,15,1.5], [3,15,1], [3,15,0.5], [4,15,0.5], [4,15,0], [5,15,0]],
    'Tall Kneeling Landmine Shoulder Press': [[3,10,4], [3,10,3], [3,10,2.5], [3,10,2], [3,10,1.5], [4,10,1], [3,10,2], [3,10,1.5], [3,10,1.5], [3,10,1], [3,10,0.5], [4,10,0.5]],
    'Cable Lateral Raise': [[4,15,3], [4,15,2], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0.5], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0.5], [4,15,0], [4,15,0]],
    'Machine Preacher Curl': [[4,12,3], [4,12,2], [4,12,1.5], [4,12,1], [4,12,0.5], [4,12,0], [4,12,1.5], [4,12,1], [4,12,0.5], [5,12,0.5], [5,12,0], [5,12,0]],
    'Overhead Rope Cable Extensions': [[4,12,3], [4,12,2], [4,12,1.5], [4,12,1], [4,12,0.5], [4,12,0], [4,12,1.5], [4,12,1], [4,12,0.5], [5,12,0.5], [5,12,0], [5,12,0]],
    'Machine Abdominal Crunch': [[3,15,3], [3,15,2], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0], [3,15,1.5], [3,15,1], [3,15,0.5], [4,15,0.5], [4,15,0], [4,15,0]],
  },
  D: {
    'Hack Squat': [[3,12,4], [3,12,3], [3,12,2.5], [3,12,2], [3,12,1.5], [3,12,1], [3,12,2.5], [3,12,2], [3,12,2], [3,12,2], [3,12,1.5], [3,12,1.5]],
    'Bulgarian Split Squat': [[3,15,4], [3,15,3], [3,15,2.5], [3,15,2], [3,15,1.5], [3,15,1], [3,15,2.5], [3,15,2], [3,15,2], [3,15,2], [3,15,1.5], [3,15,1.5]],
    'Barbell Hip Thrust': [[3,12,4], [3,12,3], [3,12,2.5], [3,12,2], [3,12,1.5], [3,12,1], [3,12,2.5], [3,12,2], [3,12,2], [3,12,2], [3,12,1.5], [3,12,1.5]],
    'Machine Leg Extension': [[3,15,3], [3,15,2], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,0.5], [3,15,0]],
    'Seated Leg Curl': [[3,15,3], [3,15,2], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,0.5], [3,15,0]],
    'Seated Calf Raise': [[3,15,3], [3,15,2], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,1.5], [3,15,1], [3,15,0.5], [3,15,0.5], [3,15,0.5], [3,15,0]],
  },
  E: {
    'Flat Dumbbell Press': [[3,15,4], [3,15,3], [3,15,2.5], [3,15,2], [3,15,1.5], [3,15,1], [3,15,2], [3,15,1.5], [3,15,1], [4,15,1], [4,15,0.5], [4,15,0.5]],
    'Flat Cable Fly': [[3,20,3], [3,20,2], [3,20,1.5], [3,20,1], [3,20,0.5], [4,20,0.5], [3,20,1.5], [3,20,1], [3,20,0.5], [3,20,0.5], [3,20,0], [4,20,0]],
    'Two Arm Braced Dumbbell Row': [[2,15,4], [2,15,3], [2,15,2.5], [2,15,2], [2,15,1.5], [2,15,1.5], [2,15,2.5], [2,15,2], [3,15,2], [3,15,2], [3,15,2], [3,15,1.5]],
    'Neutral Grip Pull-Down': [[2,15,4], [2,15,3], [2,15,2.5], [2,15,2], [2,15,1.5], [2,15,1.5], [2,15,2.5], [2,15,2], [2,15,2], [2,15,2], [3,15,2], [3,15,1.5]],
    'Smith Machine Shoulder Press': [[3,15,4], [3,15,3], [3,15,2.5], [3,15,2], [3,15,1.5], [3,15,1.5], [3,15,2], [3,15,1.5], [3,15,1], [4,15,1], [4,15,0.5], [4,15,0]],
    'Machine Lateral Raise': [[3,20,3], [3,20,2], [3,20,1.5], [3,20,1], [3,20,0.5], [4,20,0.5], [3,20,1.5], [3,20,1], [3,20,0.5], [3,20,0.5], [3,20,0], [4,20,0]],
    'Machine Curl': [[4,15,3], [4,15,2], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0.5], [4,15,0], [4,15,0]],
    'V-Bar Cable Press-Down': [[4,15,3], [4,15,2], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0], [4,15,1.5], [4,15,1], [4,15,0.5], [4,15,0.5], [4,15,0], [4,15,0]],
  },
}

const WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Upper — Press & Pull', shortName: 'Upper — Press & Pull', day: 'Day 1', focus: 'Chest · Back · Shoulders · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-70 min', restTimes: '2-2.5 min compounds · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Retract scapula · controlled descent · drive the feet' },
      { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Neutral grip is shoulder-friendly · full stretch overhead · pull to the upper chest' },
      { name: 'Cable Row', muscle: 'Back', type: 'secondary', cue: 'Tall spine · drive the elbows back · squeeze the mid-back' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout · do not touch the bells at the top' },
      { name: 'Rope Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Round the spine down · pull with the abs, not the arms' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · full extension at the bottom' },
      { name: 'Rope Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Split the rope at the bottom · elbows pinned to the ribs' },
    ],
  },
  {
    key: 'B', name: 'Lower — Squat & Hinge', shortName: 'Lower — Squat & Hinge', day: 'Day 2', focus: 'Quads · Hamstrings · Glutes · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-70 min', restTimes: '2-2.5 min compounds · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive the knees out' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'primary', cue: 'Push the hips back · bar close · feel the hamstring stretch' },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Shoulders on the bench · chin tucked · lock the glutes at the top' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · plantarflex at peak contraction' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Full dorsiflexion stretch at the bottom · pause at the top' },
    ],
  },
  {
    key: 'C', name: 'Chest & Shoulders', shortName: 'Chest & Shoulders', day: 'Day 3', focus: 'Chest · Shoulders · Side Delts · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-70 min', restTimes: '2-2.5 min compounds · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'primary', cue: '30-45 degree bench · full stretch at the bottom' },
      { name: 'Pec Deck Machine', muscle: 'Chest', type: 'secondary', cue: 'Elbows on the pads · squeeze · easy to push close to failure' },
      { name: 'Tall Kneeling Landmine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Tall kneeling kills momentum · press up and slightly across' },
      { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Constant tension · lead with the elbow · no momentum' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · full extension at the bottom' },
      { name: 'Overhead Rope Cable Extensions', muscle: 'Triceps', type: 'isolation', cue: 'Rope behind the head · long-head stretch under load' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
  {
    key: 'D', name: 'Lower — Quads & Glutes', shortName: 'Lower — Quads & Glutes', day: 'Day 4', focus: 'Quads · Glutes · Hamstrings · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-70 min', restTimes: '2-2.5 min compounds · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Hack Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
      { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Rear foot elevated · deep front-leg stretch' },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Shoulders on the bench · chin tucked · lock the glutes at the top' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Hamstrings at length — superior growth stimulus' },
      { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Knee bent targets the soleus · full stretch' },
    ],
  },
  {
    key: 'E', name: 'Upper — Volume', shortName: 'Upper — Volume', day: 'Day 5', focus: 'Chest · Back · Shoulders · Arms',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-70 min', restTimes: '2-2.5 min compounds · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'primary', cue: 'Deep stretch at the bottom · stabilise the bells' },
      { name: 'Flat Cable Fly', muscle: 'Chest', type: 'isolation', cue: 'Wide arc · pause at full stretch' },
      { name: 'Two Arm Braced Dumbbell Row', muscle: 'Back', type: 'secondary', cue: 'Chest braced against the bench · zero body english · pure lat drive' },
      { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Neutral grip is shoulder-friendly · full stretch overhead · pull to the upper chest' },
      { name: 'Smith Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Fixed bar path · press to lockout without balance demand' },
      { name: 'Machine Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Supported · smooth arc to shoulder height' },
      { name: 'Machine Curl', muscle: 'Biceps', type: 'isolation', cue: 'Fixed path · strict peak contraction' },
      { name: 'V-Bar Cable Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'V-bar keeps the wrists neutral · full lockout · elbows pinned' },
    ],
  },
]

export function sunsOutWorkouts(_week: number): Workout[] { return WORKOUTS }

export function sunsOutPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const row = SCHEDULE[dayKey]?.[exerciseName]
  if (!row) return null
  const cell = row[Math.max(1, Math.min(12, week)) - 1]
  if (!cell) return null
  const [sets, reps, rir] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir) }
}

export function getSunsOutWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const rx    = sunsOutPrescription('A', 'Bench Press', week)
  const rir   = rx?.rir ?? 3
  const block = week <= 6 ? 1 : 2
  const wIn   = week <= 6 ? week : week - 6
  return {
    sets:  { primary: rx?.sets ?? 3, secondary: 3, isolation: 3 },
    reps:  { primary: '6', secondary: '8-10', isolation: '12-15' },
    rir,
    phase: `Block ${block} — RIR Taper (week ${wIn} of 6)`,
    isDeload: false,
    note: `Same exercises every week — the progression is effort and volume. Train to about ${rir} reps in reserve; where the prescription reads RIR 0 the set is meant to be taken to failure.`,
    percentages: {
      primary:   rtfPercent(6, rir),
      secondary: rtfPercent(9, rir),
      isolation: rtfPercent(13, rir),
    },
  }
}

export const SUNS_OUT_PROGRAM: Program = {
  id:            SUNS_OUT_ID,
  name:          'Suns Out Guns Out — 5-Day',
  shortName:     'Suns Out Guns Out',
  author:        'Biolayne Workout Builder',
  description:   'Twelve weeks across two six-week blocks on an upper/lower/upper/lower/upper split, with arms and delts hit on three of the five days. Exercises stay the same throughout — progression comes from RIR tapering down through each block and sets being added along the way, with several accessories taken to failure in the final week of each block.',
  focus:         'Hypertrophy · Arms & Delts',
  daysPerWeek:   5,
  totalWeeks:    12,
  split:         'Upper / Lower · 5-Day',
  workouts:      WORKOUTS,
  getWeekConfig: getSunsOutWeekConfig,
}
