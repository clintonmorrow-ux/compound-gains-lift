import type { Program, WeekConfig, DayType, Workout, Exercise } from '@/types'

// ═══════════════════════════════════════════════════════════════════════
// PHAT · Custom — 12-week, 5-day, two-block build
//
// Transcribed directly from the PHAT_Workout_Tracker workbook. It differs
// structurally from the First Edition PHAT program in four ways, all of
// which are honoured here rather than flattened into the app's usual
// type-based week config:
//
//   1. Prescriptions are PER EXERCISE, not per exercise type. Three
//      "accessory" lifts on the same day can carry three different
//      set/rep/RIR prescriptions.
//   2. The same lift carries DIFFERENT prescriptions on different days —
//      each main lift has a heavy day and an RIR-5 back-off day.
//   3. Two 6-week blocks: block 1 trains the main lifts at 5 reps, block 2
//      at 3 reps, and 14 accessories are substituted at week 7.
//   4. No deload weeks. Recovery comes from the RIR-5 back-off days and
//      the RIR reset at the start of block 2.
//
// Weight suggestions come from the workbook's own Reps-To-Failure model:
// %1RM is looked up from RTF (prescribed reps + prescribed RIR) rather
// than from a fixed weekly percentage.
// ═══════════════════════════════════════════════════════════════════════

/** Reps-To-Failure → estimated %1RM (workbook Reference sheet). */
const RTF_PCT: Record<number, number> = {
  1: 1.00,  2: 0.95,  3: 0.93,  4: 0.90,  5: 0.87,  6: 0.85,  7: 0.83,
  8: 0.80,  9: 0.77, 10: 0.75, 11: 0.73, 12: 0.71, 13: 0.70, 14: 0.68,
 15: 0.65, 16: 0.63, 17: 0.61, 18: 0.59, 19: 0.57, 20: 0.55,
}

/** %1RM for a prescription. RTF = reps + RIR, clamped to the table. */
export function rtfPercent(reps: number, rir: number): number {
  const rtf = Math.max(1, Math.min(20, Math.round(reps + rir)))
  return RTF_PCT[rtf] ?? 0.65
}

export interface Prescription { sets: number; reps: number; rir: number; pct: number }

export const PHAT_CUSTOM_ID = 'phat-custom-12wk'

