// ──────────────────────────────────────────────────────────────────────────────
// LONGEVITY — Sustainable Strength (5-day upper/lower, pressure-aware)
//
// The 5-day evolution of the original 3-day full-body version. Same protective
// philosophy, spread across an upper/lower split so every session stays concise
// (~40–45 min, 5–6 exercises) and every muscle is still trained ~2×/week:
//   • Machine & supported movements, moderate loads, 8–15 reps.
//   • ALWAYS 2–3 reps in reserve — never to failure. Exhale through the hard
//     part of every rep; never hold your breath under load.
//   • No heavy barbell back squat / conventional deadlift / heavy overhead
//     barbell press. Hinging via moderate-DB RDLs and cable pull-throughs.
//   • Trunk work (dead bug, bird dog, Pallof) that builds stability without
//     the pressure spike of weighted crunches.
//   • One dedicated Zone-2 cardio day + one full rest day. For a second easy
//     cardio session, add 20 conversational minutes after any lift day.
//
// NOT medical advice. Stop any movement that produces bulging, pain, or pressure.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

export const LONGEVITY_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Upper · Push',
    shortName: 'Upper Push',
    day: 'Day 1',
    focus: 'Chest · Shoulders · Triceps · Core',
    restTimes: '60–90 sec — unhurried, you should feel recovered',
    duration: '~40 min',
    dayType: 'standard',
    exercises: [
      { name: 'Hammer Strength Incline Press', muscle: 'Chest',      type: 'primary',   cue: 'Torso supported · press out smoothly, return slow over 2–3 sec · exhale as you press. All the chest work, none of the barbell bracing.' },
      { name: 'Chest Press Machine',           muscle: 'Chest',      type: 'secondary', cue: 'Flat pressing line · smooth out, slow back · stop 2–3 reps shy of failure — never grind.' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders',  type: 'secondary', cue: 'Back against the pad · light-to-moderate dumbbells · EXHALE on the press. The only overhead work in the plan — supported and submaximal on purpose.' },
      { name: 'Cable Lateral Raise',           muscle: 'Side Delts', type: 'isolation', cue: 'Light cable · raise to shoulder height · slow lower · round shoulders without overhead strain.' },
      { name: 'Tricep Rope Pushdown',          muscle: 'Triceps',    type: 'isolation', cue: 'Press down and spread the rope at the bottom · controlled return · zero trunk strain.' },
      { name: 'Pallof Press (per side)',       muscle: 'Core',       type: 'isolation', cue: 'Cable at chest height, stand side-on · press straight out and resist the twist · breathe normally throughout.' },
    ],
  },
  {
    key: 'B',
    name: 'Lower · Quads',
    shortName: 'Lower Quad',
    day: 'Day 2',
    focus: 'Quads · Hamstrings · Calves · Core',
    restTimes: '60–90 sec — unhurried',
    duration: '~40 min',
    dayType: 'standard',
    exercises: [
      { name: 'Leg Press',                     muscle: 'Quads',      type: 'primary',   cue: 'Back fully supported · push up smoothly, lower over 3 sec · exhale on the press, never hold your breath.' },
      { name: 'Bulgarian Split Squat (DB)',    muscle: 'Quads',      type: 'secondary', cue: 'Rear foot on a bench · moderate dumbbells at your sides · big stimulus at low total load — easy on the trunk.' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'secondary', cue: 'Smooth curl, slow return · hamstrings with zero trunk pressure.' },
      { name: 'Standing Calf Raise',           muscle: 'Calves',     type: 'isolation', cue: 'Full stretch at the bottom · pause at the top · slow lower.' },
      { name: 'Dead Bug',                      muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'Low back flat · lower opposite arm and leg slowly · KEEP BREATHING — stability without the pressure spike.' },
    ],
  },
  {
    key: 'C',
    name: 'Upper · Pull',
    shortName: 'Upper Pull',
    day: 'Day 3',
    focus: 'Back · Rear Delts · Biceps',
    restTimes: '60–90 sec — unhurried',
    duration: '~40 min',
    dayType: 'standard',
    exercises: [
      { name: 'Lat Pulldown',                  muscle: 'Back',       type: 'primary',   cue: 'Pull to the upper chest · controlled return · seated and braced against the pad.' },
      { name: 'Seated Cable Row (Wide)',       muscle: 'Back',       type: 'secondary', cue: 'Sit tall, chest up · drive the elbows back, squeeze the blades · upright and supported, no spinal loading.' },
      { name: 'Face Pull',                     muscle: 'Rear Delts', type: 'isolation', cue: 'Rope at face height · pull toward the forehead, elbows high · the best shoulder-health movement there is.' },
      { name: 'Incline DB Curl',               muscle: 'Biceps',     type: 'isolation', cue: 'Seated on an incline · slow full curls · feel-good-in-a-t-shirt work, no need to go heavy.' },
      { name: 'Hammer Curl',                   muscle: 'Biceps',     type: 'isolation', cue: 'Neutral grip · smooth curls · builds the forearm side of the arm.' },
    ],
  },
  {
    key: 'R1', name: 'Zone-2 Cardio', shortName: 'Cardio', day: 'Day 4',
    focus: 'Easy aerobic · 30–40 min', restTimes: '', isRest: true,
    restRationale: 'Zone 2 means conversational pace — you can talk in full sentences the whole time. Bike, incline walk, row, or swim for 30–40 minutes. Deliberately the opposite of a metcon: no breath-holding, no straining, no impact. Want a second cardio session this week? Add 20 easy minutes after any lift day.',
    exercises: [],
  },
  {
    key: 'D',
    name: 'Lower · Hinge & Glutes',
    shortName: 'Lower Hinge',
    day: 'Day 5',
    focus: 'Hamstrings · Glutes · Core',
    restTimes: '60–90 sec — unhurried',
    duration: '~40 min',
    dayType: 'standard',
    exercises: [
      { name: 'Romanian Deadlift (RDL)',       muscle: 'Hamstrings', type: 'primary',   cue: 'Moderate DUMBBELLS, never a heavy barbell · hips back, soft knees, flat back, hinge to mid-shin · EXHALE as you stand. Any pressure — lighten it.' },
      { name: 'Cable Pull-Through',            muscle: 'Glutes',     type: 'secondary', cue: 'Face away from a low cable · hinge and drive the hips forward to stand tall · glutes and hams with ZERO spinal load.' },
      { name: 'Leg Extension',                 muscle: 'Quads',      type: 'secondary', cue: 'Light-to-moderate · smooth extension, slow lower · quad volume with the back fully supported.' },
      { name: 'Hip Abduction',                 muscle: 'Glutes',     type: 'isolation', cue: 'Knees out against the pads · strengthens the side hips that keep you steady.' },
      { name: 'Bird Dog',                      muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'Hands and knees · extend opposite arm and leg, hold 2 sec · trunk control while breathing normally.' },
    ],
  },
  {
    key: 'E',
    name: 'Upper · Balanced',
    shortName: 'Upper Mix',
    day: 'Day 6',
    focus: 'Chest · Back · Shoulders',
    restTimes: '60–90 sec — unhurried',
    duration: '~40 min',
    dayType: 'standard',
    exercises: [
      { name: 'Incline Dumbbell Press',        muscle: 'Chest',      type: 'primary',   cue: 'Moderate dumbbells · press up and slightly together · slow lower · stop well shy of failure.' },
      { name: 'Seated Cable Row (Wide)',       muscle: 'Back',       type: 'secondary', cue: 'Second rowing session of the week · tall chest, elbows back · posture strength, zero spinal load.' },
      { name: 'Machine Lateral Raise',         muscle: 'Side Delts', type: 'secondary', cue: 'Supported by the machine · raise smoothly to shoulder height · a touch more delt volume for the week.' },
      { name: 'Reverse Cable Fly',             muscle: 'Rear Delts', type: 'isolation', cue: 'Cross the cables · open the arms wide · rear delts and upper back — the anti-desk-posture finisher.' },
      { name: 'Pallof Press (per side)',       muscle: 'Core',       type: 'isolation', cue: 'Second anti-rotation session · press out, resist the twist, breathe the whole time.' },
    ],
  },
  {
    key: 'R2', name: 'Rest Day', shortName: 'Rest', day: 'Day 7',
    focus: 'Full Recovery · Optional walk', restTimes: '', isRest: true,
    restRationale: 'Full recovery before the week begins again. An easy walk is perfect — circulation without strain. Five concise sessions with every muscle trained twice is a complete week; the goal is decades, not weeks.',
    exercises: [],
  },
]

