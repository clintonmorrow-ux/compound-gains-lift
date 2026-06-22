// ──────────────────────────────────────────────────────────────────────────────
// LONGEVITY — Sustainable Strength (3-day full body, pressure-aware)
//
// Built for the lifter who wants to MAINTAIN muscle and feel good for decades,
// not chase PRs — and who needs to train AROUND a history of intra-abdominal
// pressure issues (hernia, hemorrhoid). Both share one driver: spikes in
// intra-abdominal pressure, produced by heavy grinding loads and the Valsalva
// (breath-holding) that comes with training to failure.
//
// So the whole design is protective by construction:
//   • 3 full-body days/week — every muscle trained 3×, the efficient way to
//     MAINTAIN on limited days. ~45 minutes per session.
//   • Machine & supported movements, moderate loads, 8–15 reps.
//   • ALWAYS 2–3 reps in reserve — never to failure. Exhale through the hard
//     part of every rep; never hold your breath under load.
//   • No heavy barbell back squat / conventional deadlift / heavy overhead
//     barbell press (the worst pressure offenders). Hinging is done with cables
//     and moderate dumbbells; pressing is supported.
//   • Trunk stability work (dead bug, Pallof) that strengthens the core WITHOUT
//     the pressure spike of weighted crunches.
//   • 2 Zone-2 cardio days — easy, conversational, low-impact.
//
// NOT medical advice. With a hernia history, get cleared by a doctor, and stop
// any movement that produces bulging, pain, or pressure.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

