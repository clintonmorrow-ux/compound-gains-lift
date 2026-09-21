import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Bodyweight Build — 12-Week
//
// Designed for Clint, not transcribed. Brief: 4 days x ~45 min, bodyweight
// as the primary load with a pull-up bar, dip bars, bands, vest, belt,
// bench, box and rope; lean down, build the engine, keep the strength;
// and rebuild an irritated elbow rather than aggravate it.
//
// Evidence it rests on:
//   - Low-load training taken close to failure builds muscle comparably to
//     heavy loading (Schoenfeld et al. 2017 meta-analysis), but strength
//     favours higher loads — so every slot sits on a progression ladder
//     and load returns through belt and vest, not through more reps.
//   - HIIT is time-efficient for fat loss and VO2max; long intervals
//     (≥2 min) drive VO2max harder than short bursts. Conditioning
//     alternates short rope/burpee intervals with 3-4 min engine rounds.
//   - Tendon rehab: isometric holds in the 30-45s window, progressed by
//     load, kept in the first eight weeks.
//
// Three blocks. The ELBOW sets the pace of block 1, not strength: neutral
// grip, slow eccentrics, RIR 3 on pulling, push-ups instead of dips.
// Block 2 brings load back only if the elbow is quiet. Block 3 peaks.
// Tests open weeks 1, 8 and 12; each test's note says which rung of the
// ladder to swap to based on the number.
// ═══════════════════════════════════════════════════════════════════════

export const BODYWEIGHT_ID = 'bodyweight-build-4day'

