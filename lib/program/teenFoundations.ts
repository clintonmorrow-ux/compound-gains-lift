import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Teen Foundations — 3-Day
//
// Built on the NSCA Youth Resistance Training position statement and the
// Long-Term Athletic Development framework, NOT copied from any branded
// program. Design rules, and why each one is here:
//
//   • Non-barbell dominant. Dumbbells, machines, cables and bodyweight
//     carry the load. A failed goblet squat puts a bell on the floor; a
//     failed back squat puts a loaded bar on a growing spine.
//   • Trap bar is the one loaded barbell movement — neutral handles and
//     a centred load make it the most forgiving first heavy hinge.
//   • Straight-bar squat, hinge and bench appear ONLY as unloaded
//     technique practice at the start of each session, flagged so they
//     never feed 1RM estimation. They graduate to loaded work through
//     the swap menu when technique earns it — not on a schedule.
//   • RIR never drops below 2, and there is no AMRAP, no failure work
//     and no 1RM testing anywhere in the twelve weeks. Sets end when
//     technique degrades, not when the athlete does.
//   • Full body three times a week on non-consecutive days, which is the
//     structure the youth literature supports for beginners.
//   • Volume progresses before load: 2 sets → 3 sets, RIR 4 → 3 → 2,
//     with a lighter week closing each four-week block.
//
// Weight targets come from the reps-to-failure model like the other
// programs, but with the conservative RIR floor they stay well clear of
// maximal loading by design.
// ═══════════════════════════════════════════════════════════════════════

export const TEEN_FOUNDATIONS_ID = 'teen-foundations-3day'

/** Unloaded skill practice — an anchor only, never 1RM evidence. */
const TECHNIQUE_PCT = 0.30

const TECHNIQUE_NOTE =
  'Technique practice, not a working set. Empty bar or the lightest bar available. ' +
  'The goal is a clean, repeatable pattern — if any rep looks different from the one before it, stop the set. ' +
  'These never count toward your 1RM.'

/** Block shape: [sets, repsLow, repsHigh, rir] by week. */
function blockShape(week: number): [number, number, number, number] {
  const light = week % 4 === 0            // weeks 4, 8, 12 close each block
  if (week <= 4)  return light ? [2, 8, 10, 4] : [2, 10, 12, 4]
  if (week <= 8)  return light ? [2, 8, 10, 4] : [3, 8, 12, 3]
  return            light ? [2, 8, 10, 4] : [3, 8, 10, 2]
}

interface Slot {
  name: string
  muscle: string
  type: 'primary' | 'secondary' | 'isolation'
  cue: string
  technique?: boolean          // unloaded skill practice
  repsOverride?: [number, number]
}

const DAY_A: Slot[] = [
  { name: 'Barbell Back Squat', muscle: 'Quads', type: 'primary', technique: true,
    cue: 'SKILL WORK · empty bar · brace, sit between the hips, knees track over the toes. Same rep every rep.' },
  { name: 'Goblet Squat', muscle: 'Quads', type: 'primary',
    cue: 'Bell at the chest keeps you upright · elbows inside the knees at the bottom · stand up tall' },
  { name: 'Trap Bar Deadlift', muscle: 'Hamstrings', type: 'primary',
    cue: 'Neutral handles keep the load centred · push the floor away · finish tall, do not lean back' },
  { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'secondary',
    cue: 'Shoulder blades pinned to the bench · bells travel over the chest · controlled all the way down' },
  { name: 'Chest-Supported Machine Row', muscle: 'Back', type: 'secondary',
    cue: 'Chest stays on the pad · drive the elbows back · squeeze, then control the return' },
  { name: 'Plank', muscle: 'Core', type: 'isolation',
    cue: 'Straight line from ear to ankle · ribs down, glutes squeezed · stop when the hips start to sag' },
]

const DAY_B: Slot[] = [
  { name: 'Barbell RDL', muscle: 'Hamstrings', type: 'primary', technique: true,
    cue: 'SKILL WORK · empty bar · push the hips back, bar stays against the legs, spine stays long. The hardest pattern to learn — take your time.' },
  { name: 'DB Romanian Deadlift', muscle: 'Hamstrings', type: 'primary',
    cue: 'Hips back, soft knees · feel the hamstrings load · stop where your back would start to round' },
  { name: 'Bulgarian Split Squat (DB)', muscle: 'Quads', type: 'secondary', repsOverride: [8, 10],
    cue: 'Rear foot on the bench · most of the weight through the front leg · same reps each side' },
  { name: 'Assisted Pull-Up Machine', muscle: 'Back', type: 'secondary',
    cue: 'Full hang at the bottom · chin over the bar · reduce the assistance as you get stronger' },
  { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary',
    cue: 'Back supported · press to a full lockout · ribs stay down, no arching to move the weight' },
  { name: "Farmer's Carry", muscle: 'Core', type: 'isolation',
    cue: 'Tall posture, shoulders back · walk slow and controlled · grip and core do the work' },
]

