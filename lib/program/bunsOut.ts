import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Buns Out — 3-Day Glute Focus
//
// Transcribed from the Biolayne Workout Builder export ("Suns Out Buns
// Out: 3-Day Split"). Structure is constant across all 12 weeks — same
// exercises, same sets, same reps — and ALL progression happens through
// RIR, which tapers in two waves before a volume bump in the final week:
//
//   weeks 1-6   RIR 4 → 1   (half-point steps)
//   weeks 7-11  RIR 3 → 1   (reset, taper again)
//   week 12     one extra set on most lifts, RIR at or near failure
//
// The source prescribes no loads at all, so weight targets are derived
// the same way as PHAT Custom: %1RM from reps-to-failure (reps + RIR).
// As RIR falls week to week at constant reps, the suggested load rises —
// which is exactly the progression the RIR taper is asking for.
// ═══════════════════════════════════════════════════════════════════════

export const BUNS_OUT_ID = 'buns-out-3day'

/** [dayKey][exerciseName] → 12 weekly prescriptions (index 0 = week 1). */
const SCHEDULE: Record<string, Record<string, [number, number, number][]>> = {
  A: {
    'Back Squat': [[3,8,4.0], [3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [4,8,1.0]],
    'Barbell RDL': [[3,8,4.0], [3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [4,8,1.0]],
    'Bulgarian Split Squat': [[3,10,4.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,1.5], [3,10,1.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,1.5], [3,10,1.0], [3,10,1.0]],
    'Barbell Hip Thrust': [[3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,0.5], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,0.5], [4,8,0.5]],
    'Reverse Abductor Machine': [[3,12,3.0], [3,12,2.5], [3,12,2.0], [3,12,1.5], [3,12,1.0], [3,12,0.5], [3,12,2.5], [3,12,2.0], [3,12,1.5], [3,12,1.0], [3,12,0.5], [3,12,0.0]],
    'Prone Leg Curl': [[2,12,3.0], [2,12,2.5], [2,12,2.0], [2,12,1.5], [2,12,1.0], [2,12,0.5], [2,12,2.5], [2,12,2.0], [2,12,1.5], [2,12,1.0], [2,12,0.5], [2,12,0.5]],
  },
  B: {
    'Machine Hip Thrust': [[3,12,3.0], [3,12,2.5], [3,12,2.0], [3,12,1.5], [3,12,1.0], [3,12,0.5], [3,12,2.5], [3,12,2.0], [3,12,1.5], [3,12,1.0], [3,12,0.5], [4,12,0.5]],
    'Neutral Grip Pull-Down': [[3,10,4.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,1.5], [3,10,1.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,1.5], [3,10,1.0], [3,10,1.0]],
    'Incline Dumbbell Press': [[3,10,4.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,2.0], [3,10,2.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,2.0], [3,10,2.0], [3,10,2.0]],
    'Seated Dumbbell Press': [[3,10,4.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,2.0], [3,10,1.0], [3,10,3.0], [3,10,2.5], [3,10,2.0], [3,10,1.5], [3,10,1.0], [3,10,1.0]],
    'Cable Lateral Raise': [[3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,0.0]],
    'EZ-Bar Cable Curl': [[2,10,3.0], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [3,10,0.5]],
    'Rope Press-Down': [[2,10,3.0], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [3,10,0.5]],
    'Rope Abdominal Crunch': [[3,8,3.0], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,0.5], [3,8,2.5], [3,8,2.0], [3,8,1.5], [3,8,1.0], [3,8,0.5], [3,8,0.0]],
  },
  C: {
    'Machine Hip Thrust': [[3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [4,15,0.5]],
    'Machine Glute Kickback': [[3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,0.0]],
    'Machine Leg Extension': [[3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,0.0]],
    'Barbell RDL': [[3,15,4.0], [3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [4,15,1.0]],
    'Standing Calf Raise': [[2,10,3.0], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [2,10,2.5], [2,10,2.0], [2,10,1.5], [2,10,1.0], [2,10,0.5], [3,10,0.5]],
    'Machine Abdominal Crunch': [[3,15,3.0], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,2.5], [3,15,2.0], [3,15,1.5], [3,15,1.0], [3,15,0.5], [3,15,0.0]],
  },
}

const WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Glutes & Legs', shortName: 'Glutes & Legs', day: 'Day 1', focus: 'Glutes · Quads · Hamstrings',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-65 min', restTimes: '2-2.5 min focus lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive knees out' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'primary', cue: 'Push hips back · bar close to the legs · feel the hamstring stretch' },
      { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Rear foot elevated · torso forward slightly for glute bias · deep front-leg stretch' },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Shoulders on the bench · chin tucked · lock the glutes hard at the top' },
      { name: 'Reverse Abductor Machine', muscle: 'Glutes', type: 'isolation', cue: 'Face into the pad · push knees apart · pause at the widest point' },
      { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · plantarflex at peak contraction · full stretch at the bottom' },
    ],
  },
  {
    key: 'B', name: 'Upper & Glutes', shortName: 'Upper & Glutes', day: 'Day 2', focus: 'Glutes · Back · Shoulders · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-65 min', restTimes: '2-2.5 min focus lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Machine Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Fixed path · drive through the heels · squeeze and pause at lockout' },
      { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'primary', cue: 'Neutral grip is shoulder-friendly · full stretch overhead · pull to upper chest' },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'primary', cue: '30-45 degree bench · full stretch at the bottom · elbows about 45 degrees from the body' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout · do not touch the bells at the top' },
      { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Constant tension · lead with the elbow · no momentum' },
      { name: 'EZ-Bar Cable Curl', muscle: 'Biceps', type: 'secondary', cue: 'Cable keeps tension at the bottom · elbows fixed at the sides' },
      { name: 'Rope Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Split the rope at the bottom · elbows pinned to the ribs' },
      { name: 'Rope Abdominal Crunch', muscle: 'Core', type: 'secondary', cue: 'Round the spine down · pull with the abs, not the arms' },
    ],
  },
  {
    key: 'C', name: 'Glute Pump', shortName: 'Glute Pump', day: 'Day 3', focus: 'Glutes · Quads · Hamstrings · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-65 min', restTimes: '2-2.5 min focus lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Machine Hip Thrust', muscle: 'Glutes', type: 'isolation', cue: 'Fixed path · drive through the heels · squeeze and pause at lockout' },
      { name: 'Machine Glute Kickback', muscle: 'Glutes', type: 'isolation', cue: 'Drive the heel back and up · squeeze at full extension · no lower-back arch' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric · high mind-muscle connection' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'isolation', cue: 'Push hips back · bar close to the legs · feel the hamstring stretch' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full dorsiflexion stretch at the bottom · pause at the top' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
]