/** [dayKey][exercise][week] -> prescription cell. */
const SCHEDULE: Record<string, Record<string, Record<number, any>>> = {
  A: {
    'Pull-Up': { 1:{"test": "test-reps"}, 8:{"test": "test-reps"}, 12:{"test": "test-reps"} },
    'Push-Up': { 1:{"test": "test-reps"}, 8:{"test": "test-reps"}, 12:{"test": "test-reps"} },
    'Pistol Squat': { 1:{"test": "test-reps"}, 8:{"test": "test-reps"}, 9:{"sets": 4, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 6, "rir": 1, "label": "5-6", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 6, "rir": 1, "label": "5-6", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null} },
    'Neutral-Grip Pull-Up': { 1:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null} },
    'Band-Assisted Pistol Squat': { 1:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null} },
    'Feet-Elevated Inverted Row': { 1:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null} },
    'Band-Assisted Nordic Curl': { 1:{"sets": 2, "reps": 6, "rir": 3, "label": "5-6", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 6, "rir": 3, "label": "5-6", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 6, "rir": 3, "label": "5-6", "rest": null, "secs": null} },
    'Biceps Isometric Hold': { 1:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 2:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 3:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 4:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 5:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 6:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 7:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 8:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40} },
    'Jump Rope Intervals': { 1:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 2:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 3:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 4:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 5:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 6:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 7:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 8:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 9:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 20, "secs": 40}, 10:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 20, "secs": 40}, 11:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 20, "secs": 40}, 12:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 20, "secs": 40} },
    'Weighted Pull-Up': { 5:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 6:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 7:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 8:{"sets": 3, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 9:{"sets": 5, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null}, 10:{"sets": 5, "reps": 6, "rir": 1, "label": "5-6", "rest": null, "secs": null}, 11:{"sets": 6, "reps": 6, "rir": 1, "label": "5-6", "rest": null, "secs": null}, 12:{"sets": 4, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null} },
    'Box Pistol Squat': { 5:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 7:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null} },
    'Weighted Inverted Row': { 5:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null} },
    'Nordic Curl': { 5:{"sets": 3, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 6, "rir": 2, "label": "5-6", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 6, "rir": 1, "label": "5-6", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 6, "rir": 3, "label": "5-6", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
  },
  B: {
    'L-Sit': { 1:{"test": "test-hold"}, 8:{"test": "test-hold"}, 12:{"test": "test-hold"} },
    'Dead Hang': { 1:{"test": "test-hold"}, 8:{"test": "test-hold"}, 12:{"test": "test-hold"} },
    'Hollow Hold': { 1:{"test": "test-hold"}, 8:{"test": "test-hold"}, 12:{"test": "test-hold"} },
    'Deficit Push-Up': { 1:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 4, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 5, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null} },
    'Pike Push-Up': { 1:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null} },
    'Single-Leg Hip Thrust': { 1:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 11, "rir": 1, "label": "10-12", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 11, "rir": 1, "label": "10-12", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 11, "rir": 1, "label": "10-12", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null} },
    'Single-Leg RDL': { 1:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null} },
    'Triceps Isometric Hold': { 1:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 2:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 3:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 4:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 35}, 5:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 6:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 7:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40}, 8:{"sets": 3, "reps": 1, "rir": 5, "label": "1", "rest": 60, "secs": 40} },
    'Box Step-Up Engine Round': { 1:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 180}, 2:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 180}, 3:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 180}, 4:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 180}, 5:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 6:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 7:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 8:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 9:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 10:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 11:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 12:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240} },
    'Weighted Push-Up': { 5:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 5, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
    'Elevated Pike Push-Up': { 5:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 7:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 7, "rir": 3, "label": "6-8", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
  },
  C: {
    'Feet-Elevated Inverted Row': { 1:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 2:{"sets": 4, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 3:{"sets": 5, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 4:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null} },
    'Deficit Push-Up': { 1:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null} },
    'Band Face Pull': { 1:{"sets": 2, "reps": 18, "rir": 3, "label": "15-20", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 18, "rir": 3, "label": "15-20", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 18, "rir": 2, "label": "15-20", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 18, "rir": 3, "label": "15-20", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 18, "rir": 2, "label": "15-20", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 18, "rir": 2, "label": "15-20", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 18, "rir": 1, "label": "15-20", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 18, "rir": 3, "label": "15-20", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 18, "rir": 2, "label": "15-20", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 18, "rir": 1, "label": "15-20", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 18, "rir": 1, "label": "15-20", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 18, "rir": 2, "label": "15-20", "rest": null, "secs": null} },
    'Hanging Leg Raise': { 1:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 11, "rir": 1, "label": "10-12", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 14, "rir": 1, "label": "12-15", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 14, "rir": 1, "label": "12-15", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null} },
    'L-Sit': { 1:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 15}, 2:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 15}, 3:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 15}, 4:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 15}, 5:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 20}, 6:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 20}, 7:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 20}, 8:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 20}, 9:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 30}, 10:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 30}, 11:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 30}, 12:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 45, "secs": 30} },
    'Burpee Intervals': { 1:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 2:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 3:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 4:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 5:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 6:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 7:{"sets": 10, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 8:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 40, "secs": 20}, 9:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 10:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 11:{"sets": 8, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30}, 12:{"sets": 6, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 30} },
    'Weighted Inverted Row': { 5:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 5, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
    'Dip': { 5:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 4, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null} },
    'Weighted Dips': { 9:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
  },
  D: {
    'Bulgarian Split Squat': { 1:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 5:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 5, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 3, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 7, "rir": 1, "label": "6-8", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 7, "rir": 2, "label": "6-8", "rest": null, "secs": null} },
    'Weighted Box Step-Up': { 1:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 11, "rir": 2, "label": "10-12", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 11, "rir": 3, "label": "10-12", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 7:{"sets": 4, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 9, "rir": 3, "label": "8-10", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 11:{"sets": 5, "reps": 9, "rir": 1, "label": "8-10", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 9, "rir": 2, "label": "8-10", "rest": null, "secs": null} },
    'Box Jump': { 1:{"sets": 3, "reps": 5, "rir": 3, "label": "5", "rest": null, "secs": null}, 2:{"sets": 4, "reps": 5, "rir": 3, "label": "5", "rest": null, "secs": null}, 3:{"sets": 4, "reps": 5, "rir": 2, "label": "5", "rest": null, "secs": null}, 4:{"sets": 3, "reps": 5, "rir": 3, "label": "5", "rest": null, "secs": null}, 5:{"sets": 4, "reps": 5, "rir": 2, "label": "5", "rest": null, "secs": null}, 6:{"sets": 4, "reps": 5, "rir": 2, "label": "5", "rest": null, "secs": null}, 7:{"sets": 4, "reps": 5, "rir": 1, "label": "5", "rest": null, "secs": null}, 8:{"sets": 3, "reps": 5, "rir": 3, "label": "5", "rest": null, "secs": null}, 9:{"sets": 4, "reps": 5, "rir": 2, "label": "5", "rest": null, "secs": null}, 10:{"sets": 4, "reps": 5, "rir": 1, "label": "5", "rest": null, "secs": null}, 11:{"sets": 4, "reps": 5, "rir": 1, "label": "5", "rest": null, "secs": null}, 12:{"sets": 3, "reps": 5, "rir": 2, "label": "5", "rest": null, "secs": null} },
    'Reverse Hyperextensions': { 1:{"sets": 2, "reps": 14, "rir": 3, "label": "12-15", "rest": null, "secs": null}, 2:{"sets": 3, "reps": 14, "rir": 3, "label": "12-15", "rest": null, "secs": null}, 3:{"sets": 3, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null}, 4:{"sets": 2, "reps": 14, "rir": 3, "label": "12-15", "rest": null, "secs": null}, 5:{"sets": 3, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null}, 6:{"sets": 3, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null}, 7:{"sets": 3, "reps": 14, "rir": 1, "label": "12-15", "rest": null, "secs": null}, 8:{"sets": 2, "reps": 14, "rir": 3, "label": "12-15", "rest": null, "secs": null}, 9:{"sets": 3, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null}, 10:{"sets": 3, "reps": 14, "rir": 1, "label": "12-15", "rest": null, "secs": null}, 11:{"sets": 3, "reps": 14, "rir": 1, "label": "12-15", "rest": null, "secs": null}, 12:{"sets": 2, "reps": 14, "rir": 2, "label": "12-15", "rest": null, "secs": null} },
    'Side Plank': { 1:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 25}, 2:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 25}, 3:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 25}, 4:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 25}, 5:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 35}, 6:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 35}, 7:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 35}, 8:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 35}, 9:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 45}, 10:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 45}, 11:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 45}, 12:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 30, "secs": 45} },
    'Jump Rope Engine Round': { 1:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 120, "secs": 180}, 2:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 120, "secs": 180}, 3:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 120, "secs": 180}, 4:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 120, "secs": 180}, 5:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 6:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 7:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 8:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 90, "secs": 240}, 9:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 10:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 11:{"sets": 3, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240}, 12:{"sets": 2, "reps": 1, "rir": 0, "label": "1", "rest": 75, "secs": 240} },
  },
}

