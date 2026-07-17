// ──────────────────────────────────────────────────────────────────────────────
// PHAT — Power Hypertrophy Adaptive Training
// Developed by Dr. Layne Norton, Ph.D.
//
// Structure: 5 days/week — 2 power days (3–5 reps, ~80–85% 1RM) followed by
// 3 hypertrophy days (8–15 reps, ~65–75% 1RM). Runs as a 12-week mesocycle
// with deloads at weeks 4, 8 and 12.
//
// Key principle: power work builds neurological efficiency; hypertrophy work
// drives sarcoplasmic and myofibrillar adaptations. Running both together
// simultaneously maximises total development.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

// ── Workouts ─────────────────────────────────────────────────────────────────

export const PHAT_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Upper Power',
    shortName: 'Upper Power',
    day: 'Day 1',
    focus: 'Back · Chest · Shoulders · Biceps · Triceps',
    restTimes: '3–4 min compounds · 90 sec accessory',
    duration: '~60 min',
    dayType: 'power',
    exercises: [
      { name: 'Barbell Bent-Over Row',        muscle: 'Back',      type: 'primary',   cue: 'Hinge 45° · drive elbows back · overhand grip · full ROM — heaviest back movement of the week, sets the foundation for hypertrophy day volume' },
      { name: 'Weighted Pull-Up',              muscle: 'Back',      type: 'secondary', isBodyweight: true, cue: 'Dead hang start · full chin over bar · slow 3-sec eccentric · add plate via belt' },
      { name: 'Barbell Bench Press',           muscle: 'Chest',     type: 'primary',   cue: 'Retract scapula · arch · drive feet · pause at chest — power day means heavier than hypertrophy day, treat this as a strength movement' },
      { name: 'Weighted Dips',                 muscle: 'Chest',     type: 'secondary', isBodyweight: true, cue: 'Lean forward for chest emphasis · full depth · slow eccentric · add plate via belt' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout · don\'t touch weights at top — keeps shoulder under load' },
      { name: 'Barbell Curl',                  muscle: 'Biceps',    type: 'secondary', cue: 'Elbows fixed · full extension at bottom — lengthened position is peak stimulus · supinate at top' },
      { name: 'EZ-Bar Skull Crusher',          muscle: 'Triceps',   type: 'secondary', cue: 'Lower to forehead · elbows slightly back · full lockout · long-head emphasis at stretched position' },
    ],
  },
  {
    key: 'B',
    name: 'Lower Power',
    shortName: 'Lower Power',
    day: 'Day 2',
    focus: 'Quads · Hamstrings · Calves',
    restTimes: '3–4 min compounds · 90–120 sec accessory',
    duration: '~58 min',
    dayType: 'power',
    exercises: [
      { name: 'Barbell Back Squat',            muscle: 'Quads',      type: 'primary',   cue: 'Brace hard · break at hips and knees simultaneously · drive knees out · sit to depth — heaviest quad movement of the week' },
      { name: 'Leg Press',                     muscle: 'Quads',      type: 'secondary', cue: 'Feet low and narrow · full ROM · don\'t lock out at top' },
      { name: 'Romanian Deadlift (RDL)',        muscle: 'Hamstrings', type: 'primary',   cue: 'Push hips back hard · bar stays close · emphasise the stretched position — lengthened hamstring is the primary hypertrophic driver' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · plantarflex foot at peak contraction · full stretch at bottom' },
      { name: 'Leg Extension',                 muscle: 'Quads',      type: 'isolation', cue: 'Pause at the top · slow 3-sec eccentric · high mind-muscle connection' },
      { name: 'Standing Calf Raise',           muscle: 'Calves',     type: 'secondary', cue: 'Full dorsiflexion stretch at bottom · pause at top · gastrocnemius dominant' },
    ],
  },
  {
    key: 'R1',
    name: 'Rest Day',
    shortName: 'Rest',
    day: 'Day 3',
    focus: 'CNS Recovery · Separating Power from Hypertrophy',
    restTimes: '',
    isRest: true,
    restRationale: "Norton\'s design: separates power from hypertrophy. After 2 maximal-effort compound days, CNS fatigue impairs metabolic stress quality on hypertrophy days. 24-48h recovery restores CNS for quality volume work.",
    exercises: [],
  },
  {
    key: 'C',
    name: 'Back & Shoulders',
    shortName: 'Back & Shoulders',
    day: 'Day 3',
    focus: 'Back · Rear Delts · Side Delts · Shoulders',
    restTimes: '90 sec compounds · 60 sec isolation',
    duration: '~60 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Barbell Bent-Over Row',         muscle: 'Back',       type: 'primary',   cue: 'Second back session — moderate load, full ROM, control the eccentric. Aim for more total reps than power day at ~65% of power day weight' },
      { name: 'Lat Pulldown',                  muscle: 'Back',       type: 'secondary', cue: 'Wide grip · pull to chest · full arm extension at top — emphasise the lengthened stretch position at the top' },
      { name: 'Seated Cable Row',              muscle: 'Back',       type: 'secondary', cue: 'Tall spine · drive elbows back · squeeze at end ROM · 2-sec hold at contraction' },
      { name: 'Dumbbell Row',                  muscle: 'Back',       type: 'secondary', cue: 'Brace on bench · elbow to ceiling · full stretch at bottom · no hip rotation' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders',  type: 'secondary', cue: 'Hypertrophy session — lighter than power day, higher reps, controlled eccentric throughout' },
      { name: 'DB Lateral Raise',              muscle: 'Side Delts', type: 'isolation', cue: '3-sec eccentric · slight lean forward · thumb down at top · no momentum' },
      { name: 'Machine Lateral Raise',         muscle: 'Side Delts', type: 'isolation', cue: 'Supported by the machine · raise smoothly to shoulder height · brings weekly side-delt volume to a hypertrophy-effective dose (pressing alone leaves them under-trained)' },
      { name: 'Face Pull',                     muscle: 'Rear Delts', type: 'isolation', cue: 'Pull to face · elbows high · externally rotate at end · squeeze and hold' },
    ],
  },
  {
    key: 'D',
    name: 'Lower Hypertrophy',
    shortName: 'Lower Hyper',
    day: 'Day 4',
    focus: 'Quads · Hamstrings · Calves',
    restTimes: '90 sec compounds · 60 sec isolation',
    duration: '~60 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Barbell Back Squat',            muscle: 'Quads',      type: 'primary',   cue: 'SPEED SQUATS (Norton dynamic effort): ~65–70% of your power-day weight · 3 explosive reps per set · descend controlled, drive UP as fast as possible · stop the set the moment bar speed slows' },
      { name: 'Leg Press',                     muscle: 'Quads',      type: 'secondary', cue: 'Full ROM · feet low and narrow · 2-sec eccentric · don\'t lock out' },
      { name: 'Leg Extension',                 muscle: 'Quads',      type: 'isolation', cue: 'Pause at top 2 sec · 3-sec eccentric · high reps for maximum pump and metabolic stress' },
      { name: 'Romanian Deadlift (RDL)',        muscle: 'Hamstrings', type: 'secondary', cue: 'Hypertrophy session — emphasise the stretch even more than power day. Pause at bottom of each rep' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · plantarflex at top · full stretch at bottom — high reps for maximum hamstring pump' },
      { name: 'Standing Calf Raise',           muscle: 'Calves',     type: 'secondary', cue: 'Full ROM · 2-sec pause at bottom · squeeze hard at top' },
      { name: 'Seated Calf Raise',             muscle: 'Calves',     type: 'isolation', cue: 'Knee bent 90° · targets soleus · full stretch at bottom · high reps finish the calves' },
    ],
  },
  {
    key: 'E',
    name: 'Chest & Arms',
    shortName: 'Chest & Arms',
    day: 'Day 5',
    focus: 'Chest · Biceps · Triceps',
    restTimes: '90 sec compounds · 60 sec isolation',
    duration: '~58 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Barbell Bench Press',           muscle: 'Chest',     type: 'primary',   cue: 'SPEED BENCH (Norton dynamic effort): ~65–70% of your power-day weight · 3 explosive reps per set · controlled down, explode UP · stop the set the moment bar speed drops' },
      { name: 'Incline Dumbbell Press',        muscle: 'Chest',     type: 'secondary', cue: 'Full ROM · pause at full pec stretch · wrists neutral · elbows ~45° from body' },
      { name: 'Cable Chest Fly',              muscle: 'Chest',     type: 'isolation', cue: 'Wide arc · pause at full stretch — lengthened position is the primary hypertrophic driver. High reps, feel the chest working' },
      { name: 'Barbell Curl',                  muscle: 'Biceps',    type: 'secondary', cue: 'Hypertrophy session — elbows fixed, full ROM, supinate at top, 2-sec eccentric' },
      { name: 'Incline DB Curl',              muscle: 'Biceps',    type: 'secondary', cue: 'Long head emphasis on incline — full stretch at bottom, supinate through the curl, squeeze at top' },
      { name: 'EZ-Bar Skull Crusher',          muscle: 'Triceps',   type: 'secondary', cue: 'Lower to forehead · long-head stretch · full lockout · higher reps than power day' },
      { name: 'Cable Overhead Tricep Extension', muscle: 'Triceps', type: 'isolation', cue: 'Face away · cable behind head · elbows close · full overhead stretch — long head under maximal load. Finisher' },
    ],
  },
  {
    key: 'R2',
    name: 'Rest Day',
    shortName: 'Rest',
    day: 'Day 7',
    focus: 'Full Recovery Before Next Power Block',
    restTimes: '',
    isRest: true,
    restRationale: 'Full systemic recovery after 5 training sessions (2 power + 3 hypertrophy). Both CNS and musculature need complete recovery before the next Upper Power session.',
    exercises: [],
  },
]
// ── Week Config ───────────────────────────────────────────────────────────────
// PHAT has two configs per week: one for power days, one for hypertrophy days.
// Power days: low reps, high intensity (~80–88% 1RM)
// Hypertrophy days: moderate-high reps, moderate intensity (~65–75% 1RM)