export const LONGEVITY_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Full Body · Push & Legs',
    shortName: 'Full Body A',
    day: 'Day 1',
    focus: 'Legs · Chest · Back · Core',
    restTimes: '60–90 sec — unhurried, you should feel recovered',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Leg Press',                    muscle: 'Quads',      type: 'primary',   cue: 'The safest way to load the legs — back fully supported, no bar on your spine. Push up smoothly, lower over 3 seconds. Exhale on the way up; never hold your breath.' },
      { name: 'Seated Cable Row (Wide)',       muscle: 'Back',       type: 'primary',   cue: 'Sit tall, chest up · pull elbows back, squeeze the shoulder blades · controlled return. Upright and supported — no spinal loading.' },
      { name: 'Hammer Strength Incline Press', muscle: 'Chest',      type: 'secondary', cue: 'Machine press, torso supported · press out smoothly, return slow · all the chest stimulus with none of the bracing a barbell demands.' },
      { name: 'Lying Leg Curl',                muscle: 'Hamstrings', type: 'secondary', cue: 'Smooth curl, slow return · isolates the hamstrings safely with zero pressure on the trunk.' },
      { name: 'Cable Lateral Raise',           muscle: 'Side Delts', type: 'isolation', cue: 'Light cable · raise to shoulder height · slow lower. Builds round shoulders without any overhead pressing strain.' },
      { name: 'Dead Bug',                      muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'On your back · lower opposite arm and leg slowly · keep the low back flat and KEEP BREATHING. Deep core stability without the pressure spike of crunches.' },
    ],
  },
  {
    key: 'R1', name: 'Zone-2 Cardio', shortName: 'Cardio', day: 'Day 2',
    focus: 'Easy aerobic · 30–40 min', restTimes: '', isRest: true,
    restRationale: 'Zone 2 means easy, conversational pace — you can hold a conversation the whole time. Bike, incline walk, row, or swim for 30–40 minutes. This is the heart-and-longevity work, and it is deliberately the OPPOSITE of high-intensity metcons: no breath-holding, no maximal straining, no impact. Steady and gentle is the point.',
    exercises: [],
  },
  {
    key: 'B',
    name: 'Full Body · Pull & Hinge',
    shortName: 'Full Body B',
    day: 'Day 3',
    focus: 'Legs · Back · Hamstrings · Core',
    restTimes: '60–90 sec — unhurried',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Bulgarian Split Squat (DB)',   muscle: 'Quads',      type: 'primary',   cue: 'Rear foot on a bench · light-to-moderate dumbbells at your sides · sink straight down, drive up through the front foot. One leg at a time means big stimulus at low total load — easy on the trunk.' },
      { name: 'Lat Pulldown',                  muscle: 'Back',       type: 'primary',   cue: 'Pull the bar to the upper chest · controlled return · seated and braced against the pad. Builds the back and supports posture.' },
      { name: 'Romanian Deadlift (RDL)',       muscle: 'Hamstrings', type: 'secondary', cue: 'Moderate DUMBBELLS, not a heavy barbell · push the hips back, soft knees, flat back, hinge only to mid-shin · EXHALE as you stand. The hinge pattern, trained safely. If you feel any pressure, lighten it.' },
      { name: 'Incline Dumbbell Press',        muscle: 'Chest',      type: 'secondary', cue: 'Moderate dumbbells · press up and slightly together · slow lower. Stop 2–3 reps before failure — you should never have to grind.' },
      { name: 'Face Pull',                     muscle: 'Rear Delts', type: 'isolation', cue: 'Rope at face height · pull toward the forehead, elbows high · the best exercise there is for healthy shoulders and undoing desk posture.' },
      { name: 'Pallof Press (per side)',       muscle: 'Core',       type: 'isolation', cue: 'Cable at chest height, stand side-on · press the handle straight out and resist the rotation · breathe normally throughout. Anti-rotation core strength with no pressure spike.' },
    ],
  },
  {
    key: 'R2', name: 'Zone-2 Cardio', shortName: 'Cardio', day: 'Day 4',
    focus: 'Easy aerobic · 30–40 min', restTimes: '', isRest: true,
    restRationale: 'Second easy aerobic session of the week. Keep it conversational — if you cannot talk in full sentences, slow down. Low-impact options protect your joints and your midsection: stationary bike, incline treadmill walk, rower at an easy pace, or a swim.',
    exercises: [],
  },
  {
    key: 'C',
    name: 'Full Body · Balanced & Arms',
    shortName: 'Full Body C',
    day: 'Day 5',
    focus: 'Legs · Back · Shoulders · Arms',
    restTimes: '60–90 sec — unhurried',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Leg Press',                    muscle: 'Quads',      type: 'primary',   cue: 'Second leg session of the week, slightly higher reps · back supported · smooth and controlled · exhale on the press.' },
      { name: 'Seated Cable Row (Wide)',       muscle: 'Back',       type: 'secondary', cue: 'Tall chest, drive the elbows back · the upright supported row keeps your back strong without loading the spine.' },
      { name: 'Seated DB Shoulder Press',      muscle: 'Shoulders',  type: 'secondary', cue: 'Seated, back against the pad · LIGHT-to-moderate dumbbells · press smoothly and EXHALE — the only overhead work in the plan, kept supported and submaximal on purpose. Skip it for more lateral raises if it ever feels like a strain.' },
      { name: 'Cable Pull-Through',            muscle: 'Glutes',     type: 'secondary', cue: 'Face away from a low cable · hinge at the hips and drive them forward to stand tall · glutes and hamstrings with ZERO spinal load — one of the most hernia-friendly hinges there is.' },
      { name: 'Incline DB Curl',              muscle: 'Biceps',     type: 'isolation', cue: 'Seated on an incline · slow, full curls · this is your "feel good in a t-shirt" work — no need to go heavy.' },
      { name: 'Tricep Rope Pushdown',          muscle: 'Triceps',    type: 'isolation', cue: 'Rope on a high cable · press down and spread at the bottom · controlled return · finishes the arms with zero trunk strain.' },
    ],
  },
  {
    key: 'R3', name: 'Rest Day', shortName: 'Rest', day: 'Day 6',
    focus: 'Recovery · Optional walk', restTimes: '', isRest: true,
    restRationale: 'Full recovery. An easy walk is perfect — it aids circulation (which genuinely helps the hemorrhoid heal) without taxing anything. Three quality full-body sessions plus two easy cardio days is plenty to maintain and feel great.',
    exercises: [],
  },
  {
    key: 'R4', name: 'Rest Day', shortName: 'Rest', day: 'Day 7',
    focus: 'Full Recovery', restTimes: '', isRest: true,
    restRationale: 'Rest before the week begins again. The goal here is decades, not weeks — show up consistently, keep every session comfortable and controlled, and your body will keep up just fine.',
    exercises: [],
  },
]