/** [dayKey][exerciseName] → 12 weekly prescriptions (index 0 = week 1). */
const SCHEDULE: Record<string, Record<string, [number, number, number][]>> = {
  A: {
    'Back Squat': [[3,5,3], [3,5,2], [3,5,2], [4,5,2], [4,5,2], [5,5,1], [3,3,4], [3,3,3], [3,3,2], [4,3,2], [4,3,1], [5,3,1]] as any,
    'Deadlift': [[3,5,5], [3,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5], [3,5,5], [4,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5]] as any,
    'Hack Squat': [[2,8,3], [2,8,2], [3,8,2], [3,8,2], [4,8,1], [4,8,1], null, null, null, null, null, null] as any,
    'Machine Leg Extension': [[3,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1], [4,10,1], [3,10,3], [3,10,2], [3,10,1], [4,10,1], [4,10,1], [4,10,1]] as any,
    'Glute Ham Raise': [[2,5,3], [2,5,2], [3,5,2], [3,5,2], [4,5,2], [4,5,1], null, null, null, null, null, null] as any,
    'Donkey Calf Raise': [[2,10,2], [2,10,2], [3,10,2], [3,10,1], [3,10,1], [3,10,1], null, null, null, null, null, null] as any,
    'Seated Calf Raise': [[2,12,2], [2,12,2], [2,12,2], [2,12,1], [3,12,1], [3,12,1], [2,12,2], [2,12,2], [2,12,2], [2,12,1], [3,12,1], [3,12,1]] as any,
    'Machine Squat': [null, null, null, null, null, null, [2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [4,8,1]] as any,
    'Barbell RDL': [null, null, null, null, null, null, [2,6,3], [2,6,2], [2,6,2], [3,6,2], [3,6,2], [3,6,2]] as any,
    'Standing Calf Raise': [null, null, null, null, null, null, [2,10,2], [2,10,2], [2,10,2], [3,10,1], [3,10,1], [4,10,1]] as any,
  },
  B: {
    'Bench Press': [[3,5,3], [3,5,2], [3,5,2], [4,5,2], [4,5,2], [5,5,1], [3,3,4], [3,3,3], [3,3,2], [3,3,2], [4,3,1], [5,3,1]] as any,
    'Incline Dumbbell Press': [[2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [3,8,1], [2,8,3], [2,8,2], [2,8,2], [2,8,2], [3,8,1], [4,8,1]] as any,
    'Pendlay Row': [[2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [3,8,1], [2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [4,8,1]] as any,
    'Machine Pull-Down': [[2,10,3], [2,10,2], [2,10,2], [2,10,1], [3,10,1], [3,10,1], [2,10,3], [2,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1]] as any,
    'Seated Dumbbell Press': [[2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [4,8,1], [2,8,3], [2,8,2], [3,8,2], [3,8,2], [3,8,1], [4,8,1]] as any,
    'Cambered Bar Curl': [[3,10,2], [3,10,2], [3,10,1], [4,10,1], [4,10,1], [4,10,1], [3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1]] as any,
    'Seated Overhead Tricep Extension': [[3,10,2], [3,10,2], [3,10,1], [4,10,1], [4,10,1], [4,10,1], [3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1]] as any,
  },
  C: {
    'Machine Pull-Down': [[3,12,3], [3,12,2], [3,12,2], [3,12,1], [4,12,1], [4,12,1], null, null, null, null, null, null] as any,
    'Dumbbell Prone Row': [[3,12,3], [3,12,2], [3,12,2], [3,12,1], [4,12,1], [4,12,1], null, null, null, null, null, null] as any,
    'Single Arm Lat Pull-Down': [[2,15,3], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [2,15,3], [2,15,2], [3,15,2], [3,15,2], [3,15,1], [3,15,1]] as any,
    'Single Arm Cable Row': [[2,15,3], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [2,15,3], [2,15,2], [3,15,2], [3,15,2], [3,15,1], [3,15,1]] as any,
    'Kneeling Scrape the Rack Press': [[3,10,3], [3,10,2], [3,10,2], [3,10,1], [4,10,1], [4,10,1], null, null, null, null, null, null] as any,
    'Kneeling Single Arm Landmine Presses': [[2,15,3], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1]] as any,
    'Cable Lateral Raise': [[3,15,2], [3,15,2], [3,15,2], [3,15,1], [4,15,1], [4,15,1], null, null, null, null, null, null] as any,
    'Machine Abdominal Crunch': [[3,12,3], [3,12,2], [3,12,1], [3,12,1], [4,12,1], [4,12,1], [3,12,3], [3,12,2], [3,12,1], [3,12,1], [4,12,1], [4,12,1]] as any,
    'Close Grip Lat Pull-Down': [null, null, null, null, null, null, [3,12,3], [3,12,2], [3,12,2], [3,12,2], [3,12,1], [4,12,1]] as any,
    'Cable Row': [null, null, null, null, null, null, [3,12,3], [3,12,2], [3,12,2], [3,12,2], [3,12,1], [4,12,1]] as any,
    'Arnold Press': [null, null, null, null, null, null, [2,15,3], [2,15,2], [3,15,2], [3,15,2], [3,15,1], [3,15,1]] as any,
    'Lateral Raise': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,1], [3,15,1], [4,15,1], [4,15,1]] as any,
  },
  D: {
    'Back Squat': [[3,5,5], [3,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5], [3,5,5], [3,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5]] as any,
    'Deadlift': [[3,5,3], [3,5,2], [3,5,2], [4,5,2], [4,5,2], [5,5,1], [3,3,4], [3,3,3], [3,3,2], [4,3,2], [4,3,1], [5,3,1]] as any,
    'Hack Squat': [[3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,1], [3,10,1], [3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,1], [4,10,1]] as any,
    'Pendulum Squat': [[2,12,3], [2,12,2], [2,12,2], [2,12,2], [3,12,1], [3,12,1], null, null, null, null, null, null] as any,
    'Machine Leg Extension': [[3,15,2], [3,15,2], [4,15,2], [4,15,1], [4,15,1], [4,15,1], [3,15,3], [3,15,2], [3,15,1], [4,15,1], [4,15,1], [4,15,1]] as any,
    'Banded Slow Eccentric RDL': [[3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,2], [3,10,2], null, null, null, null, null, null] as any,
    'Seated Leg Curl': [[3,15,2], [3,15,2], [4,15,2], [4,15,1], [4,15,1], [4,15,1], null, null, null, null, null, null] as any,
    'Donkey Calf Raise': [[3,15,2], [3,15,2], [3,15,2], [3,15,1], [4,15,1], [4,15,1], null, null, null, null, null, null] as any,
    'Seated Calf Raise': [[2,15,2], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [2,15,2], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1]] as any,
    'Leg Press': [null, null, null, null, null, null, [2,12,3], [2,12,2], [3,12,2], [3,12,2], [3,12,1], [3,12,1]] as any,
    'Deficit RDL': [null, null, null, null, null, null, [3,10,3], [3,10,2], [3,10,2], [3,10,2], [3,10,2], [4,10,2]] as any,
    'Prone Leg Curl': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,1], [4,15,1], [4,15,1], [4,15,1]] as any,
    'Standing Calf Raise': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,2], [3,15,1], [3,15,1], [4,15,1]] as any,
  },
  E: {
    'Bench Press': [[3,5,5], [3,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5], [3,5,5], [3,5,5], [4,5,5], [4,5,5], [5,5,5], [5,5,5]] as any,
    'Incline Dumbbell Press': [[3,12,3], [3,12,2], [3,12,2], [3,12,1], [3,12,1], [3,12,1], [3,12,3], [3,12,3], [3,12,2], [3,12,1], [3,12,1], [4,12,1]] as any,
    'Pec Deck Machine': [[3,15,2], [3,15,2], [3,15,2], [3,15,1], [4,15,1], [4,15,1], null, null, null, null, null, null] as any,
    'Machine Preacher Curl': [[3,12,2], [3,12,2], [3,12,1], [3,12,1], [4,12,1], [4,12,1], [3,12,2], [3,12,2], [3,12,2], [3,12,1], [4,12,1], [4,12,1]] as any,
    'Incline Dumbbell Curl': [[3,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [3,15,1], null, null, null, null, null, null] as any,
    'Seated Overhead Tricep Extension': [[3,12,2], [3,12,2], [3,12,1], [3,12,1], [4,12,1], [4,12,1], [3,12,2], [3,12,2], [3,12,2], [3,12,1], [4,12,1], [4,12,1]] as any,
    'Rope Press-Down': [[3,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [3,15,1], null, null, null, null, null, null] as any,
    'Rope Abdominal Crunch': [[3,12,3], [3,12,2], [3,12,2], [3,12,1], [3,12,1], [3,12,1], [3,12,3], [3,12,2], [3,12,2], [3,12,1], [4,12,1], [4,12,1]] as any,
    'Single Arm Oblique Cable Crunch': [[2,15,3], [2,15,2], [2,15,2], [2,15,2], [2,15,1], [2,15,1], [2,15,3], [2,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1]] as any,
    'Flat Cable Fly': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,1], [3,15,1], [4,15,1], [4,15,1]] as any,
    'Single Arm Machine Curl': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [3,15,1]] as any,
    'Machine Tricep Press-Down': [null, null, null, null, null, null, [3,15,2], [3,15,2], [3,15,1], [3,15,1], [3,15,1], [3,15,1]] as any,
  },
}