export function getLongevityWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week === 4 || week === 8 || week === 12
  if (isDeload) return {
    sets: { primary: 2, secondary: 1, isolation: 1 },
    reps: { primary: '12–15', secondary: '12–15', isolation: '12–15' },
    rir: 4, phase: 'Easy Week', isDeload: true,
    note: 'A lighter week. Drop the loads, keep the movements smooth, and let everything recover. You will come back feeling stronger.',
    percentages: { primary: 0.50, secondary: 0.48, isolation: 0.45 },
  }
  if (week <= 3) return {
    sets: { primary: 2, secondary: 2, isolation: 2 },
    reps: { primary: '10–12', secondary: '10–12', isolation: '12–15' },
    rir: 3, phase: 'Phase 1 — Groove the Movements', isDeload: false,
    note: 'Settle into each session at comfortable weights. Finish every set feeling you had 3 solid reps left. Exhale through the effort — never hold your breath.',
    percentages: { primary: 0.58, secondary: 0.56, isolation: 0.52 },
  }
  if (week <= 7) return {
    sets: { primary: 3, secondary: 2, isolation: 2 },
    reps: { primary: '8–12', secondary: '10–12', isolation: '12–15' },
    rir: 3, phase: 'Phase 2 — Steady & Strong', isDeload: false,
    note: 'Nudge the weight up only where a movement feels genuinely easy and controlled. Still 2–3 reps in reserve, every set.',
    percentages: { primary: 0.62, secondary: 0.60, isolation: 0.55 },
  }
  return {
    sets: { primary: 3, secondary: 2, isolation: 2 },
    reps: { primary: '8–12', secondary: '10–12', isolation: '12–15' },
    rir: 2, phase: 'Phase 3 — Maintain', isDeload: false,
    note: 'A touch more effort if you feel good — but the rules never change: 2 reps shy of failure, moderate loads, exhale through every rep.',
    percentages: { primary: 0.65, secondary: 0.62, isolation: 0.58 },
  }
}

export const LONGEVITY_PROGRAM: Program = {
  id:           'longevity-3day',   // id kept stable so existing users' active program & history stay linked
  name:         'Longevity — Sustainable Strength',
  shortName:    'Longevity 5-Day',
  author:       'Pressure-aware upper/lower training (ACSM-aligned)',
  description:  'A 5-day upper/lower program for maintaining muscle and feeling good for the long run, built to train around intra-abdominal pressure issues like hernia and hemorrhoid history. Five concise ~40-minute sessions hit every muscle about twice a week using machine and supported movements, moderate loads, 8–15 reps, and always 2–3 reps in reserve — never to failure, always exhaling through the effort. No heavy barbell squats, deadlifts, or overhead presses; hinging is done with moderate dumbbells and cables. One dedicated Zone-2 cardio day and one full rest day round out the week — add 20 easy minutes after any lift for a second cardio session. Not medical advice.',
  focus:        'Maintain · Feel Good · Stay Healthy',
  daysPerWeek:  5,
  totalWeeks:   12,
  split:        'Upper / Lower',
  workouts:     LONGEVITY_WORKOUTS,
  getWeekConfig: getLongevityWeekConfig,
}
