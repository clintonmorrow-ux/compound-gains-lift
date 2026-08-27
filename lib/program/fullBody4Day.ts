import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Foundational Strength: 4-Day Full Body
//
// Transcribed from the twelve weekly Workout Builder exports (workout
// 321711). Those files arrived as page-image archives rather than text
// PDFs, so the day boundaries were recovered from the exercise ORDER
// index resetting to 1 — the printed "Day N" headings float relative to
// the content when the text layer is extracted, and following them would
// have mis-assigned the exercises that carry over a page break.
//
// Structure is fixed across all twelve weeks: 31 movements, 33 slots,
// alternating lower and upper days (7 / 9 / 8 / 9). Nothing rotates.
//
// All progression is effort, in two waves plus a final volume bump:
//   weeks 1-6   RIR 4 down to 1.5
//   weeks 7-11  reset to 2.5, taper to 1
//   week  12    a fourth set added across the board
//
// Source gives no loads and no rest intervals; %1RM uses the
// reps-to-failure model and rest follows a strength-leaning profile.
// ═══════════════════════════════════════════════════════════════════════

export const FULL_BODY_4DAY_ID = 'full-body-4day'

/** [dayKey][exercise][week] -> [sets, reps, rir, repsLabel]. */
const SCHEDULE: Record<string, Record<string, Record<number, [number, number, number, string]>>> = {
  A: {
    'Back Squat': { 1:[3,5,4,'5'], 2:[3,5,3,'5'], 3:[3,5,2.5,'5'], 4:[3,5,2,'5'], 5:[3,5,1.5,'5'], 6:[3,5,1.5,'5'], 7:[3,5,2.5,'5'], 8:[3,5,2,'5'], 9:[3,5,1.5,'5'], 10:[3,5,1,'5'], 11:[3,5,1,'5'], 12:[4,5,1,'5'] },
    'Hack Squat': { 1:[2,8,4,'8'], 2:[2,8,3,'8'], 3:[2,8,2.5,'8'], 4:[2,8,2,'8'], 5:[2,8,1.5,'8'], 6:[3,8,1.5,'8'], 7:[2,8,2.5,'8'], 8:[2,8,2,'8'], 9:[2,8,1.5,'8'], 10:[2,8,1,'8'], 11:[3,8,1,'8'], 12:[3,8,1,'8'] },
    'Barbell RDL': { 1:[3,10,4,'10'], 2:[3,10,3,'10'], 3:[3,10,2.5,'10'], 4:[3,10,2,'10'], 5:[3,10,1.5,'10'], 6:[3,10,1.5,'10'], 7:[3,10,2.5,'10'], 8:[3,10,2,'10'], 9:[3,10,1.5,'10'], 10:[3,10,1,'10'], 11:[3,10,1,'10'], 12:[4,10,1,'10'] },
    'Barbell Hip Thrust': { 1:[3,6,3,'6'], 2:[3,6,2.5,'6'], 3:[3,6,2,'6'], 4:[3,6,1.5,'6'], 5:[3,6,1,'6'], 6:[3,6,1,'6'], 7:[3,6,2,'6'], 8:[3,6,1.5,'6'], 9:[3,6,1,'6'], 10:[3,6,0.5,'6'], 11:[3,6,0.5,'6'], 12:[3,6,0,'6'] },
    'Machine Leg Extension': { 1:[2,12,3,'12'], 2:[2,12,2.5,'12'], 3:[2,12,2,'12'], 4:[2,12,1.5,'12'], 5:[2,12,1,'12'], 6:[3,12,1,'12'], 7:[2,12,2,'12'], 8:[2,12,1.5,'12'], 9:[2,12,1,'12'], 10:[2,12,0.5,'12'], 11:[3,12,0.5,'12'], 12:[3,12,0,'12'] },
    'Prone Leg Curl': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Standing Calf Raise': { 1:[3,8,3,'8'], 2:[3,8,2.5,'8'], 3:[3,8,2,'8'], 4:[3,8,1.5,'8'], 5:[3,8,1,'8'], 6:[3,8,1,'8'], 7:[3,8,2,'8'], 8:[3,8,1.5,'8'], 9:[3,8,1,'8'], 10:[3,8,0.5,'8'], 11:[3,8,0.5,'8'], 12:[3,8,0,'8'] },
  },
  B: {
    'Bench Press': { 1:[3,5,4,'5'], 2:[3,5,3,'5'], 3:[3,5,2.5,'5'], 4:[3,5,2,'5'], 5:[3,5,1.5,'5'], 6:[3,5,1.5,'5'], 7:[3,5,2.5,'5'], 8:[3,5,2,'5'], 9:[3,5,1.5,'5'], 10:[3,5,1,'5'], 11:[3,5,1,'5'], 12:[4,5,1,'5'] },
    'Pec Deck Machine': { 1:[2,10,3,'10'], 2:[2,10,2.5,'10'], 3:[2,10,2,'10'], 4:[2,10,1.5,'10'], 5:[2,10,1,'10'], 6:[3,10,1,'10'], 7:[2,10,2,'10'], 8:[2,10,1.5,'10'], 9:[2,10,1,'10'], 10:[2,10,0.5,'10'], 11:[3,10,0.5,'10'], 12:[3,10,3,'10'] },
    'Neutral Grip Pull-Down': { 1:[3,8,4,'8'], 2:[3,8,3,'8'], 3:[3,8,2.5,'8'], 4:[3,8,2,'8'], 5:[3,8,1.5,'8'], 6:[3,8,1.5,'8'], 7:[3,8,2.5,'8'], 8:[3,8,2,'8'], 9:[3,8,1.5,'8'], 10:[3,8,1,'8'], 11:[3,8,1,'8'], 12:[4,8,1,'8'] },
    'Cable Row': { 1:[2,12,4,'12'], 2:[2,12,3,'12'], 3:[2,12,2.5,'12'], 4:[2,12,2,'12'], 5:[2,12,1.5,'12'], 6:[3,12,1.5,'12'], 7:[2,12,2.5,'12'], 8:[2,12,2,'12'], 9:[2,12,1.5,'12'], 10:[2,12,1,'12'], 11:[3,12,1,'12'], 12:[4,12,0,'12'] },
    'Seated Dumbbell Press': { 1:[3,8,4,'8'], 2:[3,8,3,'8'], 3:[3,8,2.5,'8'], 4:[3,8,2,'8'], 5:[3,8,1.5,'8'], 6:[3,8,1.5,'8'], 7:[3,8,2.5,'8'], 8:[3,8,2,'8'], 9:[3,8,1.5,'8'], 10:[3,8,1,'8'], 11:[3,8,1,'8'], 12:[3,8,1,'8'] },
    'Cable Lateral Raise': { 1:[2,12,3,'12'], 2:[2,12,2.5,'12'], 3:[2,12,2,'12'], 4:[2,12,1.5,'12'], 5:[2,12,1,'12'], 6:[3,12,1,'12'], 7:[2,12,2,'12'], 8:[2,12,1.5,'12'], 9:[2,12,1,'12'], 10:[2,12,0.5,'12'], 11:[3,12,0.5,'12'], 12:[3,12,0,'12'] },
    'EZ-Bar Cable Curl': { 1:[3,8,3,'8'], 2:[3,8,2.5,'8'], 3:[3,8,2,'8'], 4:[3,8,1.5,'8'], 5:[3,8,1,'8'], 6:[3,8,1,'8'], 7:[3,8,2,'8'], 8:[3,8,1.5,'8'], 9:[3,8,1,'8'], 10:[3,8,0.5,'8'], 11:[3,8,0.5,'8'], 12:[3,8,0,'8'] },
    'Overhead Rope Cable Extensions': { 1:[3,8,3,'8'], 2:[3,8,2.5,'8'], 3:[3,8,2,'8'], 4:[3,8,1.5,'8'], 5:[3,8,1,'8'], 6:[3,8,1,'8'], 7:[3,8,2,'8'], 8:[3,8,1.5,'8'], 9:[3,8,1,'8'], 10:[3,8,0.5,'8'], 11:[3,8,0.5,'8'], 12:[3,8,0,'8'] },
    'Straight Bar Cable Crunch': { 1:[3,8,3,'8'], 2:[3,8,2.5,'8'], 3:[3,8,2,'8'], 4:[3,8,1.5,'8'], 5:[3,8,1,'8'], 6:[3,8,1,'8'], 7:[3,8,2,'8'], 8:[3,8,1.5,'8'], 9:[3,8,1,'8'], 10:[3,8,0.5,'8'], 11:[3,8,0.5,'8'], 12:[3,8,0,'8'] },
  },
  C: {
    'Hack Squat': { 1:[3,10,4,'10'], 2:[3,10,3,'10'], 3:[3,10,2.5,'10'], 4:[3,10,2,'10'], 5:[3,10,1.5,'10'], 6:[3,10,1.5,'10'], 7:[3,10,2.5,'10'], 8:[3,10,2,'10'], 9:[3,10,1.5,'10'], 10:[3,10,1,'10'], 11:[3,10,1,'10'], 12:[4,10,1,'10'] },
    'Deadlift': { 1:[3,5,4,'5'], 2:[3,5,3,'5'], 3:[3,5,2.5,'5'], 4:[3,5,2,'5'], 5:[3,5,1.5,'5'], 6:[3,5,1.5,'5'], 7:[3,5,2.5,'5'], 8:[3,5,2,'5'], 9:[3,5,1.5,'5'], 10:[3,5,1,'5'], 11:[3,5,1,'5'], 12:[4,5,1,'5'] },
    'Bulgarian Split Squat': { 1:[2,10,3,'10'], 2:[2,10,2.5,'10'], 3:[2,10,2,'10'], 4:[2,10,1.5,'10'], 5:[2,10,1,'10'], 6:[3,10,1,'10'], 7:[2,10,2,'10'], 8:[2,10,1.5,'10'], 9:[2,10,1,'10'], 10:[2,10,0.5,'10'], 11:[3,10,0.5,'10'], 12:[3,10,0,'10'] },
    'Machine Hip Thrust': { 1:[3,12,3,'12'], 2:[3,12,2.5,'12'], 3:[3,12,2,'12'], 4:[3,12,1.5,'12'], 5:[3,12,1,'12'], 6:[3,12,1,'12'], 7:[3,12,2,'12'], 8:[3,12,1.5,'12'], 9:[3,12,1,'12'], 10:[3,12,0.5,'12'], 11:[3,12,0.5,'12'], 12:[3,12,0,'12'] },
    'Machine Hip Abduction': { 1:[2,15,3,'15'], 2:[2,15,2.5,'15'], 3:[2,15,2,'15'], 4:[2,15,1.5,'15'], 5:[2,15,1,'15'], 6:[3,15,1,'15'], 7:[2,15,2,'15'], 8:[2,15,1.5,'15'], 9:[2,15,1,'15'], 10:[2,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Machine Leg Extension': { 1:[2,15,3,'15'], 2:[2,15,2.5,'15'], 3:[2,15,2,'15'], 4:[2,15,1.5,'15'], 5:[2,15,1,'15'], 6:[3,15,1,'15'], 7:[2,15,2,'15'], 8:[2,15,1.5,'15'], 9:[2,15,1,'15'], 10:[2,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Seated Leg Curl': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Leg Press Calf Raise': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
  },
  D: {
    'Incline Dumbbell Press': { 1:[3,10,4,'10'], 2:[3,10,3,'10'], 3:[3,10,2.5,'10'], 4:[3,10,2,'10'], 5:[3,10,1.5,'10'], 6:[3,10,1.5,'10'], 7:[3,10,2.5,'10'], 8:[3,10,2,'10'], 9:[3,10,1.5,'10'], 10:[3,10,1,'10'], 11:[3,10,1,'10'], 12:[4,10,1,'10'] },
    'Flat Cable Fly': { 1:[2,15,3,'15'], 2:[2,15,2.5,'15'], 3:[2,15,2,'15'], 4:[2,15,1.5,'15'], 5:[2,15,1,'15'], 6:[3,15,1,'15'], 7:[2,15,2,'15'], 8:[2,15,1.5,'15'], 9:[2,15,1,'15'], 10:[2,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Two Arm Braced Dumbbell Row': { 1:[2,10,4,'10'], 2:[2,10,3,'10'], 3:[2,10,2.5,'10'], 4:[2,10,2,'10'], 5:[2,10,1.5,'10'], 6:[3,10,1.5,'10'], 7:[2,10,2.5,'10'], 8:[2,10,2,'10'], 9:[2,10,1.5,'10'], 10:[2,10,1,'10'], 11:[3,10,1,'10'], 12:[4,10,1,'10'] },
    'Machine Pull-Down': { 1:[3,15,4,'15'], 2:[3,15,3,'15'], 3:[3,15,2.5,'15'], 4:[3,15,2,'15'], 5:[3,15,1.5,'15'], 6:[3,15,1.5,'15'], 7:[3,15,2.5,'15'], 8:[3,15,2,'15'], 9:[3,15,1.5,'15'], 10:[3,15,1,'15'], 11:[3,15,1,'15'], 12:[3,15,1,'15'] },
    'Tall Kneeling Landmine Shoulder Press': { 1:[3,12,4,'12'], 2:[3,12,3,'12'], 3:[3,12,2.5,'12'], 4:[3,12,2,'12'], 5:[3,12,1.5,'12'], 6:[3,12,1.5,'12'], 7:[3,12,2.5,'12'], 8:[3,12,2,'12'], 9:[3,12,1.5,'12'], 10:[3,12,1,'12'], 11:[3,12,1,'12'], 12:[4,12,1,'12'] },
    'Machine Lateral Raise': { 1:[2,15,3,'15'], 2:[2,15,2.5,'15'], 3:[2,15,2,'15'], 4:[2,15,1.5,'15'], 5:[2,15,1,'15'], 6:[3,15,1,'15'], 7:[2,15,2,'15'], 8:[2,15,1.5,'15'], 9:[2,15,1,'15'], 10:[2,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Machine Preacher Curl': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Seated Overhead Tricep Extension': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Machine Abdominal Crunch': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,1,'15'], 7:[3,15,2,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
  },
}

const WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Hamstrings · Glutes · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-60 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit between the hips · drive the knees out' },
      { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'secondary', cue: 'Push the hips back · bar stays against the legs · feel the hamstrings load' },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Shoulders on the bench · chin tucked · lock the glutes at the top' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · plantarflex at peak contraction' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full dorsiflexion stretch at the bottom · pause at the top' },
    ],
  },
  {
    key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Chest · Back · Shoulders · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-60 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Shoulder blades set · controlled descent · drive through the feet' },
      { name: 'Pec Deck Machine', muscle: 'Chest', type: 'secondary', cue: 'Elbows on the pads · squeeze · easy to take close to failure' },
      { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Neutral grip is shoulder-friendly · full stretch overhead' },
      { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Tall spine · drive the elbows back · squeeze the mid-back' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to a full lockout · ribs stay down' },
      { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Constant tension · lead with the elbow · no momentum' },
      { name: 'EZ-Bar Cable Curl', muscle: 'Biceps', type: 'secondary', cue: 'Cable keeps tension at the bottom · elbows fixed at the sides' },
      { name: 'Overhead Rope Cable Extensions', muscle: 'Triceps', type: 'secondary', cue: 'Rope behind the head · long-head stretch under load' },
      { name: 'Straight Bar Cable Crunch', muscle: 'Core', type: 'secondary', cue: 'Kneel and round the spine down · pull with the abs, not the arms' },
    ],
  },
  {
    key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 3', focus: 'Quads · Glutes · Hamstrings · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-60 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Hack Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
      { name: 'Deadlift', muscle: 'Hamstrings', type: 'secondary', cue: 'Neutral spine · push the floor away · finish tall' },
      { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Rear foot on the bench · weight through the front leg · same reps each side' },
      { name: 'Machine Hip Thrust', muscle: 'Glutes', type: 'isolation', cue: 'Fixed path · drive through the heels · pause at lockout' },
      { name: 'Machine Hip Abduction', muscle: 'Glutes', type: 'isolation', cue: 'Push the knees apart · pause at the widest point' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Hamstrings at length — superior growth stimulus' },
      { name: 'Leg Press Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Toes on the platform · press through the balls of the feet · full stretch' },
    ],
  },
  {
    key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 4', focus: 'Chest · Back · Shoulders · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~45-60 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'primary', cue: '30-45 degree bench · full stretch at the bottom' },
      { name: 'Flat Cable Fly', muscle: 'Chest', type: 'isolation', cue: 'Wide arc · pause at full stretch' },
      { name: 'Two Arm Braced Dumbbell Row', muscle: 'Back', type: 'secondary', cue: 'Chest braced against the bench · zero body english · pure lat drive' },
      { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full extension at the top · pull to the upper chest' },
      { name: 'Tall Kneeling Landmine Shoulder Press', muscle: 'Shoulders', type: 'isolation', cue: 'Tall kneeling kills momentum · press up and slightly across' },
      { name: 'Machine Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Supported · smooth arc to shoulder height' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · full extension at the bottom' },
      { name: 'Seated Overhead Tricep Extension', muscle: 'Triceps', type: 'isolation', cue: 'Overhead position stretches the long head · full lockout' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
]

export function fullBody4DayWorkouts(_week: number): Workout[] { return WORKOUTS }

export function fullBody4DayPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const cell = SCHEDULE[dayKey]?.[exerciseName]?.[Math.max(1, Math.min(12, week))]
  if (!cell) return null
  const [sets, reps, rir, repsLabel] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir), repsLabel }
}

export function getFullBody4DayWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const rx   = fullBody4DayPrescription('A', 'Back Squat', week)
  const rir  = rx?.rir ?? 3
  const wave = week <= 6 ? 1 : 2
  const wIn  = week <= 6 ? week : week - 6
  return {
    sets:  { primary: rx?.sets ?? 3, secondary: 3, isolation: 3 },
    reps:  { primary: '5', secondary: '8-10', isolation: '12-15' },
    rir,
    phase: week === 12 ? 'Peak Week — Added Volume' : `Wave ${wave} — RIR Taper (week ${wIn} of 6)`,
    isDeload: false,
    note: week === 12
      ? 'Final week: a fourth set across the board at one rep in reserve. Same lifts, same reps — just more of them.'
      : `Same thirty-one movements every week — the progression is effort. Train to about ${rir} reps in reserve and add load whenever that starts to feel comfortable.`,
    percentages: {
      primary:   rtfPercent(5, rir),
      secondary: rtfPercent(9, rir),
      isolation: rtfPercent(13, rir),
    },
  }
}

export const FULL_BODY_4DAY_PROGRAM: Program = {
  id:            FULL_BODY_4DAY_ID,
  name:          'Foundational Strength: 4-Day Full Body',
  shortName:     '4-Day Full Body',
  author:        'Biolayne Workout Builder',
  description:   'Twelve weeks, four days a week, alternating lower and upper sessions. Heavy fives on the main lifts, tens and higher on everything else, and the same thirty-one movements from the first week to the last. Progression is purely effort: reps-in-reserve tapers from four down to one and a half across the first six weeks, resets, then tapers again, before a final week that adds a fourth set to every exercise. Straightforward, repeatable, and easy to autoregulate.',
  focus:         'Strength · Full Body',
  daysPerWeek:   4,
  totalWeeks:    12,
  split:         'Lower / Upper · 4-Day',
  workouts:      WORKOUTS,
  getWeekConfig: getFullBody4DayWeekConfig,
}
