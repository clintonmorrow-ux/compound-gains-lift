// ──────────────────────────────────────────────────────────────────────────────
// VITALITY — Strength & Power for Active Aging (55+)
// Founded on ACSM resistance-training guidelines for older adults and the
// research on muscle power for healthy aging (Fiatarone Singh; Izquierdo et al.).
//
// Why power, not just strength: after ~50, muscle POWER (force × speed) declines
// roughly twice as fast as maximal strength, and power predicts functional
// ability — rising from a chair, climbing stairs, catching a stumble — better
// than strength alone. So compounds are lifted with an intentionally FAST (but
// controlled) lifting phase and a slow lowering phase.
//
// Safety first: 3 full-body days/week, machine and supported movements to protect
// joints and balance, moderate loads, and ALWAYS 2–3 reps left in reserve — never
// to failure. Plus dedicated balance/core work for fall prevention.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

export const VITALITY_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Full Body · Foundations',
    shortName: 'Full Body A',
    day: 'Day 1',
    focus: 'Legs · Chest · Back · Core',
    restTimes: '2–3 min — take all the rest you need',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Leg Press',                  muscle: 'Quads',      type: 'primary',   cue: 'The safest way to load the legs — back supported. Push up briskly, lower slowly over 3 seconds. This is the sit-from-a-chair muscle.' },
      { name: 'Chest Press Machine',        muscle: 'Chest',      type: 'primary',   cue: 'Back and shoulders supported · press out smoothly · controlled return · keeps the chest and pressing strength for daily pushing tasks' },
      { name: 'Seated Cable Row',           muscle: 'Back',       type: 'secondary', cue: 'Tall posture · pull elbows back · squeeze shoulder blades — directly counters the age-related forward hunch' },
      { name: 'Leg Curl',                   muscle: 'Hamstrings', type: 'secondary', cue: 'Seated or lying · smooth curl · slow return · protects the back of the leg and the knee' },
      { name: 'Bird Dog',                   muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'On hands and knees · extend opposite arm and leg · hold 2 sec · trains the balance and trunk control that prevents falls' },
      { name: 'Standing Calf Raise',        muscle: 'Calves',     type: 'isolation', cue: 'Hold something for balance · rise up · lower slowly · strong calves and ankles aid balance and walking' },
    ],
  },
  {
    key: 'R1', name: 'Rest Day', shortName: 'Rest', day: 'Day 2',
    focus: 'Recovery · Walking', restTimes: '', isRest: true,
    restRationale: 'A full day between sessions. Older muscles need a little more recovery time to rebuild — and that rebuilding is exactly how you maintain and gain. A daily walk on rest days is ideal for circulation and joint health.',
    exercises: [],
  },
  {
    key: 'B',
    name: 'Full Body · Strength',
    shortName: 'Full Body B',
    day: 'Day 3',
    focus: 'Legs · Shoulders · Back · Balance',
    restTimes: '2–3 min — take all the rest you need',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Goblet Squat',               muscle: 'Quads',      type: 'primary',   cue: 'Hold a light dumbbell at the chest · sit back to a comfortable depth · stand up briskly · the most functional lower-body movement there is. Use a chair behind you for confidence.' },
      { name: 'Lat Pulldown',               muscle: 'Back',       type: 'primary',   cue: 'Pull the bar to the upper chest · controlled return · builds pulling strength and supports posture' },
      { name: 'Seated DB Shoulder Press',   muscle: 'Shoulders',  type: 'secondary', cue: 'Light dumbbells · press overhead smoothly · keeps the strength to lift objects onto shelves safely' },
      { name: 'Romanian Deadlift (RDL)',     muscle: 'Hamstrings', type: 'secondary', cue: 'Light load · push hips back · flat back · teaches safe lifting from waist height — protects the back in daily life' },
      { name: 'Step-Up',                    muscle: 'Glutes',     type: 'secondary', isBodyweight: true, cue: 'Low step · drive up through the whole foot · step down slowly with control · hold a rail — directly trains stair-climbing and balance' },
      { name: 'Dead Bug',                   muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'On back · lower opposite arm and leg · keep the low back flat · safe, effective core and coordination work' },
    ],
  },
  {
    key: 'R2', name: 'Rest Day', shortName: 'Rest', day: 'Day 4',
    focus: 'Recovery', restTimes: '', isRest: true,
    restRationale: 'Recovery day. Gentle movement — walking, stretching, or light activity — keeps you mobile without taxing the muscles that are rebuilding.',
    exercises: [],
  },
  {
    key: 'C',
    name: 'Full Body · Power',
    shortName: 'Full Body C',
    day: 'Day 5',
    focus: 'Functional Power · Legs · Push · Pull',
    restTimes: '2–3 min — full recovery between sets',
    duration: '~45 min',
    dayType: 'standard',
    exercises: [
      { name: 'Sit-to-Stand',               muscle: 'Quads',      type: 'primary',   isBodyweight: true, cue: 'From a sturdy chair · stand up as FAST as is safe, sit down slowly over 3 sec · this fast stand-up is pure functional power — the #1 anti-fall exercise. Add a light dumbbell when ready.' },
      { name: 'Chest Press Machine',        muscle: 'Chest',      type: 'secondary', cue: 'Press out briskly, return slowly · the quick push trains pressing power for daily tasks' },
      { name: 'Seated Cable Row',           muscle: 'Back',       type: 'secondary', cue: 'Pull briskly, return slowly · posture and pulling power' },
      { name: 'Leg Press',                  muscle: 'Quads',      type: 'secondary', cue: 'Press up FAST (safely), lower over 3 sec · the speed is the point today — power fades faster than strength with age, so we train it directly' },
      { name: 'Hip Abduction',              muscle: 'Glutes',     type: 'isolation', cue: 'Push the knees out against the pad · strengthens the side-hip muscles that keep you steady on one leg' },
      { name: 'Plank',                      muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'Forearms down (or on knees) · straight line · brace and breathe · hold a comfortable time — full-body stability' },
    ],
  },
  {
    key: 'R3', name: 'Rest Day', shortName: 'Rest', day: 'Day 6',
    focus: 'Recovery', restTimes: '', isRest: true,
    restRationale: 'Rest and recover. Three quality full-body sessions a week is the research-backed sweet spot for maintaining muscle and strength after 55 — more is rarely better at this stage.',
    exercises: [],
  },
  {
    key: 'R4', name: 'Rest Day', shortName: 'Rest', day: 'Day 7',
    focus: 'Full Recovery', restTimes: '', isRest: true,
    restRationale: 'Full recovery before the week begins again. Consistency over months and years is what preserves independence — show up three times a week, every week.',
    exercises: [],
  },
]

