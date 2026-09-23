import type { Program, WeekConfig, DayType, Workout, Exercise, ExerciseType, WorkoutKey } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Hybrid Compound — 12-Week
//
// Designed for Clint. Brief: four days x ~45 min. Two days loaded
// (barbell / dumbbell / kettlebell / trap bar), two days bodyweight with a
// Tabata block. Compound movements only — nothing that trains one muscle.
//
// Why it is shaped this way:
//   - Hypertrophy: ~10-16 hard sets per muscle per week, each muscle hit
//     at least twice (Schoenfeld 2016 frequency; 2017 dose-response). Every
//     muscle gets one LOADED exposure and one BODYWEIGHT exposure per week.
//   - Long-term health adds what lifting alone does not: VO2max (Tabata,
//     the 1996 protocol, 8 x 20s/10s), power (trap-bar pull, KB clean &
//     press, jumps), grip and carries, single-leg balance.
//   - Load range barely matters for growth if sets are near failure, so
//     the bodyweight days sit on progression LADDERS (push-up -> deficit
//     -> weighted; band pistol -> box -> free) and load returns via belt
//     and vest rather than ever-higher reps.
//   - Elbow: neutral-grip pulling, push-ups instead of dips in block 1,
//     RIR 3 on all pulling until the elbow is quiet.
//
// Three blocks of four weeks. Week 4 of each block is light (one fewer
// set, RIR 3). Block 1 accumulates at the top of each rep range, block 2
// builds at the bottom, block 3 peaks at RIR 1. Week 12 tests pull-ups
// and push-ups with a final-set AMRAP.
// ═══════════════════════════════════════════════════════════════════════

export const HYBRID_ID = 'hybrid-compound-4day'

const clampWk = (w: number) => Math.max(1, Math.min(12, w))
const blockOf = (w: number) => (w <= 4 ? 1 : w <= 8 ? 2 : 3)
const isLight = (w: number) => [4, 8, 12].includes(w)
const posInBlock = (w: number) => ((w - 1) % 4) + 1   // 1..4

/** RIR by block and position: light weeks always RIR 3. */
function rirFor(week: number): number {
  if (isLight(week)) return 3
  const b = blockOf(week), p = posInBlock(week)
  if (b === 1) return p === 3 ? 2 : 3
  if (b === 2) return p === 3 ? 1 : 2
  return 1
}

/** Reps by block: top of range in block 1, bottom in blocks 2-3. */
function repsFor(range: [number, number], week: number): number {
  return blockOf(week) === 1 ? range[1] : range[0]
}

// ── Slot model ──────────────────────────────────────────────────────────
type Ladder = [string, string, string]   // exercise name for block 1, 2, 3

interface Slot {
  name: string | Ladder
  muscle: string
  type: ExerciseType
  cue: string | Ladder
  isBodyweight?: boolean
  sets: number
  range?: [number, number] | [[number, number], [number, number], [number, number]]   // fixed, or per block as the ladder climbs
  perSide?: boolean
  amrapWk12?: boolean
  /** Fixed-duration hold or carry — seconds by block, rest between sets. */
  timed?: { secs: [number, number, number]; rest: number }
  /** Tabata block — movement pairs by block. */
  tabata?: [string[], string[], string[]]
}

const pick = <T,>(v: T | [T, T, T], week: number): T =>
  Array.isArray(v) ? (v as [T, T, T])[blockOf(week) - 1] : (v as T)

