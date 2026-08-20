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
  ['Bench Press', 'Barbell Bench Press'],
  ['Seated Dumbbell Press', 'Seated DB Shoulder Press'],
  ['Standing Military Press', 'Barbell Overhead Press', 'Overhead Press', 'Overhead Press (Barbell)'],
  ['Seated Military Press', 'Seated Barbell Press'],
  ['Flat Machine Press', 'Chest Press Machine'],

  // ── pull ──
  ['Barbell Row', 'Barbell Bent-Over Row'],
  ['Cable Row', 'Seated Cable Row'],
  ['Lat Pulldown', 'Machine Pull-Down', 'Wide Grip Lat Pull-Down'],
  ['Neutral Grip Pull-Down', 'Close Grip Pulldown', 'Close Grip Lat Pull-Down'],
  ['Chin-Up', 'Supinated Grip Pull-Up'],

  // ── legs, isolation ──
  ['Machine Leg Extension', 'Leg Extension'],
  ['Machine Hip Abduction', 'Hip Abduction', 'Hip Abduction Machine'],
  ['Prone Leg Curl', 'Lying Leg Curl'],

  // ── delts ──
  ['Lateral Raise', 'DB Lateral Raise', 'Seated Dumbbell Lateral Raise'],
  ['Cable Lateral Raise', 'Leaning Cable Lateral Raise', 'Behind-the-Back Cable Lateral Raise'],

  // ── arms ──
  ['Rope Press-Down', 'Tricep Rope Pushdown', 'Rope Tricep Pushdown'],
  ['Seated Overhead Dumbbell Tricep Extension', 'Overhead DB Tricep Extension'],
  ['Dumbbell Curl', 'DB Curl', 'Seated Dumbbell Curl', 'Standing Alternating Dumbbell Curl'],
  ['Incline DB Curl', 'Incline Dumbbell Curl'],
  ['Dumbbell Fly', 'Flat Dumbbell Fly'],
  ['Spider Curl', 'Dumbbell Spider Curl'],

  // ── core ──
  ['Rope Abdominal Crunch', 'Cable Crunch'],
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
