import { WORKOUTS } from './data'
import { PROGRAM_LIBRARY } from './programLibrary'
import { EXERCISE_ALTS } from './alternatives'

// Map every exercise → its primary muscle group.
// Sourced from EVERY workout list the app has ever shown — the legacy
// 4-day WORKOUTS (so historically-logged names like 'Overhead DB Tricep
// Extension' stay mapped), every program in the library (Galpin 5-day
// incl. Day E, PHAT, future programs), and all swap alternatives (which
// inherit the muscle of the exercise they replace). This guarantees no
// logged set is ever orphaned and dropped from volume tracking.
export const EXERCISE_MUSCLE: Record<string,string> = (() => {
  const m: Record<string,string> = {}
  const add = (workouts: { exercises: { name:string; muscle:string }[] }[]) =>
    workouts.forEach(w => w.exercises.forEach(e => { if (e.name && !m[e.name]) m[e.name] = e.muscle }))
  // 1. Legacy 4-day program — covers names logged before the 5-day rebuild
  add(WORKOUTS)
  // 2. Every exercise across every registered program
  PROGRAM_LIBRARY.forEach(p => add(p.workouts))
  // 3. Alternatives inherit their parent exercise's muscle
  Object.entries(EXERCISE_ALTS).forEach(([parent, altsMap]) => {
    const muscle = m[parent]
    if (!muscle) return
    Object.values(altsMap).forEach(alts =>
      (alts ?? []).forEach(a => { if (a.name && !m[a.name]) m[a.name] = muscle })
    )
  })
  return m
})()

// Muscle group → body region (for the anatomical heatmap)
export const MUSCLE_REGION: Record<string,string> = {
  'Chest':'chest', 'Shoulders':'shoulders', 'Side Delts':'shoulders',
  'Rear Delts':'shoulders', 'Triceps':'arms', 'Biceps':'arms',
  'Back':'back', 'Core':'core', 'Quads':'quads', 'Hamstrings':'hamstrings',
  'Glutes':'glutes', 'Calves':'calves',
}

export interface RawSet { exercise_name:string; weight_lbs:number|null; reps:number|null; completed_at:string }

const epley = (w:number, r:number) => w * (1 + r/30)

// ── e1RM time series for one exercise (best set per day) ────────────
export function e1rmSeries(sets: RawSet[], exerciseName: string): { date:string; e1rm:number }[] {
  const byDay: Record<string, number> = {}
  sets.filter(s => s.exercise_name===exerciseName && s.weight_lbs && s.reps)
      .forEach(s => {
        const day = s.completed_at.slice(0,10)
        const est = Math.round(epley(s.weight_lbs!, s.reps!))
        if (!byDay[day] || est > byDay[day]) byDay[day] = est
      })
  return Object.entries(byDay).map(([date,e1rm]) => ({ date, e1rm })).sort((a,b)=>a.date<b.date?-1:1)
}

// ── Weekly training volume (tonnage = Σ weight×reps) ────────────────
export function weeklyVolume(sets: RawSet[]): { week:string; volume:number }[] {
  const byWeek: Record<string, number> = {}
  sets.forEach(s => {
    if (!s.weight_lbs || !s.reps) return
    const d = new Date(s.completed_at)
    const onejan = new Date(d.getFullYear(),0,1)
    const wk = Math.ceil((((d.getTime()-onejan.getTime())/86400000)+onejan.getDay()+1)/7)
    const label = `${d.getFullYear()}-W${wk}`
    byWeek[label] = (byWeek[label] ?? 0) + s.weight_lbs * s.reps
  })
  return Object.entries(byWeek).map(([week,volume])=>({week,volume})).sort((a,b)=>a.week<b.week?-1:1)
}

// ── Muscle volume distribution (last N days), normalized 0..1 ───────
export function muscleVolume(sets: RawSet[], days = 30): Record<string, number> {
  const cutoff = Date.now() - days*86400000
  const byMuscle: Record<string, number> = {}
  sets.forEach(s => {
    if (!s.reps) return
    if (new Date(s.completed_at).getTime() < cutoff) return
    const muscle = EXERCISE_MUSCLE[s.exercise_name]
    if (!muscle) return
    // Volume = weight×reps (bodyweight counts reps only)
    const vol = (s.weight_lbs ?? 0) > 0 ? s.weight_lbs! * s.reps! : s.reps! * 10
    byMuscle[muscle] = (byMuscle[muscle] ?? 0) + vol
  })
  return byMuscle
}