export function getVitalityWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week === 4 || week === 8 || week === 12
  if (isDeload) return {
    sets: { primary: 2, secondary: 2, isolation: 1 },
    reps: { primary: '10–12', secondary: '10–12', isolation: '10–15' },
    rir: 4, phase: 'Easy Week — Recovery', isDeload: true,
    note: 'A lighter week to let the body fully recover. Reduce the weight, keep moving, enjoy the sessions.',
    percentages: { primary: 0.48, secondary: 0.48, isolation: 0.45 },
  }

  if (week <= 3) return {
    sets: { primary: 2, secondary: 2, isolation: 2 },
    reps: { primary: '10–12', secondary: '10–12', isolation: '10–15' },
    rir: 3, phase: 'Phase 1 — Build Confidence', isDeload: false,
    note: 'Learn each movement at a comfortable weight. Never push to failure — always finish a set feeling you had 2–3 more reps in you.',
    percentages: { primary: 0.55, secondary: 0.53, isolation: 0.50 },
  }
  if (week <= 7) return {
    sets: { primary: 3, secondary: 2, isolation: 2 },
    reps: { primary: '8–12', secondary: '10–12', isolation: '10–15' },
    rir: 3, phase: 'Phase 2 — Steady Strength', isDeload: false,
    note: 'Add a little weight where movements feel easy and controlled. Still keep 2–3 reps in reserve every set.',
    percentages: { primary: 0.60, secondary: 0.58, isolation: 0.55 },
  }
  return {
    sets: { primary: 3, secondary: 3, isolation: 2 },
    reps: { primary: '8–10', secondary: '8–12', isolation: '10–15' },
    rir: 2, phase: 'Phase 3 — Maintain & Strengthen', isDeload: false,
    note: 'A touch more effort now — but quality and control always come first. If anything feels off, drop the weight. Consistency is the win.',
    percentages: { primary: 0.65, secondary: 0.62, isolation: 0.58 },
  }
}

export const VITALITY_PROGRAM: Program = {
  id:           'vitality-active-aging',
  name:         'Vitality — Active Aging',
  shortName:    'Vitality 55+',
  author:       'Founded on ACSM older-adult guidelines',
  description:  'Strength and functional power for adults 55+, built on ACSM resistance-training guidelines and research on muscle power for healthy aging. 3 full-body days a week using machine and supported movements to protect joints and balance, moderate loads, and always leaving 2–3 reps in reserve — never to failure. Compounds are lifted briskly and lowered slowly to train the power that preserves independence, with dedicated balance and core work for fall prevention. 12 weeks with easy recovery weeks built in.',
  focus:        'Strength · Healthy Aging',
  daysPerWeek:  3,
  totalWeeks:   12,
  split:        'Full Body',
  workouts:     VITALITY_WORKOUTS,
  getWeekConfig: getVitalityWeekConfig,
}
