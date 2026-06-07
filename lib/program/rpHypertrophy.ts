// ──────────────────────────────────────────────────────────────────────────────
// RP HYPERTROPHY — Renaissance Periodization Methodology
// Founded on the work of Dr. Mike Israetel, Ph.D. (Sport Physiology)
//
// Structure: 4 days/week Upper/Lower, each muscle trained 2×/week (high
// frequency). 12 weeks = three 4-week mesocycles. The defining RP feature
// is VOLUME PROGRESSION: each mesocycle starts near MEV (minimum effective
// volume) and ramps sets upward toward MRV (maximum recoverable volume)
// week over week, with RIR dropping from 3 → 0, then a deload to resensitise.
//
// Key principle: hypertrophy is driven by accumulated stimulating volume.
// Add sets while you can recover from them; deload before junk volume sets in.
// ──────────────────────────────────────────────────────────────────────────────
import type { Workout, WeekConfig, DayType, Program } from '@/types'

export const RP_WORKOUTS: Workout[] = [
  {
    key: 'A',
    name: 'Upper A',
    shortName: 'Upper A',
    day: 'Day 1',
    focus: 'Chest · Back · Shoulders · Arms',
    restTimes: '2–3 min compounds · 60–90 sec isolation',
    duration: '~58 min',
    dayType: 'standard',
    exercises: [
      { name: 'Barbell Bench Press',        muscle: 'Chest',      type: 'primary',   cue: 'Retract scapula · controlled eccentric to chest · this is your heaviest press — add a set each week as volume ramps' },
      { name: 'Barbell Bent-Over Row',      muscle: 'Back',       type: 'primary',   cue: 'Hinge 45° · drive elbows back · full stretch at bottom · match push volume for balanced upper development' },
      { name: 'Incline Dumbbell Press',     muscle: 'Chest',      type: 'secondary', cue: 'Upper chest emphasis · full ROM · pause at stretch · second pressing stimulus of the week' },
      { name: 'Lat Pulldown',               muscle: 'Back',       type: 'secondary', cue: 'Wide grip · drive elbows to ribs · full arm extension at top — emphasise the lengthened position' },
      { name: 'Seated DB Shoulder Press',   muscle: 'Shoulders',  type: 'secondary', cue: 'Press to lockout · keep shoulder under tension · don\'t bounce out of the bottom' },
      { name: 'DB Lateral Raise',           muscle: 'Side Delts', type: 'isolation', cue: '3-sec eccentric · slight forward lean · highest-volume side-delt driver — these add up fast across the mesocycle' },
      { name: 'Barbell Curl',               muscle: 'Biceps',     type: 'isolation', cue: 'Elbows fixed · full extension at bottom · supinate hard at top' },
    ],
  },
  {
    key: 'B',
    name: 'Lower A',
    shortName: 'Lower A',
    day: 'Day 2',
    focus: 'Quads · Hamstrings · Glutes · Calves',
    restTimes: '3 min compounds · 90 sec isolation',
    duration: '~56 min',
    dayType: 'standard',
    exercises: [
      { name: 'Barbell Back Squat',         muscle: 'Quads',      type: 'primary',   cue: 'Brace hard · sit to depth · drive knees out · primary quad driver — the squat carries most of the lower volume early' },
      { name: 'Romanian Deadlift (RDL)',     muscle: 'Hamstrings', type: 'primary',   cue: 'Push hips back · bar close · feel the hamstring stretch — the lengthened position is the stimulus' },
      { name: 'Leg Press',                  muscle: 'Quads',      type: 'secondary', cue: 'Feet low/narrow for quads · full ROM · this is where you add sets without taxing the lower back' },
      { name: 'Lying Leg Curl',             muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · plantarflex at peak · full stretch at the bottom of every rep' },
      { name: 'Leg Extension',              muscle: 'Quads',      type: 'isolation', cue: 'Pause at top · 3-sec eccentric · pure quad isolation to finish' },
      { name: 'Standing Calf Raise',        muscle: 'Calves',     type: 'isolation', cue: 'Full dorsiflexion stretch · pause at top · calves tolerate high volume — ramp aggressively' },
    ],
  },
  {
    key: 'R1', name: 'Rest Day', shortName: 'Rest', day: 'Day 3',
    focus: 'Recovery · Volume Tolerance', restTimes: '', isRest: true,
    restRationale: 'RP principle: hypertrophy is built by recoverable volume. As weekly sets ramp toward MRV, recovery between sessions becomes the limiter. A full rest day mid-week protects the quality of the second upper/lower rotation.',
    exercises: [],
  },
  {
    key: 'C',
    name: 'Upper B',
    shortName: 'Upper B',
    day: 'Day 4',
    focus: 'Back · Chest · Shoulders · Arms',
    restTimes: '2–3 min compounds · 60–90 sec isolation',
    duration: '~58 min',
    dayType: 'standard',
    exercises: [
      { name: 'Weighted Pull-Up',           muscle: 'Back',       type: 'primary',   isBodyweight: true, cue: 'Full dead hang · chin over bar · vertical pull to complement the horizontal row on Upper A' },
      { name: 'Incline Dumbbell Press',     muscle: 'Chest',      type: 'primary',   cue: 'Second upper session leads with incline — full ROM, pause at the deep stretch' },
      { name: 'Seated Cable Row',           muscle: 'Back',       type: 'secondary', cue: 'Tall spine · drive elbows back · 2-sec squeeze at end range' },
      { name: 'Cable Chest Fly',           muscle: 'Chest',      type: 'secondary', cue: 'Wide arc · pause at full stretch — lengthened-position overload for the pecs' },
      { name: 'DB Lateral Raise',           muscle: 'Side Delts', type: 'isolation', cue: 'Second side-delt session of the week · control the eccentric · delts recover fast, hit them twice' },
      { name: 'Face Pull',                  muscle: 'Rear Delts', type: 'isolation', cue: 'Pull to face · elbows high · externally rotate · rear-delt and upper-back health' },
      { name: 'Incline DB Curl',           muscle: 'Biceps',     type: 'isolation', cue: 'Incline stretches the long head · full extension at bottom · supinate up' },
      { name: 'EZ-Bar Skull Crusher',       muscle: 'Triceps',    type: 'isolation', cue: 'Lower to forehead · long-head stretch · controlled lockout' },
    ],
  },
  {
    key: 'D',
    name: 'Lower B',
    shortName: 'Lower B',
    day: 'Day 5',
    focus: 'Hamstrings · Quads · Glutes · Calves',
    restTimes: '3 min compounds · 90 sec isolation',
    duration: '~55 min',
    dayType: 'standard',
    exercises: [
      { name: 'Romanian Deadlift (RDL)',     muscle: 'Hamstrings', type: 'primary',   cue: 'Lead lower B with hamstrings · push hips back · deep stretch · balances the squat-led Lower A' },
      { name: 'Hack Squat',                 muscle: 'Quads',      type: 'primary',   cue: 'Feet mid-platform · full depth · constant quad tension — machine lets you push volume safely' },
      { name: 'Bulgarian Split Squat',      muscle: 'Glutes',     type: 'secondary', cue: 'Rear foot elevated · long stride for glute · drop the back knee straight down · unilateral balance' },
      { name: 'Seated Leg Curl',            muscle: 'Hamstrings', type: 'secondary', cue: 'Seated curl trains the lengthened position · slow eccentric · second hamstring stimulus' },
      { name: 'Leg Extension',              muscle: 'Quads',      type: 'isolation', cue: 'Pause and squeeze at top · controlled negative · quad finisher' },
      { name: 'Seated Calf Raise',          muscle: 'Calves',     type: 'isolation', cue: 'Knee bent targets soleus · full stretch · high reps — calves want frequency and volume' },
    ],
  },
  {
    key: 'R2', name: 'Rest Day', shortName: 'Rest', day: 'Day 6',
    focus: 'Recovery', restTimes: '', isRest: true,
    restRationale: 'Recovery before the weekly cycle repeats. With volume ramping toward MRV, two rest days in the back half of the week keep fatigue from outpacing the stimulus.',
    exercises: [],
  },
  {
    key: 'R3', name: 'Rest Day', shortName: 'Rest', day: 'Day 7',
    focus: 'Full Recovery', restTimes: '', isRest: true,
    restRationale: 'Full systemic recovery. RP mesocycles deliberately end the week under-fatigued so each new week can add stimulating volume rather than chase recovery from the last.',
    exercises: [],
  },
]

// ── Week Config — VOLUME PROGRESSION is the RP signature ──────────────────────
// Sets ramp up within each 4-week mesocycle (MEV → MRV); RIR falls 3→0;
// week 4/8/12 deload resensitises. Each new mesocycle starts slightly higher.
export function getRPWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week === 4 || week === 8 || week === 12
  if (isDeload) return {
    sets: { primary: 2, secondary: 2, isolation: 1 },
    reps: { primary: '8–10', secondary: '10–12', isolation: '12–15' },
    rir: 4, phase: 'Deload — Resensitisation', isDeload: true,
    note: 'Half the volume, ~60% load, 3–4 RIR. Dissipate fatigue so the next block starts fresh near MEV.',
    percentages: { primary: 0.60, secondary: 0.58, isolation: 0.55 },
  }

  // position within the current 4-week mesocycle: week 1, 2, or 3
  const wk = ((week - 1) % 4)   // 0,1,2 for the three accumulation weeks
  const meso = Math.floor((week - 1) / 4) // 0,1,2 — later blocks add a touch more
  const rir = [3, 2, 1][wk] - (meso > 0 ? 0 : 0)  // 3 → 2 → 1 within block
  const baseSets = { primary: 3 + wk + meso, secondary: 3 + wk, isolation: 2 + wk }
  const phaseNames = ['Accumulation', 'Overreach', 'Peak Volume']

  return {
    sets: baseSets,
    reps: { primary: '6–10', secondary: '8–12', isolation: '12–20' },
    rir,
    phase: `Mesocycle ${meso + 1} — ${phaseNames[wk] ?? 'Accumulation'}`,
    isDeload: false,
    note: wk === 0
      ? 'Mesocycle start near MEV. Establish your loads — you\'ll add a set to each major lift over the next two weeks.'
      : wk === 1
      ? 'Volume climbing. Add a set where you recovered well from last week. Push closer to failure (RIR 2).'
      : 'Peak volume — near MRV. Highest sets of the block, RIR 1. After this week, deload to resensitise.',
    percentages: { primary: 0.72, secondary: 0.68, isolation: 0.62 },
  }
}

export const RP_PROGRAM: Program = {
  id:           'rp-hypertrophy',
  name:         'RP Hypertrophy',
  shortName:    'RP Hypertrophy',
  author:       'Dr. Mike Israetel / Renaissance Periodization',
  description:  'Volume-progressive hypertrophy built on Renaissance Periodization principles. A 4-day Upper/Lower split trains every muscle twice weekly while weekly sets ramp from MEV toward MRV across each 4-week mesocycle, with RIR falling 3→1 and a deload to resensitise. Volume is the driver — add sets while you recover, deload before junk volume.',
  focus:        'Hypertrophy',
  daysPerWeek:  4,
  totalWeeks:   12,
  split:        'Upper / Lower',
  workouts:     RP_WORKOUTS,
  getWeekConfig: getRPWeekConfig,
}
