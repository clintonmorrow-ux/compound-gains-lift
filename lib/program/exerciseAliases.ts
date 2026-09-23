// ── Exercise name aliases ─────────────────────────────────────────────
// Programs come from different sources with different naming conventions.
// The app's original programs say "Barbell Back Squat", "Lying Leg Curl",
// "Seated Cable Row"; the Workout Builder exports say "Back Squat",
// "Prone Leg Curl", "Cable Row". Same movement, different string — which
// meant training maxes and logged history did not follow the athlete when
// they switched programs.
//
// These groups let a lookup fall back across synonyms. The rule for
// including a name here is strict: the movement AND the implement must be
// close enough that the WEIGHT USED transfers honestly. Variants that
// load differently are deliberately NOT grouped — a Pec Deck is not a
// Cable Fly, a Machine Preacher Curl is not a Cambered Bar Preacher Curl,
// and a Sumo Deadlift is not a conventional one. Grouping those would
// hand over a wrong starting weight, which is worse than starting fresh.

const ALIAS_GROUPS: string[][] = [
  // ── squat ──
  ['Back Squat', 'Barbell Back Squat', 'High Bar Back Squat'],
  ['Front Squat', 'Barbell Front Squat'],
  ['Bulgarian Split Squat', 'Bulgarian Split Squat (DB)'],

  // ── hinge ──
  ['Barbell RDL', 'Romanian Deadlift', 'Romanian Deadlift (RDL)', 'Weighted RDL'],
  ['Stiff Legged Deadlift', 'Stiff-Legged Deadlift'],
  ['DB Romanian Deadlift', 'Dumbbell Romanian Deadlift'],

  // ── press ──
  ['Bench Press', 'Barbell Bench Press', 'Flat Barbell Bench Press'],
  ['Dumbbell Bench Press', 'Flat Dumbbell Press', 'DB Bench Press', 'Flat DB Press', 'Flat Dumbbell Bench Press'],
  ['Incline Dumbbell Press', 'Incline DB Press', 'Incline Dumbbell Bench Press'],
  ['Incline Barbell Press', 'Incline Bench Press', 'Incline Barbell Bench Press'],
  ['Decline Barbell Press', 'Decline Bench Press'],
  ['Decline Dumbbell Chest Press', 'Decline Dumbbell Press', 'Decline DB Press'],
  ['Close Grip Bench Press', 'Close-Grip Bench Press'],
  ['Dumbbell Floor Press', 'DB Floor Press'],
  ['Seated Dumbbell Press', 'Seated DB Shoulder Press', 'Seated Dumbbell Shoulder Press'],
  ['Standing Dumbbell Shoulder Press', 'Standing DB Shoulder Press', 'Dumbbell Shoulder Press'],
  ['Overhead Press', 'Barbell Overhead Press', 'Overhead Press (Barbell)', 'Standing Military Press', 'Military Press'],
  ['Seated Military Press', 'Seated Barbell Press'],
  ['Flat Machine Press', 'Chest Press Machine'],

  // ── pull ──
  ['Barbell Row', 'Barbell Bent-Over Row', 'Bent-Over Barbell Row', 'Bent Over Row'],
  ['Dumbbell Row', 'DB Row', 'Single Arm Dumbbell Row', 'One-Arm Dumbbell Row'],
  ['Prone Row', 'Dumbbell Prone Row', 'Chest-Supported Dumbbell Row', 'Incline Dumbbell Row'],
  ['Chest-Supported Row', 'Chest Supported Row'],
  ['Chest-Supported Machine Row', 'Chest Supported Machine Row', 'Machine Row'],
  ['Block Pull Deadlift', 'Deadlift from Boxes', 'Block Pull'],
  ['Deadlift', 'Conventional Deadlift', 'Barbell Deadlift'],
  ['Trap Bar Deadlift', 'Trap-Bar Deadlift', 'Hex Bar Deadlift'],
  ['Cable Row', 'Seated Cable Row', 'Seated Cable Row (Wide)'],
  ['Face Pull', 'Cable Face Pull', 'Rope Face Pull'],
  ['Cable Pullover', 'Straight-Arm Pulldown', 'Straight Arm Pulldown'],
  ['Lat Pulldown', 'Machine Pull-Down', 'Wide Grip Lat Pull-Down'],
  ['Neutral Grip Pull-Down', 'Close Grip Pulldown', 'Close Grip Lat Pull-Down'],
  ['Chin-Up', 'Supinated Grip Pull-Up'],
  // System-weight movements: bodyweight and belt-loaded variants are the
  // SAME scale (body + added), so a bodyweight AMRAP legitimately seeds the
  // loaded max. Chin-Up stays separate — supinated grip changes the lift.
  ['Weighted Pull-Up', 'Pull-Up', 'Neutral-Grip Pull-Up', 'Neutral Grip Pull-Up', 'Pull-Ups'],
  ['Weighted Dips', 'Dip', 'Dips'],

  // ── legs, isolation ──
  ['Machine Leg Extension', 'Leg Extension'],
  ['Machine Hip Abduction', 'Hip Abduction', 'Hip Abduction Machine'],
  ['Prone Leg Curl', 'Lying Leg Curl'],
  ['Barbell Hip Thrust', 'Hip Thrust', 'BB Hip Thrust'],
  ['Leg Press', 'Machine Leg Press', '45° Leg Press'],
  ['Hack Squat', 'Machine Hack Squat'],
  ['Goblet Squat', 'Kettlebell Goblet Squat', 'Dumbbell Goblet Squat'],
  ['Walking Lunge', 'Dumbbell Walking Lunge', 'DB Walking Lunge'],
  ['Split Squat', 'Dumbbell Split Squat'],
  ['Standing Calf Raise', 'Machine Standing Calf Raise', 'Standing Calf Raise Machine'],
  ['Seated Calf Raise', 'Machine Seated Calf Raise'],
  ['Glute Ham Raise', 'Glute-Ham Raise', 'GHR'],
  ['Hyperextensions', 'Back Extension', '45° Back Extension'],

  // ── delts ──
  ['Lateral Raise', 'DB Lateral Raise', 'Seated Dumbbell Lateral Raise', 'Dumbbell Lateral Raise', 'Standing Dumbbell Lateral Raise'],
  ['DB Rear Delt Fly', 'Bent Over Dumbbell Lateral', 'Incline Dumbbell Reverse Fly', 'Dumbbell Rear Delt Fly', 'Rear Delt Fly'],
  ['Reverse Pec Deck Fly', 'Reverse Pec Deck', 'Rear Delt Machine Fly'],
  ['Seated Dumbbell Front Raise', 'Front Lateral Raise', 'Dumbbell Front Raise', 'Front Raise'],
  ['Upright Row', 'Barbell Upright Row'],
  ['Cable Lateral Raise', 'Leaning Cable Lateral Raise', 'Behind-the-Back Cable Lateral Raise'],

  // ── arms ──
  ['Rope Press-Down', 'Tricep Rope Pushdown', 'Rope Tricep Pushdown', 'Rope Pushdown'],
  ['V-Bar Cable Press-Down', 'V-Bar Pushdown', 'V-Bar Tricep Pushdown'],
  ['Overhead Rope Cable Extensions', 'Overhead Rope Extension', 'Cable Overhead Tricep Extension', 'Overhead Cable Tricep Extension'],
  ['EZ-Bar Skull Crusher', 'Skull Crusher', 'EZ Bar Skull Crusher', 'Lying Tricep Extension'],
  ['Dumbbell Skull Crusher', 'DB Skull Crusher'],
  ['Barbell Curl', 'Cambered Bar Curl', 'EZ-Bar Curl', 'EZ Bar Curl'],
  ['Preacher Curl', 'Cambered Bar Preacher Curl', 'EZ-Bar Preacher Curl'],
  ['Hammer Curl', 'Dumbbell Hammer Curl', 'DB Hammer Curl'],
  ['Cable Curl', 'EZ-Bar Cable Curl', 'Straight Bar Cable Curl'],
  ['Seated Overhead Dumbbell Tricep Extension', 'Overhead DB Tricep Extension', 'Seated Overhead Tricep Extension', 'Overhead Dumbbell Tricep Extension'],
  ['Dumbbell Curl', 'DB Curl', 'Seated Dumbbell Curl', 'Standing Alternating Dumbbell Curl'],
  ['Incline DB Curl', 'Incline Dumbbell Curl'],
  ['Dumbbell Fly', 'Flat Dumbbell Fly'],
  ['Spider Curl', 'Dumbbell Spider Curl'],

  // ── core ──
  ['Rope Abdominal Crunch', 'Cable Crunch', 'Straight Bar Cable Crunch', 'Kneeling Cable Crunch'],
  ['Hanging Leg Raise', 'Hanging Straight Leg Raise'],
  ['Hanging Knee Raise', 'Hanging Knee Raises'],
  ['Farmer\'s Carry', 'Farmers Carry', 'Farmer\'s Walk', 'Farmers Walk', 'Trap Bar Carry'],
  ['Cable Kickback', 'Cable Glute Kickback'],
  ['Flat Cable Fly', 'Cable Chest Fly', 'Cable Fly'],
  ['Pec Deck Machine', 'Pec Deck', 'Machine Chest Fly'],
  ['Deadbugs', 'Dead Bug'],
  ['Bird Dogs', 'Bird Dog'],
]

/** name → every name that means the same movement (including itself). */
const ALIAS_INDEX: Record<string, string[]> = (() => {
  const m: Record<string, string[]> = {}
  for (const group of ALIAS_GROUPS) for (const name of group) m[name] = group
  return m
})()

/** Every name this exercise's data might be stored under, most-likely first. */
export function aliasesOf(name: string): string[] {
  const group = ALIAS_INDEX[name]
  if (!group) return [name]
  return [name, ...group.filter(n => n !== name)]
}

/** A stable key shared by all names for the same movement. */
export function canonicalExercise(name: string): string {
  return ALIAS_INDEX[name]?.[0] ?? name
}

/**
 * Look a value up by exercise name, falling back through synonyms.
 * Used for training maxes so switching programs keeps the athlete's maxes.
 */
export function lookupByAlias<T>(map: Record<string, T>, name: string): T | undefined {
  for (const n of aliasesOf(name)) {
    const v = map[n]
    if (v !== undefined && v !== null) return v
  }
  return undefined
}