// ── The four days ───────────────────────────────────────────────────────
const DAYS: { key: WorkoutKey; name: string; shortName: string; focus: string; loaded: boolean; slots: Slot[] }[] = [
  {
    key: 'A', name: 'Weighted A — Lower', shortName: 'Weighted · Lower', focus: 'Quads · Hamstrings · Back · Chest · Grip', loaded: true,
    slots: [
      { name: 'Back Squat', muscle: 'Quads', type: 'primary', sets: 4, range: [6, 8],
        cue: 'Brace, sit between the heels · full depth · drive the floor away' },
      { name: 'Romanian Deadlift', muscle: 'Hamstrings', type: 'primary', sets: 3, range: [8, 10],
        cue: 'Hips back, bar slides down the thighs · shins vertical · stretch, then stand' },
      { name: ['Neutral-Grip Pull-Up', 'Weighted Pull-Up', 'Weighted Pull-Up'], muscle: 'Back', type: 'primary', isBodyweight: true, sets: 3, range: [6, 8],
        cue: ['Neutral grip · bodyweight this block · 3-sec lower · full hang', 'Neutral grip, belt on · full hang · chin clears the bar', 'Neutral grip, belt on · full hang · chin clears the bar'] },
      { name: 'Dumbbell Bench Press', muscle: 'Chest', type: 'primary', sets: 4, range: [8, 10],
        cue: 'Shoulder blades pinned · elbows ~45° · touch the chest, press to lockout' },
      { name: "Farmer's Carry", muscle: 'Core', type: 'secondary', sets: 3,
        timed: { secs: [40, 45, 50], rest: 90 },
        cue: 'Kettlebells, dumbbells or trap bar — heavy · tall, ribs down · walk the clock out, no leaning · log the TOTAL load' },
    ],
  },
  {
    key: 'B', name: 'Bodyweight A — Push · Legs · Tabata', shortName: 'Bodyweight · Push', focus: 'Chest · Quads · Glutes · Core · VO2max', loaded: false,
    slots: [
      { name: ['Push-Up', 'Deficit Push-Up', 'Weighted Push-Up'], muscle: 'Chest', type: 'primary', isBodyweight: true, sets: 4, range: [[12, 15], [10, 12], [8, 10]], amrapWk12: true,
        cue: ['Chest to floor · rigid plank · elbows ~45° · push-ups until the elbow is quiet', 'Hands on the dip bars · chest below hand level · full lockout', 'Vest on · chest to floor · same rigid plank'] },
      { name: ['Band-Assisted Pistol Squat', 'Box Pistol Squat', 'Pistol Squat'], muscle: 'Quads', type: 'primary', isBodyweight: true, sets: 3, range: [6, 8], perSide: true,
        cue: ['Band under the foot, held at the chest · sit all the way down · heel stays down', 'Sit back onto the box · heel down · same reps each leg', 'Free pistol · heel down · arms forward for balance'] },
      { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', sets: 3, range: [8, 10],
        cue: 'Shoulders on the bench · chin tucked · full lockout, 1-sec squeeze at the top' },
      { name: ['Hollow Hold', 'Hollow Hold', 'L-Sit'], muscle: 'Core', type: 'isolation', isBodyweight: true, sets: 3,
        timed: { secs: [30, 40, 20], rest: 45 },
        cue: ['Lower back pinned to the floor · shoulders and legs off · hold', 'Lower back pinned · arms overhead, legs lower · hold', 'On the dip bars · legs straight and level · hold'] },
      { name: 'Tabata', muscle: 'Core', type: 'isolation', isBodyweight: true, sets: 1,
        tabata: [['Jump Rope', 'Burpees'], ['Jump Rope', 'Skater Jumps'], ['Burpees', 'Squat Jumps']],
        cue: '8 rounds · 20s all-out, 10s off · alternate the two movements · hardest pace you can repeat' },
    ],
  },
  {
    key: 'C', name: 'Weighted B — Upper', shortName: 'Weighted · Upper', focus: 'Hinge · Shoulders · Back · Quads · Power', loaded: true,
    slots: [
      { name: 'Trap Bar Deadlift', muscle: 'Glutes', type: 'primary', sets: 4, range: [5, 6],
        cue: 'Heavy and fast off the floor · chest up · stand tall, no hitch' },
      { name: 'Overhead Press', muscle: 'Shoulders', type: 'primary', sets: 4, range: [6, 8],
        cue: 'Glutes tight, ribs down · bar travels straight · head through at the top' },
      { name: 'Chest-Supported Row', muscle: 'Back', type: 'primary', sets: 3, range: [8, 10],
        cue: 'Neutral grip · pull the elbows to the hips · pause with the blades together' },
      { name: 'Bulgarian Split Squat', muscle: 'Quads', type: 'secondary', sets: 3, range: [8, 10], perSide: true,
        cue: 'Dumbbells at the sides · rear foot on the bench · front knee tracks the toes' },
      { name: 'Kettlebell Clean & Press', muscle: 'Shoulders', type: 'secondary', sets: 3, range: [5, 5], perSide: true,
        cue: 'Hips drive the clean · soft catch at the rack · strict press · same reps each arm' },
    ],
  },
  {
    key: 'D', name: 'Bodyweight B — Pull · Posterior · Tabata', shortName: 'Bodyweight · Pull', focus: 'Back · Hamstrings · Core · VO2max', loaded: false,
    slots: [
      { name: ['Neutral-Grip Pull-Up', 'Weighted Pull-Up', 'Weighted Pull-Up'], muscle: 'Back', type: 'primary', isBodyweight: true, sets: 4, range: [6, 8], amrapWk12: true,
        cue: ['Neutral grip · bodyweight · 3-sec lower · stop one rep short', 'Neutral grip, belt on · full hang each rep', 'Neutral grip, belt on · full hang each rep'] },
      { name: ['Inverted Row', 'Feet-Elevated Inverted Row', 'Weighted Inverted Row'], muscle: 'Back', type: 'secondary', isBodyweight: true, sets: 3, range: [[10, 15], [10, 12], [8, 10]],
        cue: ['Body rigid · pull the chest to the bar · pause at the top', 'Feet on the box · body rigid · chest to the bar', 'Vest or plate on the chest · body rigid · chest to the bar'] },
      { name: 'Sliding Leg Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, sets: 3, range: [8, 12],
        cue: 'Bridge on the heels, towel or sliders · drag the heels in, hips stay high · single-leg when 12 is easy' },
      { name: ['Hanging Knee Raise', 'Hanging Leg Raise', 'Toes-to-Bar'], muscle: 'Core', type: 'isolation', isBodyweight: true, sets: 3, range: [[8, 12], [8, 12], [6, 10]],
        cue: ['Dead hang · knees to the chest · no swing', 'Dead hang · straight legs to 90° or higher · no swing', 'Dead hang · toes touch the bar · controlled lower'] },
      { name: 'Tabata', muscle: 'Core', type: 'isolation', isBodyweight: true, sets: 1,
        tabata: [['Squat Jumps', 'Mountain Climbers'], ['Jumping Lunges', 'Mountain Climbers'], ['Jump Rope', 'Burpees']],
        cue: '8 rounds · 20s all-out, 10s off · alternate the two movements · hardest pace you can repeat' },
    ],
  },
]

