// ──────────────────────────────────────────────────────────────────────────────
// SCULPT — Total-Body Strength & Shape
// Founded on the physique-development research of Bret Contreras, Ph.D.
// ("The Glute Guy") and established hypertrophy science (Schoenfeld et al.)
//
// Goal: the lean, athletic, "toned" look — which physiologically means building
// the glutes, hamstrings, shoulders and back while training the whole body.
// "Tone" is muscle + lower body fat; this program builds the muscle, your
// nutrition reveals it. 4 days/week Upper/Lower with glute and posterior-chain
// emphasis on both lower days. 12 weeks, deloads at 4, 8 and 12.
//
// Key principle: glutes and shoulders create the athletic shape; full-body
// training with progressive overload (not "toning" with light weights) is what
// changes how you look.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

export const SCULPT_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Lower · Glute Focus',
    shortName: 'Glutes & Legs',
    day: 'Day 1',
    focus: 'Glutes · Quads · Hamstrings',
    restTimes: '2–2.5 min compounds · 60–75 sec isolation',
    duration: '~45–63 min',
    dayType: 'standard',
    exercises: [
      { name: 'Barbell Hip Thrust',         muscle: 'Glutes',     type: 'primary',   cue: 'Shoulders on bench · chin tucked · drive through heels · squeeze glutes hard at the top and pause — the single best glute builder' },
      { name: 'Goblet Squat',               muscle: 'Quads',      type: 'secondary', cue: 'Hold DB at chest · sit between hips · upright torso · full depth for glute and quad stretch' },
      { name: 'Bulgarian Split Squat',      muscle: 'Glutes',     type: 'secondary', cue: 'Rear foot elevated · long stride · drop straight down · lean slightly forward to load the glute' },
      { name: 'Romanian Deadlift (RDL)',     muscle: 'Hamstrings', type: 'secondary', cue: 'Push hips back · soft knees · feel the hamstring and glute stretch · stand tall and squeeze' },
      { name: 'Cable Glute Kickback',       muscle: 'Glutes',     type: 'isolation', cue: 'Ankle strap · hinge slightly · drive heel back and up · squeeze at full extension · slow return' },
      { name: 'Hip Abduction',              muscle: 'Glutes',     type: 'isolation', cue: 'Lean forward slightly to bias upper glute · push knees out · pause at the end range' },
    ],
  },
  {
    key: 'B',
    name: 'Upper · Shape',
    shortName: 'Upper Body',
    day: 'Day 2',
    focus: 'Back · Shoulders · Chest · Arms',
    restTimes: '2–2.5 min compounds · 60–75 sec isolation',
    duration: '~45–63 min',
    dayType: 'standard',
    exercises: [
      { name: 'Lat Pulldown',               muscle: 'Back',       type: 'primary',   cue: 'Wide grip · pull to upper chest · full stretch overhead — a strong back creates the V-taper that makes the waist look smaller' },
      { name: 'Seated DB Shoulder Press',   muscle: 'Shoulders',  type: 'secondary', cue: 'Press to lockout · capped delts create the athletic shoulder line · controlled lowering' },
      { name: 'Seated Cable Row',           muscle: 'Back',       type: 'secondary', cue: 'Tall spine · drive elbows back · squeeze the mid-back · posture and shape' },
      { name: 'Incline Dumbbell Press',     muscle: 'Chest',      type: 'secondary', cue: 'Full ROM · pause at stretch · upper-chest work supports a lifted, firm look' },
      { name: 'DB Lateral Raise',           muscle: 'Side Delts', type: 'secondary', cue: '3-sec eccentric · slight lean · side delts are the key to shoulder width and the hourglass illusion' },
      { name: 'Tricep Rope Pushdown',       muscle: 'Triceps',    type: 'isolation', cue: 'Elbows pinned · spread the rope at the bottom · firms the back of the arm' },
      { name: 'Cable Curl',                 muscle: 'Biceps',     type: 'isolation', cue: 'Constant tension · full ROM · squeeze at the top' },
    ],
  },
  {
    key: 'R1', name: 'Rest Day', shortName: 'Rest', day: 'Day 3',
    focus: 'Recovery · Light Movement', restTimes: '', isRest: true,
    restRationale: 'Recovery between the two training blocks. A walk or light mobility work is ideal — muscle is built during recovery, not just during the session. Glutes in particular respond to being trained hard then fully recovered.',
    exercises: [],
  },
  {
    key: 'C',
    name: 'Lower · Hams & Glutes',
    shortName: 'Legs & Glutes',
    day: 'Day 4',
    focus: 'Hamstrings · Glutes · Quads',
    restTimes: '2–2.5 min compounds · 60–75 sec isolation',
    duration: '~45–63 min',
    dayType: 'standard',
    exercises: [
      { name: 'Romanian Deadlift (RDL)',     muscle: 'Hamstrings', type: 'primary',   cue: 'Lead with hamstrings today · push hips back · deep stretch · the hamstring-glute tie-in shapes the back of the leg' },
      { name: 'Walking Lunge',              muscle: 'Glutes',     type: 'secondary', cue: 'Long steps to load the glute · drop the back knee · push through the front heel · stay tall' },
      { name: 'Leg Press',                  muscle: 'Quads',      type: 'secondary', cue: 'Feet high and wide to bias glutes and hams · full ROM · controlled' },
      { name: 'Lying Leg Curl',             muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · squeeze at the top · full stretch · shapes the hamstring' },
      { name: 'Glute Bridge',               muscle: 'Glutes',     type: 'isolation', cue: 'Floor or bench · drive hips up · squeeze hard · burnout reps to finish the glutes' },
      { name: 'Standing Calf Raise',        muscle: 'Calves',     type: 'isolation', cue: 'Full stretch at the bottom · pause at the top · shapes the lower leg' },
    ],
  },
  {
    key: 'D',
    name: 'Upper · Tone & Core',
    shortName: 'Upper & Core',
    day: 'Day 5',
    focus: 'Shoulders · Back · Arms · Core',
    restTimes: '2–2.5 min compounds · 60–75 sec isolation/core',
    duration: '~45–63 min',
    dayType: 'standard',
    exercises: [
      { name: 'Seated DB Shoulder Press',   muscle: 'Shoulders',  type: 'primary',   cue: 'Second shoulder session · press to lockout · the shoulders define the athletic upper-body line' },
      { name: 'Dumbbell Row',               muscle: 'Back',       type: 'secondary', cue: 'Brace on bench · elbow to ceiling · full stretch · unilateral back work for symmetry' },
      { name: 'Cable Lateral Raise',        muscle: 'Side Delts', type: 'secondary', cue: 'Constant tension through the whole range · the more side-delt volume, the more shoulder cap' },
      { name: 'Face Pull',                  muscle: 'Rear Delts', type: 'isolation', cue: 'Pull to face · elbows high · posture, rear-delt shape and shoulder health' },
      { name: 'Hanging Knee Raise',         muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'Hang from bar · raise knees with control · no swinging · lower slowly — deep core engagement' },
      { name: 'Cable Crunch',               muscle: 'Core',       type: 'isolation', cue: 'Kneel at cable · crunch with the abs not the hips · round the spine · squeeze' },
      { name: 'Plank',                      muscle: 'Core',       type: 'isolation', isBodyweight: true, cue: 'Forearms down · straight line head to heels · brace and breathe · hold for time' },
    ],
  },
  {
    key: 'R2', name: 'Rest Day', shortName: 'Rest', day: 'Day 6',
    focus: 'Recovery', restTimes: '', isRest: true,
    restRationale: 'Recovery before the week repeats. Staying active with walking supports fat loss without adding training fatigue.',
    exercises: [],
  },
  {
    key: 'R3', name: 'Rest Day', shortName: 'Rest', day: 'Day 7',
    focus: 'Full Recovery', restTimes: '', isRest: true,
    restRationale: 'Full recovery day. Consistency week to week beats intensity in any single session — rest so you can train hard again.',
    exercises: [],
  },
]