const DELOAD: (power: boolean) => WeekConfig = (power) => ({
  sets:        { primary: 2, secondary: 2, isolation: 2 },
  reps:        power
                 ? { primary: '3–5', secondary: '3–5', isolation: '5–8' }
                 : { primary: '10–12', secondary: '10–12', isolation: '12–15' },
  rir:         4,
  phase:       'Deload',
  isDeload:    true,
  note:        'Deload week — reduce load ~30%, focus on technique and recovery.',
  percentages: power
                 ? { primary: 0.60, secondary: 0.60, isolation: 0.60 }
                 : { primary: 0.55, secondary: 0.55, isolation: 0.55 },
})

export function getPHATWeekConfig(week: number, dayType?: DayType): WeekConfig {
  const isPower = dayType === 'power'
  const isDeload = week === 4 || week === 8 || week === 12

  if (isDeload) return DELOAD(isPower)

  // Phase 1 — Accumulation (Weeks 1–3): build work capacity
  if (week <= 3) return isPower
    ? { sets: { primary: 3, secondary: 2, isolation: 2 },
        reps: { primary: '3–5', secondary: '3–5', isolation: '5–8' },
        rir: 2, phase: 'Phase 1 — Power Accumulation',
        isDeload: false,
        note: 'Build your power base. Conservative loads to perfect mechanics and establish baseline strength.',
        percentages: { primary: 0.80, secondary: 0.78, isolation: 0.75 } }
    : { sets: { primary: 5, secondary: 3, isolation: 3 },
        reps: { primary: '3 — explosive', secondary: '10–12', isolation: '12–15' },
        rir: 2, phase: 'Phase 1 — Hypertrophy Accumulation',
        isDeload: false,
        note: 'Speed work first (explosive triples at ~65–70% of power-day weight), then high-volume hypertrophy work. Full ROM, muscle feel over load.',
        percentages: { primary: 0.55, secondary: 0.65, isolation: 0.62 } }

  // Phase 2 — Intensification (Weeks 5–7): increase load and intensity
  if (week <= 7) return isPower
    ? { sets: { primary: 3, secondary: 2, isolation: 2 },
        reps: { primary: '3–5', secondary: '3–5', isolation: '5–8' },
        rir: 1, phase: 'Phase 2 — Power Intensification',
        isDeload: false,
        note: 'Increase loads significantly. Leave only 1 rep in reserve on your last power set.',
        percentages: { primary: 0.84, secondary: 0.82, isolation: 0.78 } }
    : { sets: { primary: 6, secondary: 3, isolation: 3 },
        reps: { primary: '3 — explosive', secondary: '10–15', isolation: '12–20' },
        rir: 2, phase: 'Phase 2 — Hypertrophy Intensification',
        isDeload: false,
        note: 'Six explosive triples on the speed movement, then hypertrophy work with slow eccentrics and strong mind-muscle connection.',
        percentages: { primary: 0.58, secondary: 0.68, isolation: 0.64 } }

  // Phase 3 — Peak (Weeks 9–11): peak strength and size expression
  return isPower
    ? { sets: { primary: 4, secondary: 2, isolation: 2 },
        reps: { primary: '2–4', secondary: '3–5', isolation: '5–8' },
        rir: 1, phase: 'Phase 3 — Power Peak',
        isDeload: false,
        note: 'Heaviest loads of the cycle. Push your 3-5RM to new levels.',
        percentages: { primary: 0.87, secondary: 0.84, isolation: 0.80 } }
    : { sets: { primary: 6, secondary: 3, isolation: 3 },
        reps: { primary: '3 — explosive', secondary: '8–12', isolation: '10–15' },
        rir: 1, phase: 'Phase 3 — Hypertrophy Peak',
        isDeload: false,
        note: 'Speed work at its heaviest (still explosive — quality over load), then hypertrophy work at higher intensity for maximum mechanical tension.',
        percentages: { primary: 0.60, secondary: 0.71, isolation: 0.68 } }
}

// ── Program export ────────────────────────────────────────────────────────────
export const PHAT_PROGRAM: import('@/types').Program = {
  id:           'layne-norton-phat',
  name:         'PHAT',
  shortName:    'PHAT',
  author:       'Dr. Layne Norton',
  description:  'Power Hypertrophy Adaptive Training combines heavy compound strength work (3–5 reps) on dedicated power days with high-volume hypertrophy sessions (8–15 reps) to maximise both neurological efficiency and muscle mass simultaneously.',
  focus:        'Strength + Hypertrophy',
  daysPerWeek:  5,
  totalWeeks:   12,
  split:        'Power / Hypertrophy',
  workouts:     PHAT_WORKOUTS,
  getWeekConfig: getPHATWeekConfig,
}