const TABATA = { rounds: 8, work: 20, rest: 10 }
const tabataName = (m: string[]) => `Tabata · ${m.join(' + ')}`

function slotName(s: Slot, week: number): string {
  if (s.tabata) return tabataName(pick(s.tabata, week))
  return pick(s.name, week)
}

function buildWorkout(week: number, d: typeof DAYS[number], idx: number): Workout {
  const light = isLight(week)
  const exercises: Exercise[] = d.slots.map(s => ({
    name: slotName(s, week), muscle: s.muscle, type: s.type,
    isBodyweight: !!s.isBodyweight,
    cue: pick(s.cue, week),
  }))
  return {
    key: d.key, name: d.name + (light ? ' · Light' : ''), shortName: d.shortName, day: `Day ${idx + 1}`, focus: d.focus,
    dayType: 'hypertrophy' as DayType, isRest: false, duration: '~45 min',
    restTimes: d.loaded ? '2 min main lifts · 90 sec others · carries as prescribed' : '90 sec strength · 45 sec holds · Tabata 20/10',
    exercises,
  }
}

export function hybridWorkouts(week: number): Workout[] {
  const w = clampWk(week)
  return DAYS.map((d, i) => buildWorkout(w, d, i))
}

export function hybridPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const w = clampWk(week)
  const day = DAYS.find(d => d.key === dayKey)
  const s = day?.slots.find(s => slotName(s, w) === exerciseName)
  if (!s) return null
  const light = isLight(w)

  if (s.tabata) {
    const movements = pick(s.tabata, w)
    const rounds = w === 1 ? 6 : TABATA.rounds   // first exposure: six rounds
    return {
      sets: 1, reps: 1, rir: 0, pct: 0, protocol: 'tabata', noOneRm: true,
      rounds, workSec: TABATA.work, restSec: TABATA.rest, movements,
      seconds: rounds * (TABATA.work + TABATA.rest),
      repsLabel: `${rounds} × ${TABATA.work}/${TABATA.rest}`,
    }
  }

  if (s.timed) {
    const secs = pick(s.timed.secs, w)
    return { sets: light ? Math.max(2, s.sets - 1) : s.sets, reps: 1, rir: 0, pct: 0,
      seconds: secs, restSec: s.timed.rest, repsLabel: `${secs}s`, noOneRm: true }
  }

  const rawRange = s.range ?? [8, 10]
  const range: [number, number] = Array.isArray(rawRange[0]) ? (rawRange as [[number, number], [number, number], [number, number]])[blockOf(w) - 1] : (rawRange as [number, number])
  const reps = repsFor(range, w)
  const rir = rirFor(w)
  const sets = light ? Math.max(2, s.sets - 1) : s.sets
  const label = (range[0] === range[1] ? `${range[0]}` : `${range[0]}-${range[1]}`) + (s.perSide ? '/side' : '')
  const rx: Prescription = { sets, reps, rir, pct: rtfPercent(reps, rir), repsLabel: label }
  if (s.amrapWk12 && w === 12) {
    rx.amrap = true
    rx.testNote = 'Final set: as many clean reps as you can. Compare with week 1 — that number, not the scale, is the report card.'
  }
  return rx
}

