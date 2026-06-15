// ──────────────────────────────────────────────────────────────────────────────
// RETURNING FROM A BREAK — reintroduction / ramp-back logic
//
// Science: a short layoff (1–2 weeks) costs almost no muscle — the strength dip
// is mostly neural/skill plus travel fatigue, and it returns within a session or
// two. So we DON'T lower the stored 1RM. Instead we run a brief reintroduction
// at the CURRENT program week: capped load, reduced volume, RIR held in reserve,
// full ROM to re-groove the pattern and rebuild connective-tissue tolerance.
// Depth and duration scale with how long you were away (Galpin-style ramp-back).
//
// Crucially, sets logged during the reintroduction window are EXCLUDED from the
// smart-suggestion / 1RM basis, so an easy week never drags your programming down.
// ──────────────────────────────────────────────────────────────────────────────

export interface ReintroPlan {
  loadPct: number       // multiply the prescribed working weight
  volumePct: number     // multiply the prescribed set count
  rirCap: number        // never train below this many reps in reserve
  windowDays: number    // calendar days the reintroduction stays active
  daysAway: number
  label: string         // e.g. "12 days off", "3 weeks off"
  blurb: string         // one-line rationale
}

// Volume/RIR are held constant (≈80% volume, ≥3 RIR) across severities — the main
// lever that scales with layoff length is the LOAD cap and the ramp DURATION.
const VOLUME_PCT = 0.80
const RIR_CAP    = 3

const fmtAway = (d: number) =>
  d < 14 ? `${d} days off` : `${Math.floor(d / 7)} weeks off`

// Recommend a ramp-back scaled to the layoff. Returns null for breaks short
// enough that a reintroduction isn't worth it (< 7 days).
export function recommendReintro(daysAway: number): ReintroPlan | null {
  if (daysAway < 7) return null
  const label = fmtAway(daysAway)
  if (daysAway < 14) return {
    loadPct: 0.88, volumePct: VOLUME_PCT, rirCap: RIR_CAP, windowDays: 7, daysAway, label,
    blurb: 'A short break is mostly neural rust, not lost muscle. One easier week re-grooves the pattern and you snap right back.',
  }
  if (daysAway < 21) return {
    loadPct: 0.85, volumePct: VOLUME_PCT, rirCap: RIR_CAP, windowDays: 10, daysAway, label,
    blurb: 'After two weeks, ramp in over ~10 days at lighter loads and reduced volume to rebuild the movement and tissue tolerance.',
  }
  return {
    loadPct: 0.80, volumePct: 0.70, rirCap: 4, windowDays: 14, daysAway, label,
    blurb: 'After three-plus weeks, start near 80% with a two-week ramp. Muscle memory brings strength back fast — no need to rush the loads.',
  }
}

type ReintroSettings = { reintro_until?: string | null; reintro_started_at?: string | null; reintro_load_pct?: number | null }

// Is a reintroduction currently in effect?
export function reintroActive(s: ReintroSettings | null | undefined): boolean {
  return !!s?.reintro_until && new Date(s.reintro_until).getTime() > Date.now()
}

// Days remaining in the active reintroduction (0 if not active).
export function reintroDaysLeft(s: ReintroSettings | null | undefined): number {
  if (!reintroActive(s)) return 0
  return Math.max(0, Math.ceil((new Date(s!.reintro_until!).getTime() - Date.now()) / 86_400_000))
}

// True if a set's completed_at falls inside the reintroduction window — used to
// exclude those sets from the suggestion / 1RM basis so they don't lower future
// prescriptions. Works during AND after the window (start + until are fixed).
export function isReintroSet(completedAt: string | null | undefined, s: ReintroSettings | null | undefined): boolean {
  if (!completedAt || !s?.reintro_started_at || !s?.reintro_until) return false
  const t = new Date(completedAt).getTime()
  return t >= new Date(s.reintro_started_at).getTime() && t <= new Date(s.reintro_until).getTime()
}

// Build the settings patch to START a reintroduction now.
export function startReintroPatch(plan: ReintroPlan) {
  const now = new Date()
  const until = new Date(now.getTime() + plan.windowDays * 86_400_000)
  return {
    reintro_started_at: now.toISOString(),
    reintro_until:      until.toISOString(),
    reintro_load_pct:   plan.loadPct,
  }
}

// Active reintro parameters for scaling prescriptions in the workout.
export const REINTRO_VOLUME_PCT = VOLUME_PCT
export const REINTRO_RIR_CAP    = RIR_CAP
