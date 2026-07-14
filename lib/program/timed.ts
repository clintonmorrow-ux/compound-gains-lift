// ── Timed (isometric) exercises: planks, wall sits, holds, carries ─────
// These are trained for DURATION, not reps. Logged sets store the seconds
// held in the `reps` column (tempo='timed' marks the row), and added load
// in weight_lbs. They are bodyweight/non-loadable exercises, so they are
// already excluded from all 1RM estimation.
//
// Progression model (standard isometric practice):
//   • Build the hold +5s per session while under 60 seconds.
//   • At 60s+, more time stops paying — add load and reset to ~35s
//     (a weighted 35s hold beats a marathon unweighted one for strength).
//   • Deloads: ~60% of the last hold.

export function isTimedExercise(name: string): boolean {
  return /\bplank\b|wall sit|hollow hold|dead hang|l-sit|iso(metric)? hold|farmer'?s? (carry|walk)|suitcase carry/i.test(name)
}

export interface TimedTarget {
  seconds: number
  weight: number      // suggested added load (0 = bodyweight)
  note: string
}

const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5)

export function suggestTimedTarget(
  lastSeconds: number | null,
  lastWeight: number | null,
  isDeload: boolean,
): TimedTarget {
  const lw = lastWeight ?? 0
  if (lastSeconds == null || lastSeconds <= 0) {
    return { seconds: 30, weight: 0,
      note: 'First session — hold with perfect form for as long as you can. The app progresses you from whatever you log.' }
  }
  if (isDeload) {
    return { seconds: Math.max(15, r5(lastSeconds * 0.6)), weight: lw,
      note: `Deload — ~60% of your last ${lastSeconds}s hold. Easy and clean.` }
  }
  if (lastSeconds >= 60) {
    return { seconds: 35, weight: lw + 10,
      note: `You held ${lastSeconds}s${lw > 0 ? ` with +${lw} lbs` : ''} — past 60s, load beats time. Add weight and reset to ~35s.` }
  }
  return { seconds: r5(lastSeconds + 5), weight: lw,
    note: `+5s on your last hold (${lastSeconds}s${lw > 0 ? ` @ +${lw} lbs` : ''}).` }
}