export function getHybridWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const w = clampWk(week)
  const block = blockOf(w)
  const light = isLight(w)
  const rir = rirFor(w)
  const name = block === 1 ? 'Block 1 — Accumulate' : block === 2 ? 'Block 2 — Build' : 'Block 3 — Peak'
  return {
    sets: { primary: 4, secondary: 3, isolation: 3 },
    reps: { primary: block === 1 ? '8' : '6', secondary: block === 1 ? '10' : '8', isolation: '30s' },
    rir,
    phase: `${name} (week ${w})${light ? ' · Light' : ''}${w === 12 ? ' · Test' : ''}`,
    isDeload: light,
    note: w === 12
      ? 'Final week. Light on everything, then the last set of push-ups and pull-ups is AMRAP — your report card against week 1.'
      : light
        ? 'Light week: one fewer set on everything, three reps in reserve, Tabata still on. Recovery is where the last three weeks become muscle.'
        : block === 1
          ? 'Accumulate. Top of every rep range, three reps in reserve. The elbow paces the pulling: neutral grip, bodyweight only, slow lowers. Push-ups, not dips.'
          : block === 2
            ? 'Build. Bottom of every rep range, loads climb. Belt goes on the pull-ups, push-ups move to the dip bars, pistols move to the box. Tabata movements rotate.'
            : 'Peak. One rep in reserve on the last sets. Vest on the push-ups, free pistols, weighted rows, toes-to-bar. Week 12 tests.',
    percentages: { primary: rtfPercent(block === 1 ? 8 : 6, rir), secondary: rtfPercent(block === 1 ? 10 : 8, rir), isolation: 0 },
  }
}

export const HYBRID_PROGRAM: Program = {
  id:            HYBRID_ID,
  name:          'Hybrid Compound — 12-Week',
  shortName:     'Hybrid Compound',
  author:        'Designed for Clint · evidence-based',
  description:   'Four days, about forty-five minutes, compound movements only. Two days are loaded — squat, trap-bar pull, RDL, presses, rows, carries with barbell, dumbbells and kettlebell — and two are bodyweight with a four-minute Tabata block. Every muscle gets one heavy exposure and one bodyweight exposure a week, twelve-plus hard sets across the two, which is where the hypertrophy research puts the sweet spot. Tabata covers VO2max, the trap bar and kettlebell cover power, carries cover grip. Bodyweight movements sit on progression ladders so load keeps climbing without isolation work. Block one is paced by the elbow.',
  focus:         'Compound Only · Hypertrophy · Longevity',
  daysPerWeek:   4,
  totalWeeks:    12,
  split:         'Weighted Lower / BW Push / Weighted Upper / BW Pull',
  workouts:      hybridWorkouts(1),
  getWeekConfig: getHybridWeekConfig,
}
