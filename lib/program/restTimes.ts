import { WEEK_CONFIG } from './data'
import type { ExerciseType } from '@/types'

// ── Phase-based rest prescriptions (seconds) ──────────────────────────
// Galpin: heavier compound work demands longer inter-set rest to
// maintain power output and allow full CNS recovery.
const REST_TABLE: Record<string, Record<ExerciseType, number>> = {
  'Phase 1 — Accumulation':           { primary: 150, secondary: 120, isolation:  75 },
  'Phase 2 — Volume Build':           { primary: 180, secondary: 150, isolation:  90 },
  'Phase 3 — Intensification':        { primary: 210, secondary: 180, isolation: 120 },
  'Phase 3 — Intensification  (PEAK)':{ primary: 240, secondary: 210, isolation: 150 },
  'DELOAD — Active Recovery':         { primary:  90, secondary:  75, isolation:  60 },
  'FINAL DELOAD':                     { primary:  90, secondary:  75, isolation:  60 },
}

export function getRestSeconds(weekNumber: number, exerciseType: ExerciseType): number {
  const phase = WEEK_CONFIG[weekNumber]?.phase ?? ''
  return REST_TABLE[phase]?.[exerciseType] ?? 120
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