export function bunsOutWorkouts(_week: number): Workout[] { return WORKOUTS }

export function bunsOutPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const row = SCHEDULE[dayKey]?.[exerciseName]
  if (!row) return null
  const cell = row[Math.max(1, Math.min(12, week)) - 1]
  if (!cell) return null
  const [sets, reps, rir] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir) }
}

export function getBunsOutWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  // Representative values — per-exercise prescriptions always take precedence.
  const rir = bunsOutPrescription('A', 'Back Squat', week)?.rir ?? 3
  const wave = week <= 6 ? 1 : week === 12 ? 3 : 2
  return {
    sets:  { primary: week === 12 ? 4 : 3, secondary: 3, isolation: 3 },
    reps:  { primary: '8', secondary: '10', isolation: '12-15' },
    rir,
    phase: wave === 1 ? `Wave 1 — RIR Taper (week ${week} of 6)`
         : wave === 2 ? `Wave 2 — RIR Taper (week ${week - 6} of 5)`
         : 'Peak Week — Added Volume',
    isDeload: false,
    note: wave === 3
      ? 'Final week: one extra set on most lifts and sets taken to or very near failure. Everything you have built over twelve weeks, expressed.'
      : `Same exercises, same sets and reps as every other week — the progression is effort. Train each set to about ${rir} reps in reserve and add load whenever that RIR feels easy.`,
    percentages: {
      primary:   rtfPercent(8, rir),
      secondary: rtfPercent(10, rir),
      isolation: rtfPercent(14, rir),
    },
  }
}

export const BUNS_OUT_PROGRAM: Program = {
  id:            BUNS_OUT_ID,
  name:          'Buns Out — 3-Day Glute Focus',
  shortName:     'Buns Out',
  author:        'Biolayne Workout Builder',
  description:   'Twelve weeks, three days a week, built around glute development. Day 1 is heavy lower-body work, day 2 pairs hip thrusts with upper-body training, and day 3 is a higher-rep glute and leg pump session. Exercises, sets and reps stay the same all twelve weeks — progression comes entirely from effort, with RIR tapering from 4 down to 1 across two waves before a final week that adds a set and pushes to failure.',
  focus:         'Glutes / Hypertrophy',
  daysPerWeek:   3,
  totalWeeks:    12,
  split:         'Lower / Upper / Lower · Glute Focus',
  workouts:      WORKOUTS,
  getWeekConfig: getBunsOutWeekConfig,
}