export function getLongevityWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week === 4 || week === 8 || week === 12
  if (isDeload) return {
    sets: { primary: 2, secondary: 2, isolation: 1 },
    reps: { primary: '12–15', secondary: '12–15', isolation: '12–15' },
    rir: 4, phase: 'Easy Week', isDeload: true,
    note: 'A lighter week. Drop the loads, keep the movements smooth, and let everything recover. You will come back feeling stronger.',
    percentages: { primary: 0.50, secondary: 0.48, isolation: 0.45 },
  }
  if (week <= 3) return {
    sets: { primary: 2, secondary: 2, isolation: 2 },
    reps: { primary: '10–12', secondary: '10–12', isolation: '12–15' },
    rir: 3, phase: 'Phase 1 — Groove the Movements', isDeload: false,
    note: 'Settle into each exercise at a comfortable weight. Finish every set feeling you had 3 solid reps left. Breathe out through the effort — never hold your breath.',
    percentages: { primary: 0.58, secondary: 0.56, isolation: 0.52 },
  }
  if (week <= 7) return {
    sets: { primary: 3, secondary: 2, isolation: 2 },
    reps: { primary: '8–12', secondary: '10–12', isolation: '12–15' },
    rir: 3, phase: 'Phase 2 — Steady & Strong', isDeload: false,
    note: 'Nudge the weight up only where a movement feels genuinely easy and controlled. Still 2–3 reps in reserve, every set. Quality over load, always.',
    percentages: { primary: 0.62, secondary: 0.60, isolation: 0.55 },
  }
  return {
    sets: { primary: 3, secondary: 3, isolation: 2 },
    reps: { primary: '8–12', secondary: '10–12', isolation: '12–15' },
    rir: 2, phase: 'Phase 3 — Maintain', isDeload: false,
    note: 'A touch more effort if you feel good — but the rules never change: stay 2 reps shy of failure, keep the load moderate, exhale through every rep. Maintaining for the long run is the win.',
    percentages: { primary: 0.65, secondary: 0.62, isolation: 0.58 },
  }
}

export const LONGEVITY_PROGRAM: Program = {
  id:           'longevity-3day',
  name:         'Longevity — Sustainable Strength',
  shortName:    'Longevity 3-Day',
  author:       'Pressure-aware full-body training (ACSM-aligned)',
  description:  'A 3-day full-body program for maintaining muscle and feeling good for the long run, built to train AROUND intra-abdominal pressure issues like hernia and hemorrhoid history. Machine and supported movements, moderate loads, 8–15 reps, and always 2–3 reps in reserve — never to failure, always exhaling through the effort, so you avoid the breath-holding and grinding that spike abdominal pressure. No heavy barbell squats, deadlifts, or overhead presses; hinging is done with cables and moderate dumbbells. Each session is about 45 minutes. Paired with 2 easy Zone-2 cardio days and built-in recovery, it is a sustainable week that keeps you strong and healthy without beating you up. Not medical advice — clear it with your doctor given any hernia history.',
  focus:        'Maintain · Feel Good · Stay Healthy',
  daysPerWeek:  3,
  totalWeeks:   12,
  split:        'Full Body',
  workouts:     LONGEVITY_WORKOUTS,
  getWeekConfig: getLongevityWeekConfig,
}
