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
    restTimes: '4 min power movements · ~2.5 min assistance',
    duration: '~60 min',
    dayType: 'power',
    exercises: [
      { name: 'Barbell Bent-Over Row',        muscle: 'Back',      type: 'primary',   cue: 'PULLING POWER (doc: 3×3–5) · bent-over or Pendlay style · hinge 45° · drive elbows back · full recovery between sets — move maximum weight' },
      { name: 'Weighted Pull-Up',              muscle: 'Back',      type: 'secondary', isBodyweight: true, cue: 'Assistance pull (doc: 2×6–10) · dead hang start · full chin over bar · add plate via belt' },
      { name: 'Rack Chins',                    muscle: 'Back',      type: 'secondary', isBodyweight: true, cue: 'Auxiliary pull (doc: 2×6–10) · bar in rack, feet supported on bench · pull chest to bar · slow eccentric' },
      { name: 'Flat Dumbbell Press',           muscle: 'Chest',     type: 'primary',   cue: 'PRESSING POWER (doc: 3×3–5) · heavy dumbbells force stabilisation · full stretch at bottom · press with maximal intent' },
      { name: 'Weighted Dips',                 muscle: 'Chest',     type: 'secondary', isBodyweight: true, cue: 'Assistance press (doc: 2×6–10) · lean forward for chest emphasis · full depth · add plate via belt' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders', type: 'secondary', cue: 'Assistance press (doc: 3×6–10) · neutral spine · press to full lockout · don\'t touch weights at top' },
      { name: 'Cambered Bar Curl',             muscle: 'Biceps',    type: 'secondary', cue: 'Auxiliary curl (doc: 3×6–10) · EZ/cambered bar spares the wrists · elbows fixed · full extension at bottom' },
      { name: 'EZ-Bar Skull Crusher',          muscle: 'Triceps',   type: 'secondary', cue: 'Auxiliary extension (doc: 3×6–10) · lower to forehead · elbows slightly back · full lockout' },
    ],
  },
  {
    key: 'B',
    name: 'Lower Power',
    shortName: 'Lower Power',
    day: 'Day 2',
    focus: 'Quads · Hamstrings · Calves',
    restTimes: '4 min power movements · ~2.5 min assistance',
    duration: '~58 min',
    dayType: 'power',
    exercises: [
      { name: 'Barbell Back Squat',            muscle: 'Quads',      type: 'primary',   cue: 'LOWER POWER (doc: 3×3–5 — the ONE power movement today) · brace hard · sit to depth · full recovery between sets' },
      { name: 'Hack Squat',                    muscle: 'Quads',      type: 'secondary', cue: 'Assistance press (doc: 2×6–10) · controlled depth · drive through mid-foot · machine stability lets you push the quads' },
      { name: 'Leg Extension',                 muscle: 'Quads',      type: 'isolation', cue: 'Assistance extension (doc: 2×6–10) · pause at the top · slow eccentric' },
      { name: 'Stiff-Legged Deadlift',         muscle: 'Hamstrings', type: 'secondary', cue: 'Assistance pull (doc: 3×5–8) · soft knees · push hips back · bar close · deep hamstring stretch — RDL is an acceptable variant' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'secondary', cue: 'Doc: GHR or lying leg curls, 2×6–10 · slow eccentric · plantarflex at peak · full stretch at bottom' },
      { name: 'Standing Calf Raise',           muscle: 'Calves',     type: 'secondary', cue: 'Auxiliary calf (doc: 3×6–10) · full dorsiflexion stretch · pause at top' },
      { name: 'Seated Calf Raise',             muscle: 'Calves',     type: 'isolation', cue: 'Auxiliary calf (doc: 2×6–10) · knee bent targets soleus · full stretch at bottom' },
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
    focus: 'Back · Shoulders · Side Delts',
    restTimes: '≤3 min volume work · 1–2 min hypertrophy work',
    duration: '~60 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Barbell Bent-Over Row',         muscle: 'Back',       type: 'primary',   cue: 'VOLUME WORK (doc: 4×8–10 @ 85% of power weight) · every concentric as FAST as possible · cannot finish cleanly = too heavy' },
      { name: 'Rack Chins',                    muscle: 'Back',       type: 'secondary', isBodyweight: true, cue: 'Doc: 3×8–12 · bar in rack, feet supported · pull chest to bar · squeeze the lats' },
      { name: 'Seated Cable Row',              muscle: 'Back',       type: 'secondary', cue: 'Doc: 3×8–12 · tall spine · drive elbows back · 2-sec hold at contraction' },
      { name: 'Dumbbell Row',                  muscle: 'Back',       type: 'isolation', cue: 'Doc: rows or shrugs, 2×12–15, bracing upper body against an incline bench · full stretch at bottom' },
      { name: 'Close Grip Pulldown',           muscle: 'Back',       type: 'isolation', cue: 'Doc: 2×15–20 · close neutral grip · pull to upper chest · lengthened stretch at top · pump finisher for the lats' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders',  type: 'secondary', cue: 'Doc: 3×8–12 · lighter than power day · controlled eccentric throughout' },
      { name: 'Upright Row',                   muscle: 'Side Delts', type: 'isolation', cue: 'Doc: 2×12–15 · wide grip to bias delts over traps · pull to chest height, not chin · stop if shoulders complain' },
      { name: 'DB Lateral Raise',              muscle: 'Side Delts', type: 'secondary', cue: 'Doc: 3×12–20, dumbbells or cables · 3-sec eccentric · slight lean forward · no momentum' },
    ],
  },
  {
    key: 'D',
    name: 'Lower Hypertrophy',
    shortName: 'Lower Hyper',
    day: 'Day 4',
    focus: 'Quads · Hamstrings · Calves',
    restTimes: '≤3 min volume work · 1–2 min hypertrophy work',
    duration: '~60 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Barbell Back Squat',            muscle: 'Quads',      type: 'primary',   cue: 'VOLUME WORK (doc: 4×8–10 @ 85% of power weight) · controlled down, drive UP as fast as possible · too heavy to finish cleanly = too heavy' },
      { name: 'Hack Squat',                    muscle: 'Quads',      type: 'secondary', cue: 'Doc: 3×8–12 · controlled depth · machine stability lets you chase the quad pump safely' },
      { name: 'Leg Press',                     muscle: 'Quads',      type: 'isolation', cue: 'Doc: 2×12–15 · feet low and narrow · full ROM · don\'t lock out' },
      { name: 'Leg Extension',                 muscle: 'Quads',      type: 'isolation', cue: 'Doc: 3×15–20 · pause at top · slow eccentric · maximum pump and metabolic stress' },
      { name: 'Romanian Deadlift (RDL)',        muscle: 'Hamstrings', type: 'secondary', cue: 'Doc: 3×8–12 · emphasise the stretch even more than power day · pause at the bottom of each rep' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'isolation', cue: 'Doc: 2×12–15 · slow eccentric · plantarflex at top · full stretch at bottom' },
      { name: 'Seated Leg Curl',               muscle: 'Hamstrings', type: 'isolation', cue: 'Doc: 2×15–20 · seated position biases the hamstrings at length (Maeo 2021: superior growth) · pump finisher' },
      { name: 'Donkey Calf Raise',             muscle: 'Calves',     type: 'secondary', cue: 'Doc: 4×10–15 · hinged position stretches the gastrocnemius under load · standing calf raise is an acceptable substitute' },
      { name: 'Seated Calf Raise',             muscle: 'Calves',     type: 'isolation', cue: 'Doc: 3×15–20 · knee bent targets soleus · full stretch · high reps finish the calves' },
    ],
  },
  {
    key: 'E',
    name: 'Chest & Arms',
    shortName: 'Chest & Arms',
    day: 'Day 5',
    focus: 'Chest · Biceps · Triceps',
    restTimes: '≤3 min volume work · 1–2 min hypertrophy work',
    duration: '~58 min',
    dayType: 'hypertrophy',
    exercises: [
      { name: 'Flat Dumbbell Press',           muscle: 'Chest',     type: 'primary',   cue: 'VOLUME WORK (doc: 4×8–10 @ 85% of power weight) · same movement as your pressing power day · explode UP on every rep' },
      { name: 'Incline Dumbbell Press',        muscle: 'Chest',     type: 'secondary', cue: 'Doc: 3×8–12 · full ROM · pause at full pec stretch · elbows ~45° from body' },
      { name: 'Hammer Strength Chest Press',   muscle: 'Chest',     type: 'secondary', cue: 'Doc: 3×12–15 · machine stability · constant tension · chase the pump' },
      { name: 'Incline Cable Fly',             muscle: 'Chest',     type: 'isolation', cue: 'Doc: 2×15–20 · wide arc · pause at full stretch — lengthened position drives growth' },
      { name: 'Cambered Bar Preacher Curl',    muscle: 'Biceps',    type: 'secondary', cue: 'Doc: 3×8–12 · pad kills momentum · full extension at bottom · lengthened biceps under load' },
      { name: 'Concentration Curl',            muscle: 'Biceps',    type: 'isolation', cue: 'Doc: 2×12–15 · elbow braced on thigh · strict · squeeze hard at the top' },
      { name: 'Spider Curl',                   muscle: 'Biceps',    type: 'isolation', cue: 'Doc: 2×15–20, bracing upper body against an incline bench · arms hang vertical · pure pump finisher' },
      { name: 'Seated Tricep Extension',       muscle: 'Triceps',   type: 'secondary', cue: 'Doc: 3×8–12, with cambered bar · overhead position stretches the long head · full lockout' },
      { name: 'Tricep Rope Pushdown',          muscle: 'Triceps',   type: 'isolation', cue: 'Doc: 2×12–15, rope attachment · split the rope at the bottom · elbows pinned' },
      { name: 'Cable Kickback',                muscle: 'Triceps',   type: 'isolation', cue: 'Doc: 2×15–20 · peak-contraction finisher · strict, squeeze at full extension' },
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
                 ? { primary: '3–5', secondary: '6–10', isolation: '6–10' }
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
        reps: { primary: '3–5', secondary: '6–10', isolation: '6–10' },
        rir: 2, phase: 'Phase 1 — Power Accumulation',
        isDeload: false,
        note: 'Build your power base: 3–5 heavy reps on the power movements, assistance at 6–10 (First Edition). Conservative loads, perfect mechanics.',
        percentages: { primary: 0.80, secondary: 0.72, isolation: 0.68 } }
    : { sets: { primary: 4, secondary: 3, isolation: 3 },
        reps: { primary: '8–10 · fast concentric', secondary: '10–12', isolation: '12–15' },
        rir: 2, phase: 'Phase 1 — Hypertrophy Accumulation',
        isDeload: false,
        note: 'Volume work first (First Edition): 4×8–10 at ~85% of your power-day weight, every concentric as fast as possible, ≤3 min rest. Then bodybuilding work — full ROM, muscle feel over load. No failure in the first weeks.',
        percentages: { primary: 0.68, secondary: 0.65, isolation: 0.62 } }

  // Phase 2 — Intensification (Weeks 5–7): increase load and intensity
  if (week <= 7) return isPower
    ? { sets: { primary: 3, secondary: 2, isolation: 2 },
        reps: { primary: '3–5', secondary: '6–10', isolation: '6–10' },
        rir: 1, phase: 'Phase 2 — Power Intensification',
        isDeload: false,
        note: 'Increase loads significantly. Leave only 1 rep in reserve on your last power set; assistance stays at 6–10.',
        percentages: { primary: 0.84, secondary: 0.74, isolation: 0.70 } }
    : { sets: { primary: 4, secondary: 3, isolation: 3 },
        reps: { primary: '8–10 · fast concentric', secondary: '10–15', isolation: '12–20' },
        rir: 2, phase: 'Phase 2 — Hypertrophy Intensification',
        isDeload: false,
        note: 'Volume work first (4×8–10 @ ~85% of power weight, fast concentric), then hypertrophy work with slow eccentrics and strong mind-muscle connection. Failure only on the final 1–2 sets of an exercise.',
        percentages: { primary: 0.71, secondary: 0.68, isolation: 0.64 } }

  // Phase 3 — Peak (Weeks 9–11): peak strength and size expression
  return isPower
    ? { sets: { primary: 4, secondary: 2, isolation: 2 },
        reps: { primary: '2–4', secondary: '6–10', isolation: '6–10' },
        rir: 1, phase: 'Phase 3 — Power Peak',
        isDeload: false,
        note: 'Heaviest loads of the cycle. Push your 3-5RM to new levels; assistance stays at 6–10.',
        percentages: { primary: 0.87, secondary: 0.76, isolation: 0.72 } }
    : { sets: { primary: 4, secondary: 3, isolation: 3 },
        reps: { primary: '8–10 · fast concentric', secondary: '8–12', isolation: '10–15' },
        rir: 1, phase: 'Phase 3 — Hypertrophy Peak',
        isDeload: false,
        note: 'Volume work at its heaviest (4×8–10 @ ~85% of power weight — bar speed is still the intent), then hypertrophy work at higher intensity for maximum mechanical tension.',
        percentages: { primary: 0.74, secondary: 0.71, isolation: 0.68 } }
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
