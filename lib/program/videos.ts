// ── Technique video links ─────────────────────────────────────────────
// Rather than hardcoding video IDs (which rot as videos are deleted,
// renamed or made private), each exercise gets a YouTube SEARCH deep-link
// with a trusted coaching channel baked into the query. The channel name
// in the query is what pushes that source to the top of the results, so
// the athlete lands on vetted coaching rather than whatever ranks highest
// that week. Links never break, and they follow each channel's current
// best video on a movement.

/** Channels chosen for technique instruction, by the kind of guidance needed. */
export const VIDEO_SOURCES = {
  squatU:   'Squat University',        // movement diagnosis, patterning, core/stability
  barbellM: 'Barbell Medicine',        // heavy barbell lifts, clinician-run, conservative
  nippard:  'Jeff Nippard',            // machines, dumbbells, well-produced and cited
  rp:       'Renaissance Periodization', // hypertrophy isolation technique series
  thrall:   'Alan Thrall',             // plain-spoken barbell coaching
} as const

/** Exercises where one source is clearly the best teacher, regardless of pattern. */
const SOURCE_OVERRIDES: [RegExp, string][] = [
  // Skill-heavy barbell lifts — clinician-run channels, conservative cueing
  [/^barbell back squat$|^back squat$|^front squat$|^safety bar squat$/i, VIDEO_SOURCES.barbellM],
  [/^bench press$|^barbell bench press$|^close.?grip bench press$/i,      VIDEO_SOURCES.barbellM],
  [/^deadlift$|^trap bar deadlift$|^rack deadlift$|^deadlift from boxes$/i, VIDEO_SOURCES.barbellM],
  [/romanian deadlift|^barbell rdl$|stiff.?legged deadlift/i,            VIDEO_SOURCES.barbellM],
  [/^push jerk$|overhead press|military press/i,                          VIDEO_SOURCES.thrall],
  [/^pendlay row$|^barbell row$|bent.?over row/i,                         VIDEO_SOURCES.thrall],
  // Patterning, stability and core — Squat University's strength
  [/plank|dead ?bug|bird ?dog|pallof|mcgill|hollow|carry|hyperextension/i, VIDEO_SOURCES.squatU],
  [/goblet squat|split squat|lunge|glute bridge|hip thrust/i,             VIDEO_SOURCES.squatU],
  [/isometric|nordic|glute ham raise/i,                                   VIDEO_SOURCES.squatU],
]

/** Fallback by equipment / movement class. */
const SOURCE_BY_PATTERN: [RegExp, string][] = [
  [/barbell|smith|ez-?bar|cambered|landmine|scrape the rack/i, VIDEO_SOURCES.barbellM],
  [/machine|cable|pull-?down|press-?down|push-?down|pec deck|rope/i, VIDEO_SOURCES.nippard],
  [/\bdb\b|dumbbell|goblet|kettlebell|\bkb\b/i, VIDEO_SOURCES.nippard],
  [/curl|extension|raise|\bfly\b|kickback|shrug|calf|crunch/i, VIDEO_SOURCES.rp],
  [/pull-?up|chin-?up|\bdip|push-?up|inverted row/i, VIDEO_SOURCES.squatU],
]

/** The coaching channel this exercise's video link should prioritise. */
export function videoSourceFor(exerciseName: string): string {
  for (const [re, src] of SOURCE_OVERRIDES)   if (re.test(exerciseName)) return src
  for (const [re, src] of SOURCE_BY_PATTERN)  if (re.test(exerciseName)) return src
  return VIDEO_SOURCES.squatU
}

/**
 * YouTube search deep-link for an exercise, weighted toward a trusted
 * coaching channel. Search rather than a fixed video so the link cannot
 * break and always reflects that channel's current instruction.
 */
export function techniqueVideoUrl(exerciseName: string): string {
  const source = videoSourceFor(exerciseName)
  const query  = `${exerciseName} technique form ${source}`
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
}