export function getSculptWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week === 4 || week === 8 || week === 12
  if (isDeload) return {
    sets: { primary: 2, secondary: 2, isolation: 1 },
    reps: { primary: '10–12', secondary: '12–15', isolation: '12–15' },
    rir: 4, phase: 'Deload — Recovery', isDeload: true,
    note: 'Lighter week — drop the load ~25% and keep movement quality high. You\'ll come back stronger.',
    percentages: { primary: 0.55, secondary: 0.55, isolation: 0.52 },
  }

  if (week <= 3) return {
    sets: { primary: 3, secondary: 3, isolation: 2 },
    reps: { primary: '10–12', secondary: '12–15', isolation: '15–20' },
    rir: 3, phase: 'Phase 1 — Foundation', isDeload: false,
    note: 'Learn the movements and build the mind-muscle connection. Focus on feeling the glutes and target muscles work, not on heavy weight.',
    percentages: { primary: 0.62, secondary: 0.60, isolation: 0.55 },
  }
  if (week <= 7) return {
    sets: { primary: 4, secondary: 3, isolation: 3 },
    reps: { primary: '8–12', secondary: '10–15', isolation: '12–20' },
    rir: 2, phase: 'Phase 2 — Build', isDeload: false,
    note: 'Add load and volume now that the movements feel natural. This is where the shape really starts to develop.',
    percentages: { primary: 0.68, secondary: 0.65, isolation: 0.60 },
  }
  return {
    sets: { primary: 4, secondary: 4, isolation: 3 },
    reps: { primary: '8–10', secondary: '10–12', isolation: '12–15' },
    rir: 1, phase: 'Phase 3 — Sculpt', isDeload: false,
    note: 'Peak effort. Push the glute and shoulder work close to failure — these are the muscles that define the look.',
    percentages: { primary: 0.72, secondary: 0.70, isolation: 0.64 },
  }
}

export const SCULPT_PROGRAM: Program = {
  id:           'sculpt-total-body',
  name:         'Sculpt — Total-Body Shape',
  shortName:    'Sculpt',
  author:       'Founded on Bret Contreras, Ph.D. research',
  description:  'A total-body strength program for the lean, athletic look — built on Bret Contreras\'s glute-development research and proven hypertrophy science. 4 days/week Upper/Lower with glute, hamstring, shoulder and back emphasis: the muscles that create the athletic shape. Real progressive overload (not light "toning" weights) builds the muscle; your nutrition reveals it. 12 weeks with deloads.',
  focus:        'Physique · Total Body',
  daysPerWeek:  4,
  totalWeeks:   12,
  split:        'Upper / Lower · Glute Focus',
  workouts:     SCULPT_WORKOUTS,
  getWeekConfig: getSculptWeekConfig,
}