// ── Region-level intensity for the heatmap (0..1) ──────────────────
export function regionIntensity(sets: RawSet[], days = 30): Record<string, number> {
  const mv = muscleVolume(sets, days)
  const byRegion: Record<string, number> = {}
  Object.entries(mv).forEach(([muscle, vol]) => {
    const region = MUSCLE_REGION[muscle]
    if (region) byRegion[region] = (byRegion[region] ?? 0) + vol
  })
  const max = Math.max(1, ...Object.values(byRegion))
  const norm: Record<string, number> = {}
  Object.entries(byRegion).forEach(([r,v]) => { norm[r] = v/max })
  return norm
}

// ── Personal records (best e1RM ever) per exercise ──────────────────
export function personalRecords(sets: RawSet[]): { exercise:string; e1rm:number; weight:number; reps:number; date:string }[] {
  const best: Record<string, { e1rm:number; weight:number; reps:number; date:string }> = {}
  sets.forEach(s => {
    if (!s.weight_lbs || !s.reps) return
    const est = epley(s.weight_lbs, s.reps)
    if (!best[s.exercise_name] || est > best[s.exercise_name].e1rm) {
      best[s.exercise_name] = { e1rm: est, weight: s.weight_lbs, reps: s.reps, date: s.completed_at.slice(0,10) }
    }
  })
  return Object.entries(best)
    .map(([exercise, b]) => ({ exercise, e1rm: Math.round(b.e1rm), weight: b.weight, reps: b.reps, date: b.date }))
    .sort((a,b) => b.e1rm - a.e1rm)
}

// ── Cycle comparison: best e1RM per exercise, this cycle vs last ────
// Needs sets carrying a cycle_number. Compares the most recent cycle that
// has data against the cycle before it. Returns per-exercise deltas plus a
// headline (how many lifts improved, average strength change).
export interface CycleSet extends RawSet { cycle_number: number|null }
export interface CycleComparison {
  current: number
  previous: number
  lifts: { exercise:string; prev:number; curr:number; delta:number; pct:number }[]
  improved: number
  total: number
  avgPctChange: number
}
export function cycleComparison(sets: CycleSet[]): CycleComparison | null {
  const cycles = Array.from(new Set(sets.map(s => s.cycle_number ?? 1))).sort((a,b)=>a-b)
  if (cycles.length < 2) return null
  const current  = cycles[cycles.length-1]
  const previous = cycles[cycles.length-2]

  const bestIn = (cycle: number) => {
    const best: Record<string, number> = {}
    sets.filter(s => (s.cycle_number ?? 1) === cycle && s.weight_lbs && s.reps).forEach(s => {
      const e = epley(s.weight_lbs!, s.reps!)
      if (!best[s.exercise_name] || e > best[s.exercise_name]) best[s.exercise_name] = e
    })
    return best
  }
  const prevBest = bestIn(previous), currBest = bestIn(current)

  const lifts = Object.keys(currBest)
    .filter(ex => prevBest[ex] != null)            // only lifts present in both cycles
    .map(ex => {
      const prev = Math.round(prevBest[ex]), curr = Math.round(currBest[ex])
      return { exercise: ex, prev, curr, delta: curr-prev, pct: prev>0 ? ((curr-prev)/prev)*100 : 0 }
    })
    .sort((a,b) => b.delta - a.delta)

  if (!lifts.length) return null
  const improved = lifts.filter(l => l.delta > 0).length
  const avgPctChange = lifts.reduce((a,l)=>a+l.pct,0) / lifts.length
  return { current, previous, lifts, improved, total: lifts.length, avgPctChange }
}


export function detectPlateaus(sets: RawSet[]): { exercise:string; sessions:number }[] {
  const out: { exercise:string; sessions:number }[] = []
  const exercises = Array.from(new Set(sets.map(s => s.exercise_name)))
  exercises.forEach(ex => {
    const series = e1rmSeries(sets, ex)
    if (series.length < 3) return
    const recent = series.slice(-3)
    // Plateau if last 3 sessions show no improvement over the first of the three
    if (recent[2].e1rm <= recent[0].e1rm) {
      out.push({ exercise: ex, sessions: recent.length })
    }
  })
  return out
}

// ── Training Index: composite 0–1000 score ─────────────────────────
// Rewards consistency (sessions), total volume, and strength (avg e1RM)
export function trainingIndex(sets: RawSet[]): number {
  if (sets.length === 0) return 0
  const sessions = new Set(sets.map(s => s.completed_at.slice(0,10))).size
  const totalVol = sets.reduce((a,s) => a + ((s.weight_lbs??0)*(s.reps??0)), 0)
  const prs = personalRecords(sets)
  const avgE1rm = prs.length ? prs.reduce((a,p)=>a+p.e1rm,0)/prs.length : 0
  // Weighted composite, capped at 1000
  const score = Math.min(1000,
    sessions * 12 +
    Math.sqrt(totalVol) * 0.8 +
    avgE1rm * 0.6
  )
  return Math.round(score)
}
