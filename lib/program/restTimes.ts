import { WEEK_CONFIG } from './data'
import type { ExerciseType, DayType } from '@/types'

// ── Phase-based rest prescriptions (seconds) ──────────────────────────
// Evidence-based caps (Schoenfeld 2016; Grgic 2017; Singer 2024 meta):
// compounds need MORE than ~60–90s to preserve volume load, with ~2–3 min
// sufficient for hypertrophy — there is no evidence 3.5–4 min beats 2.5–3
// when training at 1–3 RIR (this program never trains to failure).
// Isolations recover in 60–90s. These caps keep every session ≤ ~75 min;
// the old table escalated to 210–240s and pushed Phase-3 lower days
// past 100 minutes.
const REST_TABLE: Record<string, Record<ExerciseType, number>> = {
  'Phase 1 — Accumulation':            { primary: 135, secondary: 100, isolation: 60 },
  'Phase 2 — Volume Build':            { primary: 150, secondary: 110, isolation: 60 },
  'Phase 3 — Intensification':         { primary: 150, secondary: 120, isolation: 65 },
  'Phase 3 — Intensification (PEAK)': { primary: 150, secondary: 115, isolation: 65 },
  'DELOAD — Active Recovery':          { primary:  90, secondary:  75, isolation: 60 },
  'FINAL DELOAD':                      { primary:  90, secondary:  75, isolation: 60 },
}

// ── PHAT-specific rest (very different per day type) ──────────────────
// Power days: full ATP-PCr replenishment required for maximum force output.
//   Research: ~3–5 min rest restores 95%+ of phosphocreatine stores.
// Hypertrophy days: shorter rest maintains metabolic stress (lactate,
//   hydrogen ions, growth hormone response) — the adaptation signal.
const PHAT_POWER_REST:      Record<ExerciseType, number> = { primary: 240, secondary: 180, isolation: 90  }
const PHAT_HYPERTROPHY_REST: Record<ExerciseType, number> = { primary:  90, secondary:  75, isolation: 60  }
const PHAT_DELOAD_REST:      Record<ExerciseType, number> = { primary:  75, secondary:  60, isolation: 45  }

export function getRestSeconds(
  weekNumber: number,
  exerciseType: ExerciseType,
  programId?: string,
  dayType?: DayType,
): number {
  // PHAT uses fundamentally different rest prescriptions per day type
  if (programId === 'layne-norton-phat') {
    const cfg = WEEK_CONFIG[weekNumber]
    if (cfg?.isDeload) return PHAT_DELOAD_REST[exerciseType]
    if (dayType === 'power')       return PHAT_POWER_REST[exerciseType]
    if (dayType === 'hypertrophy') return PHAT_HYPERTROPHY_REST[exerciseType]
  }
  // Galpin / standard: phase-based, with a sensible per-type fallback
  // for any program whose phase labels aren't in REST_TABLE.
  const phase = WEEK_CONFIG[weekNumber]?.phase ?? ''
  const TYPE_DEFAULT: Record<ExerciseType, number> = { primary: 150, secondary: 120, isolation: 75 }
  return REST_TABLE[phase]?.[exerciseType] ?? TYPE_DEFAULT[exerciseType]
}

// ── Rest context label for the in-workout rest timer ─────────────────
// Surfaces the physiological rationale while the user is resting
export function getRestContext(
  exerciseType: ExerciseType,
  programId?: string,
  dayType?: DayType,
): string {
  if (programId === 'layne-norton-phat') {
    if (dayType === 'power') {
      if (exerciseType === 'primary')
        return 'Full ATP-PCr replenishment — max force output requires complete phosphocreatine restoration'
      return 'CNS recovery — power training demands longer inter-set recovery than hypertrophy work'
    }
    if (dayType === 'hypertrophy') {
      if (exerciseType === 'isolation')
        return 'Short rest maintains metabolic stress — lactate and hydrogen ion accumulation drives the hypertrophy signal'
      return 'Controlled rest — enough to perform quality reps, short enough to maintain metabolic environment'
    }
  }
  if (exerciseType === 'primary')   return 'Full compound rest — allow your CNS and ATP-PCr to recover for quality reps'
  if (exerciseType === 'isolation') return 'Active recovery — isolation work requires less CNS demand between sets'
  return 'Rest and breathe — quality beats rushing'
}

export function formatRestTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}:00` : `${m}:${String(s).padStart(2, '0')}`
}

// ── Push notification ─────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function fireRestCompleteNotification(exerciseName: string) {
  if (typeof window === 'undefined') return
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Rest Complete 🏋️', {
      body: `Ready for your next set — ${exerciseName}`,
      icon: '/icon-192.png',
      silent: false,
    })
  }
  playReadyBeep()
  if ('vibrate' in navigator) navigator.vibrate([100, 50, 200])
}

// ── Audio tone (two ascending notes) ─────────────────────────────────
function playReadyBeep() {
  try {
    type AudioCtxClass = typeof AudioContext
    const Ctx: AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    ;[880, 1100].forEach((freq, i) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain); gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.28, t + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.start(t); osc.stop(t + 0.35)
    })
  } catch { /* silent fail in environments without Audio API */ }
}

// ── Antagonist / non-competing paired-set suggestions ─────────────────
// Robbins et al.: pairing accessory exercises for opposing or unrelated
// muscles ("superset" — alternate the two, ~60s between moves) cuts
// accessory time ~40% with no measured loss in hypertrophy or volume load.
// Only isolation work is paired (never compounds), and only when the two
// muscles don't compete.
export function getSupersetPairs(exercises: { name: string; muscle: string; type: string }[]): Record<string, string> {
  // Pairable = all isolation work, plus small-muscle secondary work
  // (calves/core) — never primary or large-muscle compounds.
  const SMALL = new Set(['Calves', 'Core'])
  const pool = exercises.filter(e =>
    e.type === 'isolation' || (e.type === 'secondary' && SMALL.has(e.muscle)))
  const pairs: Record<string, string> = {}
  const used = new Set<string>()
  for (let i = 0; i < pool.length; i++) {
    if (used.has(pool[i].name)) continue
    for (let j = i + 1; j < pool.length; j++) {
      if (used.has(pool[j].name)) continue
      if (pool[i].muscle !== pool[j].muscle) {
        pairs[pool[i].name] = pool[j].name
        pairs[pool[j].name] = pool[i].name
        used.add(pool[i].name); used.add(pool[j].name)
        break
      }
    }
  }
  return pairs
}