const WEEK_WORKOUTS: Record<number, Workout[]> = {
  1: [
    {
      key: 'A', name: 'Pull & Legs — Test', shortName: 'Pull & Legs · Test', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'TEST · strict, chin over bar, full hang · stop when form breaks' },
        { name: 'Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'TEST · chest to floor every rep · stop when the hips sag' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Neutral-Grip Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Neutral grip is kindest to the elbow · 3-sec lower · full hang between reps' },
        { name: 'Band-Assisted Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Band under the foot, held at the chest · sit all the way down · same reps each leg' },
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Band-Assisted Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored under the bench · band at the chest · lower as slowly as you can' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge — Test', shortName: 'Push & Hinge · Test', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Dead Hang', muscle: 'Back', type: 'isolation', isBodyweight: true, cue: 'TEST · passive hang, shoulders relaxed · grip and elbow tolerance' },
        { name: 'Hollow Hold', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Lower back pinned to the floor · shoulders and legs off · hold' },
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Hips high · head toward the floor between the hands · elbows track forward' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  2: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Neutral-Grip Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Neutral grip is kindest to the elbow · 3-sec lower · full hang between reps' },
        { name: 'Band-Assisted Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Band under the foot, held at the chest · sit all the way down · same reps each leg' },
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Band-Assisted Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored under the bench · band at the chest · lower as slowly as you can' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Hips high · head toward the floor between the hands · elbows track forward' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  3: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Neutral-Grip Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Neutral grip is kindest to the elbow · 3-sec lower · full hang between reps' },
        { name: 'Band-Assisted Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Band under the foot, held at the chest · sit all the way down · same reps each leg' },
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Band-Assisted Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored under the bench · band at the chest · lower as slowly as you can' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Hips high · head toward the floor between the hands · elbows track forward' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  4: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Neutral-Grip Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Neutral grip is kindest to the elbow · 3-sec lower · full hang between reps' },
        { name: 'Band-Assisted Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Band under the foot, held at the chest · sit all the way down · same reps each leg' },
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Band-Assisted Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored under the bench · band at the chest · lower as slowly as you can' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Hips high · head toward the floor between the hands · elbows track forward' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Feet-Elevated Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · body rigid · pull the chest to the bar' },
        { name: 'Deficit Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Hands on the dip bars · chest below hand level · full lockout' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  5: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Box Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Sit to the box on one leg · pause · stand without rocking' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Dip', muscle: 'Chest', type: 'secondary', isBodyweight: true, cue: 'Bar dips · shoulders down and back · stop at 90° if the elbow talks' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  6: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Box Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Sit to the box on one leg · pause · stand without rocking' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Dip', muscle: 'Chest', type: 'secondary', isBodyweight: true, cue: 'Bar dips · shoulders down and back · stop at 90° if the elbow talks' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  7: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Box Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Sit to the box on one leg · pause · stand without rocking' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Dip', muscle: 'Chest', type: 'secondary', isBodyweight: true, cue: 'Bar dips · shoulders down and back · stop at 90° if the elbow talks' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  8: [
    {
      key: 'A', name: 'Pull & Legs — Test', shortName: 'Pull & Legs · Test', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'TEST · strict, chin over bar, full hang · stop when form breaks' },
        { name: 'Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'TEST · chest to floor every rep · stop when the hips sag' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Box Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Sit to the box on one leg · pause · stand without rocking' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Biceps Isometric Hold', muscle: 'Biceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · 90° elbow, hold a light band or bell · pain ≤3/10' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge — Test', shortName: 'Push & Hinge · Test', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Dead Hang', muscle: 'Back', type: 'isolation', isBodyweight: true, cue: 'TEST · passive hang, shoulders relaxed · grip and elbow tolerance' },
        { name: 'Hollow Hold', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Lower back pinned to the floor · shoulders and legs off · hold' },
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Triceps Isometric Hold', muscle: 'Triceps', type: 'isolation', isBodyweight: true, cue: 'Tendon-friendly · press into a fixed bar at 90° · pain ≤3/10' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Dip', muscle: 'Chest', type: 'secondary', isBodyweight: true, cue: 'Bar dips · shoulders down and back · stop at 90° if the elbow talks' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  9: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Weighted Dips', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Belt load · lean forward for chest · full depth, no bouncing' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  10: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Weighted Dips', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Belt load · lean forward for chest · full depth, no bouncing' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  11: [
    {
      key: 'A', name: 'Pull & Legs', shortName: 'Pull & Legs', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge', shortName: 'Push & Hinge', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Weighted Dips', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Belt load · lean forward for chest · full depth, no bouncing' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
  12: [
    {
      key: 'A', name: 'Pull & Legs — Test', shortName: 'Pull & Legs · Test', day: 'Day 1', focus: 'Back · Quads · Hamstrings · Rope',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'TEST · strict, chin over bar, full hang · stop when form breaks' },
        { name: 'Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'TEST · chest to floor every rep · stop when the hips sag' },
        { name: 'Pistol Squat', muscle: 'Quads', type: 'primary', isBodyweight: true, cue: 'Full single-leg squat · heel stays down · arms forward for balance' },
        { name: 'Weighted Pull-Up', muscle: 'Back', type: 'primary', isBodyweight: true, cue: 'Belt load · full hang to chin over bar · control the descent' },
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Nordic Curl', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Feet anchored · lower under control · push back up with hands if needed' },
        { name: 'Jump Rope Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Work the interval, rest the interval · smooth bounce, stay tall' },
      ],
    },
    {
      key: 'B', name: 'Push & Hinge — Test', shortName: 'Push & Hinge · Test', day: 'Day 2', focus: 'Chest · Shoulders · Glutes · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Dead Hang', muscle: 'Back', type: 'isolation', isBodyweight: true, cue: 'TEST · passive hang, shoulders relaxed · grip and elbow tolerance' },
        { name: 'Hollow Hold', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Lower back pinned to the floor · shoulders and legs off · hold' },
        { name: 'Weighted Push-Up', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Vest on · chest to the floor · body in one line' },
        { name: 'Elevated Pike Push-Up', muscle: 'Shoulders', type: 'secondary', isBodyweight: true, cue: 'Feet on the box · torso vertical · the closest thing to a handstand push-up' },
        { name: 'Single-Leg Hip Thrust', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Shoulders on the bench · one foot · squeeze at the top, hips level' },
        { name: 'Single-Leg RDL', muscle: 'Hamstrings', type: 'secondary', isBodyweight: true, cue: 'Hinge on one leg · hips square · vest or bell in hand for load' },
        { name: 'Box Step-Up Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous alternating step-ups for the round · hard but sustainable' },
      ],
    },
    {
      key: 'C', name: 'Upper Density', shortName: 'Upper Density', day: 'Day 3', focus: 'Back · Chest · Core · Intervals',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Weighted Inverted Row', muscle: 'Back', type: 'secondary', isBodyweight: true, cue: 'Vest on, feet elevated · rigid line ear to ankle · chest to bar' },
        { name: 'Weighted Dips', muscle: 'Chest', type: 'primary', isBodyweight: true, cue: 'Belt load · lean forward for chest · full depth, no bouncing' },
        { name: 'Band Face Pull', muscle: 'Rear Delts', type: 'isolation', isBodyweight: false, cue: 'Elbows high · pull to the face and rotate the hands back · shoulder health' },
        { name: 'Hanging Leg Raise', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'From a dead hang · legs to 90° or higher · no swing' },
        { name: 'L-Sit', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'On the dip bars · legs straight and level · hold' },
        { name: 'Burpee Intervals', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Chest to floor, jump at the top · steady pace you can hold every round' },
      ],
    },
    {
      key: 'D', name: 'Legs & Engine', shortName: 'Legs & Engine', day: 'Day 4', focus: 'Glutes · Quads · Power · Engine',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~45 min', restTimes: '2 min main lifts · 75 sec accessories · intervals as prescribed',
      exercises: [
        { name: 'Bulgarian Split Squat', muscle: 'Glutes', type: 'secondary', isBodyweight: true, cue: 'Rear foot on the bench · vest for load · front knee tracks over toes' },
        { name: 'Weighted Box Step-Up', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Vest on · drive through the whole foot · do not push off the back leg' },
        { name: 'Box Jump', muscle: 'Quads', type: 'secondary', isBodyweight: true, cue: 'Land soft and quiet · step down, never jump down · quality over height' },
        { name: 'Reverse Hyperextensions', muscle: 'Glutes', type: 'isolation', isBodyweight: true, cue: 'Hips over the bench end · legs rise together · squeeze, no lower-back arch' },
        { name: 'Side Plank', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Straight line · hips high · hold each side' },
        { name: 'Jump Rope Engine Round', muscle: 'Core', type: 'isolation', isBodyweight: true, cue: 'Continuous rope for the round · conversational-hard, not sprinting' },
      ],
    },
  ],
}

const TEST_NOTE: Record<string, string> = {
  "Pull-Up": "Baseline: as many strict reps as you can. 12+ \u2192 swap the block-2 pull-up slot to Weighted (start 10\u201315 lb). 6\u201311 \u2192 bodyweight. Under 6 \u2192 Band-Assisted.",
  "Push-Up": "Baseline: max clean reps. 30+ \u2192 you are ready for Weighted Push-Ups in block 2. Under 20 \u2192 stay on Deficit Push-Ups.",
  "Pistol Squat": "Baseline: reps per leg with the LEAST assistance you can manage. Note which rung \u2014 band, box, or free.",
  "L-Sit": "Baseline: longest clean hold, legs level. Under 10s \u2192 tuck the knees.",
  "Dead Hang": "Baseline: longest hang. Also a read on the elbow \u2014 note any pain.",
  "Hollow Hold": "Baseline: longest hold with the lower back pinned down."
}

export function bodyweightWorkouts(week: number): Workout[] {
  return WEEK_WORKOUTS[Math.max(1, Math.min(12, week))] ?? WEEK_WORKOUTS[1]
}

export function bodyweightPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const c = SCHEDULE[dayKey]?.[exerciseName]?.[Math.max(1, Math.min(12, week))]
  if (!c) return null
  if (c.test) {
    // Bodyweight baseline tests: as many clean reps, or as long a hold, as possible.
    const note = TEST_NOTE[exerciseName] ?? 'Baseline test — as many clean reps as you can.'
    return c.test === 'test-hold'
      ? { sets: 1, reps: 1, rir: 0, pct: 0, seconds: 60, testMode: 'reps', testNote: note, noOneRm: true }
      : { sets: 1, reps: 1, rir: 0, pct: 0, repsLabel: 'AMRAP', amrap: true, testMode: 'reps', testNote: note }
  }
  const base: Prescription = { sets: c.sets, reps: c.reps, rir: c.rir, pct: rtfPercent(c.reps, c.rir), repsLabel: c.label }
  if (c.rest != null) base.restSec = c.rest
  if (c.secs != null) { base.seconds = c.secs; base.repsLabel = `${c.secs}s`; base.noOneRm = true }
  return base
}

export function getBodyweightWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const block = week <= 4 ? 1 : week <= 8 ? 2 : 3
  const light = [4, 8, 12].includes(week)
  const test  = [1, 8, 12].includes(week)
  const rir   = block === 1 ? 3 : block === 2 ? 2 : 1
  const name  = block === 1 ? 'Block 1 — Rebuild' : block === 2 ? 'Block 2 — Build' : 'Block 3 — Peak'
  return {
    sets:  { primary: 3, secondary: 3, isolation: 3 },
    reps:  { primary: '6-8', secondary: '8-12', isolation: '12-15' },
    rir,
    phase: `${name} (week ${week})${light ? ' · Light' : ''}${test ? ' · Test' : ''}`,
    isDeload: light,
    note: test
      ? 'Test week. Days 1 and 2 open with baseline tests — max reps and max holds. Each test tells you which rung of the ladder to swap to. The rest of the week is light.'
      : block === 1
        ? 'The elbow sets the pace this block, not your strength. Neutral-grip pulling, slow eccentrics, three reps in reserve, isometric holds. Push-ups instead of dips. Nothing heroic.'
        : block === 2
          ? 'Load comes back — belt on the pull-ups, vest on the push-ups and step-ups — only if the elbow is quiet. Dips return light. Conditioning volume steps up.'
          : 'Peak. Heaviest rungs, one rep in reserve, longer engine rounds. Final tests in week 12.',
    percentages: { primary: rtfPercent(7, rir), secondary: rtfPercent(10, rir), isolation: rtfPercent(14, rir) },
  }
}

export const BODYWEIGHT_PROGRAM: Program = {
  id:            BODYWEIGHT_ID,
  name:          'Bodyweight Build — 12-Week',
  shortName:     'Bodyweight Build',
  author:        'Designed for Clint · evidence-based',
  description:   'Four days a week, about forty-five minutes, bodyweight as the primary load. Every movement sits on a progression ladder — pull-ups go from neutral grip to belt-loaded, pistols from band-assisted to free, push-ups from deficit to vest-loaded — so strength keeps climbing without a barbell. Conditioning alternates short jump-rope and burpee intervals with three-to-four-minute engine rounds, the mix the research favours for both fat loss and VO2max. Block one is paced by the elbow: neutral-grip pulling, slow eccentrics, tendon-loading isometrics, and no dips until it is quiet. Baseline tests open weeks one, eight and twelve.',
  focus:         'Bodyweight · Conditioning · Elbow Rebuild',
  daysPerWeek:   4,
  totalWeeks:    12,
  split:         'Pull-Legs / Push-Hinge / Upper / Legs-Engine',
  workouts:      WEEK_WORKOUTS[1],
  getWeekConfig: getBodyweightWeekConfig,
}
