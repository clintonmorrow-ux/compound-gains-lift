import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// 3 Day Full Body — 3-Day
//
// Transcribed from the twelve weekly Workout Builder exports. The
// simplest of the imported programs by design: the exercise list is
// identical in all twelve weeks (19 movements, 20 slots), so nothing
// rotates and nothing is substituted.
//
// All progression is effort and volume, in two waves:
//   weeks 1-6   RIR 4 down to 1 in half-point steps
//   week  7     reset to RIR 3
//   weeks 8-12  a fourth set is added to the main lifts while RIR
//               tapers to 0.5, with a few sets to failure at the end
//
// Day 1 is lower, day 2 upper, day 3 a mixed full-body session. Rep
// targets stay fixed per exercise, so week to week the athlete is
// simply working closer to failure at the same reps — the cleanest
// possible double-progression model.
//
// Source gives no loads and no rest intervals; %1RM uses the
// reps-to-failure model and rest follows a hypertrophy profile.
// ═══════════════════════════════════════════════════════════════════════

export const FULL_BODY_3DAY_ID = 'full-body-3day'

/** [dayKey][exercise][week] -> [sets, reps, rir, repsLabel]. */
const SCHEDULE: Record<string, Record<string, Record<number, [number, number, number, string]>>> = {
  A: {
    'Back Squat': { 1:[3,6,4,'6'], 2:[3,6,3,'6'], 3:[3,6,2.5,'6'], 4:[3,6,2,'6'], 5:[3,6,1.5,'6'], 6:[3,6,1,'6'], 7:[3,6,3,'6'], 8:[4,6,2,'6'], 9:[4,6,1.5,'6'], 10:[4,6,1,'6'], 11:[4,6,0.5,'6'], 12:[4,6,0.5,'6'] },
    'Barbell RDL': { 1:[3,6,4,'6'], 2:[3,6,3,'6'], 3:[3,6,2.5,'6'], 4:[3,6,2,'6'], 5:[3,6,1.5,'6'], 6:[3,6,1,'6'], 7:[3,6,3,'6'], 8:[4,6,2,'6'], 9:[4,6,1.5,'6'], 10:[4,6,1,'6'], 11:[4,6,0.5,'6'], 12:[4,6,0.5,'6'] },
    'Barbell Hip Thrust': { 1:[3,8,3,'8'], 2:[3,8,2.5,'8'], 3:[3,8,2,'8'], 4:[3,8,1.5,'8'], 5:[3,8,1,'8'], 6:[3,8,0.5,'8'], 7:[3,8,2.5,'8'], 8:[4,8,1.5,'8'], 9:[4,8,1,'8'], 10:[4,8,0.5,'8'], 11:[4,8,0.5,'8'], 12:[4,8,0,'8'] },
    'Machine Leg Extension': { 1:[3,12,3,'12'], 2:[3,12,2.5,'12'], 3:[3,12,2,'12'], 4:[3,12,1.5,'12'], 5:[3,12,1,'12'], 6:[3,12,0.5,'12'], 7:[3,12,2.5,'12'], 8:[3,12,1.5,'12'], 9:[3,12,1,'12'], 10:[3,12,0.5,'12'], 11:[4,12,0.5,'12'], 12:[4,12,0,'12'] },
    'Prone Leg Curl': { 1:[3,12,3,'12'], 2:[3,12,2.5,'12'], 3:[3,12,2,'12'], 4:[3,12,1.5,'12'], 5:[3,12,1,'12'], 6:[3,12,0.5,'12'], 7:[3,12,2.5,'12'], 8:[3,12,1.5,'12'], 9:[3,12,1,'12'], 10:[3,12,0.5,'12'], 11:[4,12,0.5,'12'], 12:[4,12,0,'12'] },
    'Standing Calf Raise': { 1:[3,10,3,'10'], 2:[3,10,2.5,'10'], 3:[3,10,2,'10'], 4:[3,10,1.5,'10'], 5:[3,10,1,'10'], 6:[3,10,0.5,'10'], 7:[3,10,2.5,'10'], 8:[3,10,1.5,'10'], 9:[3,10,1,'10'], 10:[3,10,0.5,'10'], 11:[4,10,0.5,'10'], 12:[4,10,0,'10'] },
  },
  B: {
    'Bench Press': { 1:[3,8,4,'8'], 2:[3,8,3,'8'], 3:[3,8,2.5,'8'], 4:[3,8,2,'8'], 5:[3,8,1.5,'8'], 6:[3,8,1,'8'], 7:[3,8,3,'8'], 8:[4,8,2,'8'], 9:[4,8,1.5,'8'], 10:[4,8,1,'8'], 11:[4,8,0.5,'8'], 12:[4,8,0.5,'8'] },
    'Neutral Grip Pull-Down': { 1:[2,8,4,'8'], 2:[2,12,3,'12'], 3:[2,8,2.5,'8'], 4:[2,12,2,'12'], 5:[2,12,1.5,'12'], 6:[2,8,1,'8'], 7:[2,8,3,'8'], 8:[3,12,2,'12'], 9:[3,8,1.5,'8'], 10:[3,12,1,'12'], 11:[3,12,0.5,'12'], 12:[3,8,0.5,'8'] },
    'Cable Row': { 1:[2,12,4,'12'], 2:[2,8,3,'8'], 3:[2,12,2.5,'12'], 4:[2,8,2,'8'], 5:[2,8,1.5,'8'], 6:[2,12,1,'12'], 7:[2,12,3,'12'], 8:[2,8,2,'8'], 9:[3,12,2,'12'], 10:[3,8,1,'8'], 11:[3,8,0.5,'8'], 12:[3,12,0,'12'] },
    'Seated Dumbbell Press': { 1:[3,8,4,'8'], 2:[3,8,3,'8'], 3:[3,8,2.5,'8'], 4:[3,8,2,'8'], 5:[3,8,1.5,'8'], 6:[3,8,1,'8'], 7:[3,8,3,'8'], 8:[3,8,2,'8'], 9:[3,8,1.5,'8'], 10:[3,8,1,'8'], 11:[3,8,0.5,'8'], 12:[3,8,0,'8'] },
    'Rope Abdominal Crunch': { 1:[3,10,3,'10'], 2:[3,10,2.5,'10'], 3:[3,10,2,'10'], 4:[3,10,1.5,'10'], 5:[3,10,1,'10'], 6:[3,10,0.5,'10'], 7:[3,10,2.5,'10'], 8:[4,10,1.5,'10'], 9:[4,10,1,'10'], 10:[4,10,0.5,'10'], 11:[4,10,0.5,'10'], 12:[4,10,0,'10'] },
    'Machine Preacher Curl': { 1:[2,12,3,'12'], 2:[2,12,2.5,'12'], 3:[2,12,2,'12'], 4:[2,12,1.5,'12'], 5:[2,12,1,'12'], 6:[2,12,0.5,'12'], 7:[2,12,2.5,'12'], 8:[2,12,1.5,'12'], 9:[2,12,1,'12'], 10:[2,12,0.5,'12'], 11:[3,12,0.5,'12'], 12:[3,12,0,'12'] },
    'Rope Press-Down': { 1:[2,12,3,'12'], 2:[2,12,2.5,'12'], 3:[2,12,2,'12'], 4:[2,12,1.5,'12'], 5:[2,12,1,'12'], 6:[2,12,0.5,'12'], 7:[2,12,2.5,'12'], 8:[2,12,1.5,'12'], 9:[2,12,1,'12'], 10:[2,12,0.5,'12'], 11:[3,12,0.5,'12'], 12:[3,12,0,'12'] },
  },
  C: {
    'Bulgarian Split Squat': { 1:[3,10,4,'10'], 2:[3,10,3,'10'], 3:[3,10,2.5,'10'], 4:[3,10,2,'10'], 5:[3,10,1.5,'10'], 6:[3,10,1,'10'], 7:[3,10,3,'10'], 8:[3,10,2,'10'], 9:[3,10,1.5,'10'], 10:[3,10,1,'10'], 11:[3,10,0.5,'10'], 12:[4,10,0.5,'10'] },
    'Barbell RDL': { 1:[3,10,4,'10'], 2:[3,10,3,'10'], 3:[3,10,2.5,'10'], 4:[3,10,2,'10'], 5:[3,10,1.5,'10'], 6:[3,10,1,'10'], 7:[3,10,3,'10'], 8:[3,10,2,'10'], 9:[3,10,1.5,'10'], 10:[3,10,1,'10'], 11:[3,10,0.5,'10'], 12:[4,10,0.5,'10'] },
    'Machine Hip Abduction': { 1:[3,15,4,'15'], 2:[3,15,3,'15'], 3:[3,15,2.5,'15'], 4:[3,15,2,'15'], 5:[3,15,1.5,'15'], 6:[3,15,1,'15'], 7:[3,15,3,'15'], 8:[3,15,2,'15'], 9:[3,15,1.5,'15'], 10:[3,15,1,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Pec Deck Machine': { 1:[3,12,3,'12'], 2:[3,12,2.5,'12'], 3:[3,12,2,'12'], 4:[3,12,1.5,'12'], 5:[3,12,1,'12'], 6:[3,12,0.5,'12'], 7:[3,12,2.5,'12'], 8:[3,12,1.5,'12'], 9:[4,12,1,'12'], 10:[4,12,0.5,'12'], 11:[4,12,0.5,'12'], 12:[4,12,0,'12'] },
    'Machine Pull-Down': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,0.5,'15'], 7:[3,15,2.5,'15'], 8:[3,15,1.5,'15'], 9:[3,15,1,'15'], 10:[3,15,0.5,'15'], 11:[3,15,0.5,'15'], 12:[3,15,0,'15'] },
    'Cable Lateral Raise': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,0.5,'15'], 7:[3,15,2.5,'15'], 8:[3,15,1.5,'15'], 9:[4,15,1,'15'], 10:[4,15,0.5,'15'], 11:[4,15,0.5,'15'], 12:[4,15,0,'15'] },
    'Machine Abdominal Crunch': { 1:[3,15,3,'15'], 2:[3,15,2.5,'15'], 3:[3,15,2,'15'], 4:[3,15,1.5,'15'], 5:[3,15,1,'15'], 6:[3,15,0.5,'15'], 7:[3,15,2.5,'15'], 8:[3,15,1.5,'15'], 9:[4,15,1,'15'], 10:[4,15,0.5,'15'], 11:[4,15,0.5,'15'], 12:[4,15,0,'15'] },
  },
}

const WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Lower Body', shortName: 'Lower Body', day: 'Day 1', focus: 'Quads · Hamstrings · Glutes · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~40-55 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit between the hips · drive the knees out' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'secondary', cue: 'Push the hips back · bar stays against the legs · feel the hamstrings load' },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Shoulders on the bench · chin tucked · lock the glutes at the top' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · plantarflex at peak contraction' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full dorsiflexion stretch at the bottom · pause at the top' },
    ],
  },
  {
    key: 'B', name: 'Upper Body', shortName: 'Upper Body', day: 'Day 2', focus: 'Chest · Back · Shoulders · Arms · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~40-55 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Shoulder blades set · controlled descent · drive through the feet' },
      { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Neutral grip is shoulder-friendly · full stretch overhead' },
      { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Tall spine · drive the elbows back · squeeze the mid-back' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to a full lockout · ribs stay down' },
      { name: 'Rope Abdominal Crunch', muscle: 'Core', type: 'secondary', cue: 'Round the spine down · pull with the abs, not the arms' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · full extension at the bottom' },
      { name: 'Rope Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Split the rope at the bottom · elbows pinned to the ribs' },
    ],
  },
  {
    key: 'C', name: 'Full Body', shortName: 'Full Body', day: 'Day 3', focus: 'Glutes · Hamstrings · Chest · Back · Delts · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~40-55 min', restTimes: '2.5 min main lifts · 90 sec accessories · 60 sec isolation',
    exercises: [
      { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Rear foot on the bench · weight through the front leg · same reps each side' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'secondary', cue: 'Push the hips back · bar stays against the legs · feel the hamstrings load' },
      { name: 'Machine Hip Abduction', muscle: 'Glutes', type: 'isolation', cue: 'Push the knees apart · pause at the widest point · glute medius work' },
      { name: 'Pec Deck Machine', muscle: 'Chest', type: 'isolation', cue: 'Elbows on the pads · squeeze · easy to take close to failure' },
      { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full extension at the top · pull to the upper chest' },
      { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Constant tension · lead with the elbow · no momentum' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
]

export function fullBody3DayWorkouts(_week: number): Workout[] { return WORKOUTS }

export function fullBody3DayPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const cell = SCHEDULE[dayKey]?.[exerciseName]?.[Math.max(1, Math.min(12, week))]
  if (!cell) return null
  const [sets, reps, rir, repsLabel] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir), repsLabel }
}

export function getFullBody3DayWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const rx    = fullBody3DayPrescription('A', 'Back Squat', week)
  const rir   = rx?.rir ?? 3
  const wave  = week <= 6 ? 1 : 2
  const wIn   = week <= 6 ? week : week - 6
  return {
    sets:  { primary: rx?.sets ?? 3, secondary: 3, isolation: 3 },
    reps:  { primary: '6', secondary: '8-10', isolation: '12-15' },
    rir,
    phase: `Wave ${wave} — RIR Taper (week ${wIn} of 6)`,
    isDeload: false,
    note: wave === 1
      ? `Same exercises, same reps, every week — the progression is effort. Train to about ${rir} reps in reserve and add weight whenever that starts to feel easy.`
      : `Second wave: a fourth set on the main lifts and RIR down to ${rir}. The last weeks run close to failure — keep form clean and stop the set when it changes.`,
    percentages: {
      primary:   rtfPercent(6, rir),
      secondary: rtfPercent(9, rir),
      isolation: rtfPercent(13, rir),
    },
  }
}

export const FULL_BODY_3DAY_PROGRAM: Program = {
  id:            FULL_BODY_3DAY_ID,
  name:          '3 Day Full Body',
  shortName:     '3-Day Full Body',
  author:        'Biolayne Workout Builder',
  description:   'Twelve weeks, three full-body days a week, and the same nineteen movements from start to finish. A lower day, an upper day, and a mixed session covering glutes, chest, back and delts. Nothing rotates and rep targets never change — progression is purely a matter of working closer to failure, with reps-in-reserve tapering from four down to one across the first six weeks, resetting, then tapering again while a fourth set is added to the main lifts. The most straightforward programme in the library, and a good fit for anyone who wants three sessions a week and no decisions to make.',
  focus:         'Full Body · Hypertrophy',
  daysPerWeek:   3,
  totalWeeks:    12,
  split:         'Full Body · 3-Day',
  workouts:      WORKOUTS,
  getWeekConfig: getFullBody3DayWeekConfig,
}