const BLOCK1_WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Lower Power', shortName: 'Lower Power', day: 'Day 1', focus: 'Quads · Hamstrings · Calves',
    dayType: 'power' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive knees out' },
      { name: 'Deadlift', muscle: 'Hamstrings', type: 'primary', cue: 'Neutral spine · push the floor away · lock out tall' },
      { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through mid-foot' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Pause at the top · slow eccentric' },
      { name: 'Glute Ham Raise', muscle: 'Hamstrings', type: 'secondary', cue: 'Control the descent · squeeze at the top' },
      { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Hinged position stretches the gastrocnemius under load' },
      { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Knee bent targets the soleus · full stretch' },
    ],
  },
  {
    key: 'B', name: 'Upper Power', shortName: 'Upper Power', day: 'Day 2', focus: 'Chest · Back · Shoulders · Arms',
    dayType: 'power' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Retract scapula · controlled descent · drive feet' },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'secondary', cue: '30-45° bench · full stretch at the bottom' },
      { name: 'Pendlay Row', muscle: 'Back', type: 'secondary', cue: 'Dead stop each rep from the floor · explosive pull' },
      { name: 'Machine Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Full extension at the top · pull to upper chest' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
      { name: 'Cambered Bar Curl', muscle: 'Biceps', type: 'secondary', cue: 'Cambered bar spares the wrists · elbows fixed' },
      { name: 'Seated Overhead Tricep Extension', muscle: 'Triceps', type: 'secondary', cue: 'Overhead position stretches the long head' },
    ],
  },
  {
    key: 'C', name: 'Back & Shoulders', shortName: 'Back & Shoulders', day: 'Day 3', focus: 'Back · Shoulders · Side Delts · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full extension at the top · pull to upper chest' },
      { name: 'Dumbbell Prone Row', muscle: 'Back', type: 'isolation', cue: 'Chest on the bench · no body english · squeeze mid-back' },
      { name: 'Single Arm Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'One side at a time · full stretch overhead' },
      { name: 'Single Arm Cable Row', muscle: 'Back', type: 'isolation', cue: 'Rotate into the stretch · drive the elbow back' },
      { name: 'Kneeling Scrape the Rack Press', muscle: 'Shoulders', type: 'secondary', cue: 'Press up and INTO the uprights · huge upper-back and delt tension' },
      { name: 'Kneeling Single Arm Landmine Presses', muscle: 'Shoulders', type: 'isolation', cue: 'Tall kneeling kills momentum · press across the body' },
      { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Constant tension · natural arc · one arm at a time' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
  {
    key: 'D', name: 'Lower Hypertrophy', shortName: 'Lower Hypertrophy', day: 'Day 4', focus: 'Quads · Hamstrings · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive knees out' },
      { name: 'Deadlift', muscle: 'Hamstrings', type: 'primary', cue: 'Neutral spine · push the floor away · lock out tall' },
      { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through mid-foot' },
      { name: 'Pendulum Squat', muscle: 'Quads', type: 'isolation', cue: 'Deep knee flexion · quad-biased path' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Banded Slow Eccentric RDL', muscle: 'Hamstrings', type: 'secondary', cue: '3-4 sec lowering against the band · hips back' },
      { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Hamstrings at length — superior growth stimulus' },
      { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Hinged position stretches the gastrocnemius under load' },
      { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Knee bent targets the soleus · full stretch' },
    ],
  },
  {
    key: 'E', name: 'Chest & Arms', shortName: 'Chest & Arms', day: 'Day 5', focus: 'Chest · Biceps · Triceps · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Retract scapula · controlled descent · drive feet' },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: '30-45° bench · full stretch at the bottom' },
      { name: 'Pec Deck Machine', muscle: 'Chest', type: 'isolation', cue: 'Elbows on the pads · squeeze · easy to push near failure' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · strict elbow path' },
      { name: 'Incline Dumbbell Curl', muscle: 'Biceps', type: 'isolation', cue: 'Long-head emphasis · arms hang behind the torso' },
      { name: 'Seated Overhead Tricep Extension', muscle: 'Triceps', type: 'isolation', cue: 'Overhead position stretches the long head' },
      { name: 'Rope Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Split the rope at the bottom · elbows pinned' },
      { name: 'Rope Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Round the spine down · pull with the abs, not the arms' },
      { name: 'Single Arm Oblique Cable Crunch', muscle: 'Core', type: 'isolation', cue: 'Side flexion · resist the rotation on the way back' },
    ],
  },
]

const BLOCK2_WORKOUTS: Workout[] = [
  {
    key: 'A', name: 'Lower Power', shortName: 'Lower Power', day: 'Day 1', focus: 'Quads · Hamstrings · Calves',
    dayType: 'power' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive knees out' },
      { name: 'Deadlift', muscle: 'Hamstrings', type: 'primary', cue: 'Neutral spine · push the floor away · lock out tall' },
      { name: 'Machine Squat', muscle: 'Quads', type: 'secondary', cue: 'Fixed path · full depth · constant quad tension' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Pause at the top · slow eccentric' },
      { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'secondary', cue: 'Hips back · bar close · stretch the hamstrings' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full dorsiflexion stretch · pause at the top' },
      { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Knee bent targets the soleus · full stretch' },
    ],
  },
  {
    key: 'B', name: 'Upper Power', shortName: 'Upper Power', day: 'Day 2', focus: 'Chest · Back · Shoulders · Arms',
    dayType: 'power' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Retract scapula · controlled descent · drive feet' },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'secondary', cue: '30-45° bench · full stretch at the bottom' },
      { name: 'Pendlay Row', muscle: 'Back', type: 'secondary', cue: 'Dead stop each rep from the floor · explosive pull' },
      { name: 'Machine Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Full extension at the top · pull to upper chest' },
      { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
      { name: 'Cambered Bar Curl', muscle: 'Biceps', type: 'secondary', cue: 'Cambered bar spares the wrists · elbows fixed' },
      { name: 'Seated Overhead Tricep Extension', muscle: 'Triceps', type: 'secondary', cue: 'Overhead position stretches the long head' },
    ],
  },
  {
    key: 'C', name: 'Back & Shoulders', shortName: 'Back & Shoulders', day: 'Day 3', focus: 'Back · Shoulders · Side Delts · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Close Grip Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Neutral close grip · pull to the upper chest' },
      { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Tall spine · drive elbows back · squeeze mid-back' },
      { name: 'Single Arm Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'One side at a time · full stretch overhead' },
      { name: 'Single Arm Cable Row', muscle: 'Back', type: 'isolation', cue: 'Rotate into the stretch · drive the elbow back' },
      { name: 'Kneeling Single Arm Landmine Presses', muscle: 'Shoulders', type: 'secondary', cue: 'Tall kneeling kills momentum · press across the body' },
      { name: 'Arnold Press', muscle: 'Shoulders', type: 'isolation', cue: 'Rotate from neutral to pronated through the press' },
      { name: 'Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: '3-sec eccentric · slight lean forward · no momentum' },
      { name: 'Machine Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Crunch the ribcage toward the pelvis · slow return' },
    ],
  },
  {
    key: 'D', name: 'Lower Hypertrophy', shortName: 'Lower Hypertrophy', day: 'Day 4', focus: 'Quads · Hamstrings · Calves',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', cue: 'Brace hard · sit to depth · drive knees out' },
      { name: 'Deadlift', muscle: 'Hamstrings', type: 'primary', cue: 'Neutral spine · push the floor away · lock out tall' },
      { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through mid-foot' },
      { name: 'Leg Press', muscle: 'Quads', type: 'isolation', cue: 'Feet low and narrow · full ROM · no lockout' },
      { name: 'Machine Leg Extension', muscle: 'Quads', type: 'isolation', cue: 'Pause at the top · slow eccentric' },
      { name: 'Deficit RDL', muscle: 'Hamstrings', type: 'secondary', cue: 'Stand on a plate · deeper stretch · hips back' },
      { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · plantarflex at peak contraction' },
      { name: 'Standing Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Full dorsiflexion stretch · pause at the top' },
      { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Knee bent targets the soleus · full stretch' },
    ],
  },
  {
    key: 'E', name: 'Chest & Arms', shortName: 'Chest & Arms', day: 'Day 5', focus: 'Chest · Biceps · Triceps · Core',
    dayType: 'hypertrophy' as DayType, isRest: false,
    duration: '~55-75 min', restTimes: '3 min main lifts · 90-120 sec accessories',
    exercises: [
      { name: 'Bench Press', muscle: 'Chest', type: 'primary', cue: 'Retract scapula · controlled descent · drive feet' },
      { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: '30-45° bench · full stretch at the bottom' },
      { name: 'Flat Cable Fly', muscle: 'Chest', type: 'isolation', cue: 'Wide arc · pause at full stretch' },
      { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Pad kills momentum · strict elbow path' },
      { name: 'Single Arm Machine Curl', muscle: 'Biceps', type: 'isolation', cue: 'One side at a time · strict peak contraction' },
      { name: 'Seated Overhead Tricep Extension', muscle: 'Triceps', type: 'isolation', cue: 'Overhead position stretches the long head' },
      { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Fixed path · easy to push close to failure' },
      { name: 'Rope Abdominal Crunch', muscle: 'Core', type: 'isolation', cue: 'Round the spine down · pull with the abs, not the arms' },
      { name: 'Single Arm Oblique Cable Crunch', muscle: 'Core', type: 'isolation', cue: 'Side flexion · resist the rotation on the way back' },
    ],
  },
]

/** Exercise list for a given day and week (block 2 starts at week 7). */
export function phatCustomWorkouts(week: number): Workout[] {
  return week >= 7 ? BLOCK2_WORKOUTS : BLOCK1_WORKOUTS
}

/** The workbook's exact prescription for one exercise on one day in one week. */
export function phatCustomPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const row = SCHEDULE[dayKey]?.[exerciseName]
  if (!row) return null
  const cell = row[Math.max(1, Math.min(12, week)) - 1]
  if (!cell) return null
  const [sets, reps, rir] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir) }
}

/** Representative week config — the app still needs one for rest times,
 *  phase labels and any consumer that has not been given a per-exercise
 *  prescription. Per-exercise values always take precedence. */
export function getPhatCustomWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const block = week >= 7 ? 2 : 1
  const wIn   = ((week - 1) % 6) + 1              // 1-6 within the block
  const mainReps = block === 1 ? 5 : 3
  const mainRir  = block === 1
    ? [3, 2, 2, 2, 2, 1][wIn - 1]
    : [4, 3, 2, 2, 1, 1][wIn - 1]
  const mainSets = [3, 3, 3, 4, 4, 5][wIn - 1]
  return {
    sets:  { primary: mainSets, secondary: 3, isolation: 3 },
    reps:  { primary: String(mainReps), secondary: '8-10', isolation: '12-15' },
    rir:   mainRir,
    phase: block === 1
      ? `Block 1 — Strength Base (week ${wIn} of 6)`
      : `Block 2 — Heavy Triples (week ${wIn} of 6)`,
    isDeload: false,
    note: block === 1
      ? 'Main lifts at 5 reps. Sets ramp 3 to 5 across the block while RIR tapers — each lift gets one heavy day and one RIR-5 back-off day. No deload; the back-off days carry the recovery.'
      : 'Main lifts drop to heavy triples and 14 accessories rotate in. RIR resets to 4 and tapers to 1 across the block.',
    percentages: {
      primary:   rtfPercent(mainReps, mainRir),
      secondary: rtfPercent(9, 3),
      isolation: rtfPercent(13, 2),
    },
  }
}

/** Block-2 exercise lists, exported so name→muscle indexes cover both blocks. */
export const PHAT_CUSTOM_BLOCK2_WORKOUTS = BLOCK2_WORKOUTS

export const PHAT_CUSTOM_PROGRAM: Program = {
  id:            PHAT_CUSTOM_ID,
  name:          'PHAT · Custom 12-Week',
  shortName:     'PHAT Custom',
  author:        'Custom build (PHAT lineage)',
  description:   'Two 6-week blocks on a 5-day power/hypertrophy split. Each main lift trains twice a week — once heavy, once as an RIR-5 back-off. Sets ramp 3 to 5 and RIR tapers within each block; block 2 drops the main lifts from 5 reps to heavy triples and rotates in 14 new accessories. Every exercise carries its own set, rep and RIR prescription, and suggested weights come from a reps-to-failure model rather than fixed weekly percentages. No deload weeks.',
  focus:         'Strength + Hypertrophy',
  daysPerWeek:   5,
  totalWeeks:    12,
  split:         'Power / Hypertrophy',
  workouts:      BLOCK1_WORKOUTS,
  getWeekConfig: getPhatCustomWeekConfig,
}