const DAY_C: Slot[] = [
  { name: 'Bench Press', muscle: 'Chest', type: 'primary', technique: true,
    cue: 'SKILL WORK · empty bar · shoulder blades set, feet planted, bar to the same spot every rep. Always use a rack with safeties.' },
  { name: 'Leg Press', muscle: 'Quads', type: 'primary', repsOverride: [12, 15],
    cue: 'Full range without the lower back rounding off the pad · do not lock the knees hard at the top' },
  { name: 'DB Hip Thrust', muscle: 'Glutes', type: 'secondary',
    cue: 'Shoulders on the bench · chin tucked · squeeze the glutes at the top, ribs stay down' },
  { name: 'Neutral Grip Pull-Down', muscle: 'Back', type: 'secondary',
    cue: 'Full stretch overhead · pull to the upper chest · lead with the elbows, not the hands' },
  { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'secondary',
    cue: 'Bench around 30 degrees · full stretch at the bottom · press the bells together at the top' },
  { name: 'Face Pull', muscle: 'Rear Delts', type: 'isolation', repsOverride: [12, 15],
    cue: 'Pull to the face, elbows high · rotate the hands back at the end · shoulder health work, keep it light' },
  { name: 'Deadbugs', muscle: 'Core', type: 'isolation', repsOverride: [8, 10],
    cue: 'Lower back stays flat on the floor · slow opposite arm and leg · breathe out as you extend' },
]

const DAYS: Record<string, Slot[]> = { A: DAY_A, B: DAY_B, C: DAY_C }

const DAY_META: Record<string, [string, string, string]> = {
  A: ['Full Body A', 'Day 1', 'Squat · Hinge · Push · Pull · Core'],
  B: ['Full Body B', 'Day 2', 'Hinge · Single Leg · Vertical Pull · Press · Carry'],
  C: ['Full Body C', 'Day 3', 'Legs · Glutes · Pull · Press · Shoulder Health'],
}

const WORKOUTS: Workout[] = (['A', 'B', 'C'] as const).map(key => {
  const [short, day, focus] = DAY_META[key]
  return {
    key,
    name: short,
    shortName: short,
    day,
    focus,
    dayType: 'hypertrophy' as DayType,
    isRest: false,
    duration: '~35-50 min',
    restTimes: '2 min main lifts · 90 sec accessories · 60 sec core',
    exercises: DAYS[key].map(s => ({ name: s.name, muscle: s.muscle, type: s.type, cue: s.cue })),
  }
})

export function teenFoundationsWorkouts(_week: number): Workout[] { return WORKOUTS }

export function teenFoundationsPrescription(
  dayKey: string, exerciseName: string, week: number,
): Prescription | null {
  const slot = DAYS[dayKey]?.find(s => s.name === exerciseName)
  if (!slot) return null

  if (slot.technique) {
    return { sets: 2, reps: 8, rir: 5, pct: TECHNIQUE_PCT, repsLabel: '8 · technique',
             noOneRm: true, testNote: TECHNIQUE_NOTE }
  }

  const [sets, lo, hi, rir] = blockShape(week)
  const [rLo, rHi] = slot.repsOverride ?? [lo, hi]
  const mid = Math.round((rLo + rHi) / 2)
  return { sets, reps: mid, rir, pct: rtfPercent(mid, rir), repsLabel: `${rLo}-${rHi}` }
}

export function getTeenFoundationsWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const [sets, lo, hi, rir] = blockShape(week)
  const light = week % 4 === 0
  const block = week <= 4 ? 1 : week <= 8 ? 2 : 3
  const phaseName = block === 1 ? 'Block 1 — Movement Foundations'
                  : block === 2 ? 'Block 2 — Adding Load'
                  : 'Block 3 — Consolidation'
  return {
    sets:  { primary: sets, secondary: sets, isolation: sets },
    reps:  { primary: `${lo}-${hi}`, secondary: `${lo}-${hi}`, isolation: `${lo}-${hi}` },
    rir,
    phase: light ? `${phaseName} · Lighter Week` : phaseName,
    isDeload: light,
    note: light
      ? 'Lighter week to close the block. Same movements, less work — a good week to film a set and check your positions.'
      : block === 1
        ? 'Learn the patterns before you chase weight. Every session opens with empty-bar skill work; the loaded sets stay well short of failure so technique stays clean.'
        : block === 2
          ? 'Volume steps up to three sets. Add weight only when all your reps look the same as the first one.'
          : 'Final block. Slightly heavier and slightly lower reps, but still two reps in reserve on every set — no maxes, no grinding.',
    percentages: {
      primary:   rtfPercent(Math.round((lo + hi) / 2), rir),
      secondary: rtfPercent(Math.round((lo + hi) / 2), rir),
      isolation: rtfPercent(Math.round((lo + hi) / 2), rir),
    },
  }
}

export const TEEN_FOUNDATIONS_PROGRAM: Program = {
  id:            TEEN_FOUNDATIONS_ID,
  name:          'Teen Foundations — 3-Day',
  shortName:     'Teen Foundations',
  author:        'Built on NSCA youth training guidelines',
  description:   'Twelve weeks, three full-body days a week, designed to teach a young athlete how to lift before asking them to lift heavy. Dumbbells, machines and bodyweight carry the load; the trap bar is the one loaded barbell movement. Straight-bar squat, hinge and bench appear only as empty-bar skill practice at the start of each session and graduate to loaded work through the swap menu when technique earns it. Nothing goes to failure, nothing is tested for a max, and RIR never drops below 2 — sets end when form changes, not when the athlete runs out. Volume builds before weight does.',
  focus:         'Foundations · Youth Athlete',
  daysPerWeek:   3,
  totalWeeks:    12,
  split:         'Full Body · 3-Day',
  workouts:      WORKOUTS,
  getWeekConfig: getTeenFoundationsWeekConfig,
}
