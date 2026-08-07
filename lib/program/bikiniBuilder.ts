import type { Program, WeekConfig, DayType, Workout } from '@/types'
import { rtfPercent, type Prescription } from './phatCustom'

// ═══════════════════════════════════════════════════════════════════════
// Bikini Builder (Beginner) — 4-Day
//
// Transcribed from the Biolayne Workout Builder export. Unlike the other
// imported programs, the exercise selection ROTATES EVERY WEEK — no two
// weeks share the same list — so workouts are indexed per week rather
// than per block. Weeks 4, 8 and 12 are deloads (roughly half the work).
//
// Source quirks preserved: rep RANGES (6-8, 12-15), "AMR" markers where
// the final set is taken for as many reps as possible, and MAIN LIFT
// top sets prescribed without an RIR (treated as taken to failure, which
// matches the AMRAP markers those sets often carry).
//
// The source gives no loads and no rest intervals. Weight targets use
// the reps-to-failure model on the MIDPOINT of each rep range, and rest
// follows a hypertrophy profile — both the app's interpretation.
// ═══════════════════════════════════════════════════════════════════════

export const BIKINI_BUILDER_ID = 'bikini-builder-4day'

/** [dayKey][exercise][week] → [sets, midReps, rir, repsLabel, amrap]. */
const SCHEDULE: Record<string, Record<string, Record<number, [number, number, number, string, boolean]>>> = {
  A: {
    'Machine Squat': { 1:[1,9,0,'9',false], 2:[2,9,0,'9',false], 3:[2,9,0,'9',false], 4:[2,7,0,'7',false], 5:[2,8,0,'8',false], 6:[2,8,0,'8',false], 7:[3,8,0,'8',false], 8:[3,7,2,'6-8',false], 9:[2,7,0,'7',false], 10:[3,7,0,'7',false], 11:[4,7,0,'7',false], 12:[3,4,0,'4',false] },
    'Barbell Hip Thrust': { 1:[3,7,1,'6-8',true], 2:[3,7,1,'6-8',true], 3:[3,7,1,'6-8',true], 4:[3,7,1,'6-8',true], 5:[1,8,0,'8',false], 6:[2,8,0,'8',false], 7:[6,4,0,'4',true], 8:[3,7,1,'6-8',true], 9:[1,7,0,'7',false], 10:[2,7,0,'7',false], 11:[3,7,1,'6-8',true], 12:[3,7,1,'6-8',true] },
    'Hack Squat': { 1:[3,7,2,'6-8',false], 2:[3,7,2,'6-8',false], 3:[3,7,2,'6-8',false], 4:[3,7,2,'6-8',false] },
    'Machine Leg Extension': { 1:[2,7,2,'6-8',false], 2:[2,7,2,'6-8',false], 3:[2,7,2,'6-8',false], 4:[3,7,2,'6-8',true], 8:[2,7,2,'6-8',false], 12:[3,7,2,'6-8',false] },
    'Prone Leg Curl': { 1:[2,7,2,'6-8',false], 2:[2,7,2,'6-8',false], 3:[2,7,2,'6-8',false], 4:[2,7,2,'6-8',false], 8:[2,7,2,'6-8',false], 11:[2,7,2,'6-8',false] },
    'Standing Calf Raise': { 1:[4,7,1,'6-8',false], 3:[4,7,1,'6-8',false], 8:[4,7,1,'6-8',false] },
    'Seated Calf Raise': { 2:[4,7,1,'6-8',false], 4:[4,7,1,'6-8',false], 12:[4,7,1,'6-8',false] },
    'Leg Press': { 11:[3,7,2,'6-8',false], 12:[3,7,2,'6-8',false] },
    'Split Squat': { 11:[2,7,2,'6-8',false] },
    'Donkey Calf Raise': { 11:[4,7,1,'6-8',false] },
    'Seated Leg Curl': { 12:[2,7,2,'6-8',false] },
  },
  B: {
    'Seated Dumbbell Press': { 1:[1,9,0,'9',false], 2:[2,9,0,'9',false], 3:[2,7,2,'6-8',true], 4:[2,7,0,'7',false], 5:[2,8,0,'8',false], 6:[2,8,0,'8',false], 7:[3,8,0,'8',false], 8:[3,6,0,'6',false], 9:[2,7,0,'7',false], 10:[2,7,2,'6-8',true], 11:[2,7,2,'6-8',true], 12:[2,7,2,'6-8',true] },
    'Machine Shoulder Press': { 1:[2,7,2,'6-8',true], 2:[2,7,2,'6-8',true], 4:[2,7,2,'6-8',true], 7:[2,7,2,'6-8',true], 9:[2,7,2,'6-8',true] },
    'Pull-Up': { 1:[3,7,1,'6-8',false], 2:[3,7,1,'6-8',false], 5:[3,7,1,'6-8',false], 10:[3,7,1,'6-8',false], 12:[3,7,1,'6-8',false] },
    'Cable Row': { 1:[3,7,1,'6-8',true], 2:[3,7,1,'6-8',true], 4:[3,7,1,'6-8',true] },
    'Flat Machine Press': { 1:[3,10,5,'8-12',false], 2:[3,10,5,'8-12',false], 4:[3,10,5,'8-12',false], 11:[3,10,5,'8-12',false], 12:[3,10,5,'8-12',false] },
    'Dumbbell Curl': { 1:[4,7,1,'6-8',true], 2:[4,7,1,'6-8',true], 4:[4,7,1,'6-8',true], 10:[4,7,1,'6-8',true] },
    'Rope Press-Down': { 1:[4,7,1,'6-8',true], 4:[4,7,1,'6-8',true], 5:[4,7,1,'6-8',true], 8:[4,7,1,'6-8',true] },
    'Machine Tricep Press-Down': { 2:[4,7,1,'6-8',true], 3:[4,7,1,'6-8',true], 6:[4,7,1,'6-8',true] },
    'Machine Pull-Down': { 3:[3,7,1,'6-8',true], 9:[3,7,1,'6-8',false] },
    'Machine Row': { 3:[3,7,1,'6-8',true], 5:[3,7,1,'6-8',true], 6:[3,7,1,'6-8',true], 7:[3,7,1,'6-8',true], 8:[3,7,1,'6-8',true], 9:[3,7,1,'6-8',true], 12:[3,7,1,'6-8',true] },
    'Flat Dumbbell Press': { 3:[3,10,5,'8-12',false], 7:[3,10,5,'8-12',false], 8:[3,10,5,'8-12',false], 10:[3,10,5,'8-12',false] },
    'Machine Curl': { 3:[4,7,1,'6-8',true], 6:[4,7,1,'6-8',true], 11:[4,7,1,'6-8',true] },
    'Wide Grip Lat Pull-Down': { 4:[3,7,1,'6-8',true], 7:[3,7,1,'6-8',false], 11:[3,7,1,'6-8',false] },
    'Standing Military Press': { 5:[2,7,2,'6-8',true] },
    'Incline Machine Chest Press': { 5:[3,10,5,'8-12',false] },
    'Concentration Curl': { 5:[4,7,1,'6-8',true] },
    'Arnold Press': { 6:[2,7,2,'6-8',true], 8:[2,7,2,'6-8',true] },
    'Close Grip Lat Pull-Down': { 6:[3,7,1,'6-8',false] },
    'Incline Dumbbell Press': { 6:[3,10,5,'8-12',false], 9:[3,7,5,'6-8',false] },
    'Dumbbell Preacher Curl': { 7:[4,7,1,'6-8',true] },
    'EZ-Bar Skull Crusher': { 7:[4,7,1,'6-8',true], 12:[4,7,1,'6-8',true] },
    'Pullover Machine': { 8:[3,7,1,'6-8',false] },
    'Preacher Curl': { 8:[4,7,1,'6-8',true] },
    'Cambered Bar Curl': { 9:[4,7,1,'6-8',true], 12:[4,7,1,'6-8',true] },
    'Dumbbell Skull Crusher': { 9:[4,7,1,'6-8',true] },
    'T-Bar Row': { 10:[3,7,1,'6-8',true], 11:[3,7,1,'6-8',true] },
    'V-Bar Cable Press-Down': { 10:[4,7,1,'6-8',true] },
    'Single Arm Cable Press-Down': { 11:[4,7,1,'6-8',true] },
  },
  C: {
    'Machine Squat': { 1:[2,5,0,'5',false], 2:[2,5,0,'5',true], 3:[3,5,0,'5',true], 5:[2,4,0,'4',false], 6:[3,4,0,'4',true], 7:[4,4,0,'4',true], 9:[2,3,0,'3',false], 10:[3,3,0,'3',true], 11:[4,3,0,'3',true] },
    'Leg Press': { 1:[2,14,3,'12-15',false], 2:[2,14,3,'12-15',false], 3:[2,14,3,'12-15',false], 5:[3,7,2,'6-8',false], 7:[3,7,2,'6-8',false], 10:[3,7,2,'6-8',false] },
    'Barbell Hip Thrust': { 1:[2,14,2,'12-15',true], 2:[2,14,2,'12-15',true], 5:[3,7,1,'6-8',true], 6:[3,7,1,'6-8',true], 9:[3,7,1,'6-8',true], 10:[3,7,1,'6-8',true], 11:[2,7,0,'7',false] },
    'Machine Glute Kickback': { 1:[2,18,2,'15-20',false] },
    'Lunge': { 1:[3,14,2,'12-15',false], 3:[3,14,2,'12-15',false], 7:[2,7,2,'6-8',false], 10:[2,7,2,'6-8',false] },
    'Prone Leg Curl': { 1:[3,14,2,'12-15',false], 5:[2,7,2,'6-8',false], 7:[2,7,2,'6-8',false], 9:[2,7,2,'6-8',false] },
    'Donkey Calf Raise': { 1:[4,14,1,'12-15',true], 3:[4,14,1,'12-15',true], 5:[4,7,1,'6-8',false] },
    'Reverse Abductor Machine': { 2:[2,18,2,'15-20',false] },
    'Split Squat': { 2:[3,14,2,'12-15',false], 9:[2,7,2,'6-8',false] },
    'Single Leg Curl': { 2:[3,14,2,'12-15',false] },
    'Seated Calf Raise': { 2:[4,14,1,'12-15',true], 6:[4,7,1,'6-8',false] },
    'Banded Hip Thrust': { 3:[2,14,2,'12-15',true] },
    'Cable Glute Kickback': { 3:[2,18,2,'15-20',false] },
    'Seated Leg Curl': { 3:[3,14,2,'12-15',false], 6:[2,7,2,'6-8',false], 10:[2,7,2,'6-8',false] },
    'Smith Machine Lunge': { 5:[3,7,1,'6-8',false] },
    'Hack Squat': { 6:[3,7,2,'6-8',false], 9:[3,7,2,'6-8',false] },
    'Machine Leg Extension': { 6:[2,7,2,'6-8',false] },
    'Machine Hip Thrust': { 7:[3,7,1,'6-8',true] },
    'Leg Press Calf Raise': { 7:[4,7,1,'6-8',false] },
    'Standing Calf Raise': { 9:[4,7,1,'6-8',false], 10:[4,7,1,'6-8',false] },
  },
  D: {
    'Seated Dumbbell Press': { 1:[2,5,0,'5',false], 2:[2,5,0,'5',true], 3:[3,5,0,'5',false], 5:[2,4,0,'4',false], 6:[3,4,0,'4',true], 7:[3,14,2,'12-15',true], 9:[2,3,0,'3',false], 10:[3,3,0,'3',true], 11:[4,3,0,'3',true] },
    'Arnold Press': { 1:[3,14,2,'12-15',true], 3:[3,14,2,'12-15',true], 10:[3,14,2,'12-15',true] },
    'Wide Grip Lat Pull-Down': { 1:[2,14,2,'12-15',false] },
    'Cable Row': { 1:[2,14,2,'12-15',true], 3:[2,14,2,'12-15',true], 5:[2,14,0,'12-15',true], 7:[2,14,2,'12-15',true], 9:[2,14,2,'12-15',true], 11:[2,14,2,'12-15',true] },
    'Cable Lateral Raise': { 1:[3,14,2,'12-15',true], 9:[3,14,2,'12-15',true] },
    'Machine Curl': { 1:[4,14,1,'12-15',true], 5:[4,14,1,'12-15',true], 7:[4,14,1,'12-15',true] },
    'Dumbbell Skull Crusher': { 1:[4,14,1,'12-15',true] },
    'Standing Military Press': { 2:[3,14,2,'12-15',true], 6:[3,14,2,'12-15',true], 11:[3,14,2,'12-15',true] },
    'Close Grip Lat Pull-Down': { 2:[2,14,2,'12-15',false], 9:[2,14,2,'12-15',false] },
    'T-Bar Row': { 2:[2,14,2,'12-15',true] },
    'Reverse Pec Deck Fly': { 2:[3,14,2,'12-15',true], 7:[3,14,2,'12-15',true] },
    'Dumbbell Curl': { 2:[4,14,1,'12-15',true], 6:[4,14,1,'12-15',true], 9:[4,14,1,'12-15',true], 11:[4,14,1,'12-15',true] },
    'V-Bar Cable Press-Down': { 2:[4,14,1,'12-15',true], 7:[4,14,1,'12-15',true] },
    'Pullover Machine': { 3:[2,14,2,'12-15',false], 11:[2,14,2,'12-15',false] },
    'Front Lateral Raise': { 3:[3,14,2,'12-15',true], 10:[3,14,1,'12-15',true] },
    'Cambered Bar Curl': { 3:[4,14,1,'12-15',true] },
    'EZ-Bar Skull Crusher': { 3:[4,14,1,'12-15',true] },
    'Machine Shoulder Press': { 5:[3,14,2,'12-15',true] },
    'Machine Pull-Down': { 5:[2,14,2,'12-15',false], 7:[2,14,2,'12-15',false], 10:[2,14,2,'12-15',false] },
    'Lateral Raise': { 5:[3,14,2,'12-15',true], 11:[3,14,1,'12-15',true] },
    'Machine Tricep Press-Down': { 5:[4,14,1,'12-15',true], 10:[4,14,1,'12-15',true] },
    'Pull-Up': { 6:[2,14,2,'12-15',false] },
    'Braced T-Bar Row': { 6:[2,14,2,'12-15',true] },
    'Upright Row': { 6:[3,14,2,'12-15',true], 9:[3,14,2,'12-15',true] },
    'Overhead Rope Cable Extensions': { 6:[4,14,1,'12-15',true] },
    'Rope Press-Down': { 9:[4,14,1,'12-15',true], 11:[4,14,1,'12-15',true] },
    'Machine Row': { 10:[2,14,2,'12-15',true] },
    'Machine Preacher Curl': { 10:[4,14,1,'12-15',true] },
  },
}

/** Exercise lists per week — this program rotates selection weekly. */
const WEEK_WORKOUTS: Record<number, Workout[]> = {
  1: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pull-Up', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Machine Press', muscle: 'Chest', type: 'isolation', cue: 'Back supported · constant tension · safe to push near failure' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'isolation', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Glute Kickback', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Lunge', muscle: 'Quads', type: 'isolation', cue: 'Long step · torso tall · drive through the front heel' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Arnold Press', muscle: 'Shoulders', type: 'isolation', cue: 'Neutral spine · press to full lockout' },
        { name: 'Wide Grip Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Wide grip · pull to the upper chest · full stretch at the top' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Dumbbell Skull Crusher', muscle: 'Triceps', type: 'isolation', cue: 'Neutral grip spares the elbows · lower beside the head' },
      ],
    },
  ],
  2: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Seated Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pull-Up', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Machine Press', muscle: 'Chest', type: 'isolation', cue: 'Back supported · constant tension · safe to push near failure' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'isolation', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Reverse Abductor Machine', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Split Squat', muscle: 'Glutes', type: 'isolation', cue: 'Static stance · torso slightly forward for glutes · deep front-leg stretch' },
        { name: 'Single Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'One leg at a time · slow eccentric · evens out imbalances' },
        { name: 'Seated Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Standing Military Press', muscle: 'Shoulders', type: 'isolation', cue: 'Strict standing press · brace the whole body · no leg drive' },
        { name: 'Close Grip Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'T-Bar Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Reverse Pec Deck Fly', muscle: 'Rear Delts', type: 'isolation', cue: 'Elbows high and soft · squeeze the rear delts · no traps' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'V-Bar Cable Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  3: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'isolation', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Banded Hip Thrust', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Cable Glute Kickback', muscle: 'Glutes', type: 'isolation', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Lunge', muscle: 'Quads', type: 'isolation', cue: 'Long step · torso tall · drive through the front heel' },
        { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'isolation', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'isolation', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Arnold Press', muscle: 'Shoulders', type: 'isolation', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pullover Machine', muscle: 'Back', type: 'isolation', cue: 'Long arc overhead · lats under a big stretch' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Front Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Raise to eye level · controlled down · front-delt emphasis' },
        { name: 'Cambered Bar Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'EZ-Bar Skull Crusher', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  4: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Seated Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Wide Grip Lat Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Wide grip · pull to the upper chest · full stretch at the top' },
        { name: 'Cable Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Machine Press', muscle: 'Chest', type: 'isolation', cue: 'Back supported · constant tension · safe to push near failure' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B — Testing', shortName: 'Lower B · Test', day: 'Day 4', focus: 'Quads · Glutes',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~20-30 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
      ],
    },
    {
      key: 'D', name: 'Upper B — Testing', shortName: 'Upper B · Test', day: 'Day 5', focus: 'Shoulders',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~15-20 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
      ],
    },
  ],
  5: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Standing Military Press', muscle: 'Shoulders', type: 'secondary', cue: 'Strict standing press · brace the whole body · no leg drive' },
        { name: 'Pull-Up', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Incline Machine Chest Press', muscle: 'Chest', type: 'isolation', cue: 'Upper-chest bias · fixed path · full stretch at the bottom' },
        { name: 'Concentration Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Smith Machine Lunge', muscle: 'Quads', type: 'secondary', cue: 'Fixed bar path · step out and drop straight down' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'isolation', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  6: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Arnold Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Close Grip Lat Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Seated Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Standing Military Press', muscle: 'Shoulders', type: 'isolation', cue: 'Strict standing press · brace the whole body · no leg drive' },
        { name: 'Pull-Up', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Braced T-Bar Row', muscle: 'Back', type: 'isolation', cue: 'Chest on the pad · no body english · drive the elbows back' },
        { name: 'Upright Row', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Overhead Rope Cable Extensions', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  7: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Wide Grip Lat Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Wide grip · pull to the upper chest · full stretch at the top' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Dumbbell Preacher Curl', muscle: 'Biceps', type: 'secondary', cue: 'One arm at a time on the pad · strict · squeeze at the top' },
        { name: 'EZ-Bar Skull Crusher', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Machine Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Lunge', muscle: 'Quads', type: 'secondary', cue: 'Long step · torso tall · drive through the front heel' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Leg Press Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'isolation', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Reverse Pec Deck Fly', muscle: 'Rear Delts', type: 'isolation', cue: 'Elbows high and soft · squeeze the rear delts · no traps' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'V-Bar Cable Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  8: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Arnold Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pullover Machine', muscle: 'Back', type: 'secondary', cue: 'Long arc overhead · lats under a big stretch' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Preacher Curl', muscle: 'Biceps', type: 'secondary', cue: 'Pad kills momentum · full extension at the bottom' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B — Testing', shortName: 'Lower B · Test', day: 'Day 4', focus: 'Quads · Glutes',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~20-30 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
      ],
    },
    {
      key: 'D', name: 'Upper B — Testing', shortName: 'Upper B · Test', day: 'Day 5', focus: 'Shoulders',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~15-20 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'REP TEST: one all-out set at 90% of your training max, taken to failure. Log every clean rep — this is real strength evidence and feeds your training max directly.' },
      ],
    },
  ],
  9: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Shoulder Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Incline Dumbbell Press', muscle: 'Chest', type: 'secondary', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Cambered Bar Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Dumbbell Skull Crusher', muscle: 'Triceps', type: 'secondary', cue: 'Neutral grip spares the elbows · lower beside the head' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Hack Squat', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Static stance · torso slightly forward for glutes · deep front-leg stretch' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Cable Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Close Grip Lat Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Upright Row', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  10: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pull-Up', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'T-Bar Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Dumbbell Press', muscle: 'Chest', type: 'isolation', cue: 'Full stretch at the bottom · controlled tempo' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'V-Bar Cable Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Leg Press', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Lunge', muscle: 'Quads', type: 'secondary', cue: 'Long step · torso tall · drive through the front heel' },
        { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Standing Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Arnold Press', muscle: 'Shoulders', type: 'isolation', cue: 'Neutral spine · press to full lockout' },
        { name: 'Machine Pull-Down', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Front Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Raise to eye level · controlled down · front-delt emphasis' },
        { name: 'Machine Preacher Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Machine Tricep Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  11: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Leg Press', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Split Squat', muscle: 'Glutes', type: 'secondary', cue: 'Static stance · torso slightly forward for glutes · deep front-leg stretch' },
        { name: 'Prone Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Donkey Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Wide Grip Lat Pull-Down', muscle: 'Back', type: 'secondary', cue: 'Wide grip · pull to the upper chest · full stretch at the top' },
        { name: 'T-Bar Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Machine Press', muscle: 'Chest', type: 'isolation', cue: 'Back supported · constant tension · safe to push near failure' },
        { name: 'Machine Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'Single Arm Cable Press-Down', muscle: 'Triceps', type: 'secondary', cue: 'One arm · strict lockout · full peak contraction' },
      ],
    },
    {
      key: 'C', name: 'Lower B', shortName: 'Lower B', day: 'Day 4', focus: 'Glutes · Quads · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
      ],
    },
    {
      key: 'D', name: 'Upper B', shortName: 'Upper B', day: 'Day 5', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Standing Military Press', muscle: 'Shoulders', type: 'isolation', cue: 'Strict standing press · brace the whole body · no leg drive' },
        { name: 'Pullover Machine', muscle: 'Back', type: 'isolation', cue: 'Long arc overhead · lats under a big stretch' },
        { name: 'Cable Row', muscle: 'Back', type: 'isolation', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Lateral Raise', muscle: 'Side Delts', type: 'isolation', cue: 'Lead with the elbow · no momentum' },
        { name: 'Dumbbell Curl', muscle: 'Biceps', type: 'isolation', cue: 'Elbows fixed at the sides · supinate at the top' },
        { name: 'Rope Press-Down', muscle: 'Triceps', type: 'isolation', cue: 'Elbows pinned · full lockout' },
      ],
    },
  ],
  12: [
    {
      key: 'A', name: 'Lower A', shortName: 'Lower A', day: 'Day 1', focus: 'Quads · Glutes · Hamstrings · Calves',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Leg Press', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'secondary', cue: 'Drive through the heels · squeeze hard at lockout' },
        { name: 'Machine Leg Extension', muscle: 'Quads', type: 'secondary', cue: 'Controlled depth · drive through the mid-foot' },
        { name: 'Seated Leg Curl', muscle: 'Hamstrings', type: 'secondary', cue: 'Slow eccentric · full stretch at the bottom' },
        { name: 'Seated Calf Raise', muscle: 'Calves', type: 'secondary', cue: 'Full stretch at the bottom · pause at the top' },
      ],
    },
    {
      key: 'B', name: 'Upper A', shortName: 'Upper A', day: 'Day 2', focus: 'Shoulders · Back · Chest · Arms',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~35-60 min', restTimes: '2-2.5 min main lifts · 90 sec accessories · 60 sec isolation',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'secondary', cue: 'Neutral spine · press to full lockout' },
        { name: 'Pull-Up', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Machine Row', muscle: 'Back', type: 'secondary', cue: 'Full stretch · drive the elbows back · squeeze' },
        { name: 'Flat Machine Press', muscle: 'Chest', type: 'isolation', cue: 'Back supported · constant tension · safe to push near failure' },
        { name: 'Cambered Bar Curl', muscle: 'Biceps', type: 'secondary', cue: 'Elbows fixed · full extension at the bottom' },
        { name: 'EZ-Bar Skull Crusher', muscle: 'Triceps', type: 'secondary', cue: 'Elbows pinned · full lockout' },
      ],
    },
    {
      key: 'C', name: 'Lower B — Testing', shortName: 'Lower B · Test', day: 'Day 4', focus: 'Quads · Glutes',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~20-30 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Machine Squat', muscle: 'Quads', type: 'primary', cue: 'TRUE 1RM TEST: start near your training max and work up in small jumps until you find one clean rep you cannot beat. Log that weight for 1 rep.' },
        { name: 'Barbell Hip Thrust', muscle: 'Glutes', type: 'primary', cue: 'TRUE 1RM TEST: start near your training max and work up in small jumps until you find one clean rep you cannot beat. Log that weight for 1 rep.' },
      ],
    },
    {
      key: 'D', name: 'Upper B — Testing', shortName: 'Upper B · Test', day: 'Day 5', focus: 'Shoulders',
      dayType: 'hypertrophy' as DayType, isRest: false,
      duration: '~15-20 min', restTimes: '3-4 min between test attempts',
      exercises: [
        { name: 'Seated Dumbbell Press', muscle: 'Shoulders', type: 'primary', cue: 'TRUE 1RM TEST: start near your training max and work up in small jumps until you find one clean rep you cannot beat. Log that weight for 1 rep.' },
      ],
    },
  ],
}

export function bikiniBuilderWorkouts(week: number): Workout[] {
  return WEEK_WORKOUTS[Math.max(1, Math.min(12, week))] ?? WEEK_WORKOUTS[1]
}

// Testing days (weeks 4, 8, 12 — Days 4 and 5): the source replaces the
// normal exercise list with a rep test (wk 4, 8) or a true 1RM test (wk 12).
// A rep test is a single all-out set at 90% of the training max — genuine
// strength evidence, so it feeds 1RM derivation exactly like any other
// logged set. A 1RM test uses the training max only as a starting-weight
// anchor for a live single-rep attempt.
const TEST_LIFTS: Record<string, string[]> = {
  C: ['Machine Squat', 'Barbell Hip Thrust'],
  D: ['Seated Dumbbell Press'],
}
const REP_TEST_NOTE  = 'Single all-out set at 90% of your training max — take it to failure and log every clean rep.'
const ONERM_TEST_NOTE = 'Work up from around your training max in small jumps until you find one clean rep you cannot beat, then log that weight for 1 rep.'

function testPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  if (![4, 8, 12].includes(week)) return null
  if (!TEST_LIFTS[dayKey]?.includes(exerciseName)) return null
  if (week === 12) {
    return { sets: 1, reps: 1, rir: 0, pct: 1.0, repsLabel: 'Work up to 1RM', testMode: 'onerm', testNote: ONERM_TEST_NOTE }
  }
  return { sets: 1, reps: 5, rir: 0, pct: 0.90, repsLabel: 'AMRAP', amrap: true, testMode: 'reps', testNote: REP_TEST_NOTE }
}

export function bikiniBuilderPrescription(dayKey: string, exerciseName: string, week: number): Prescription | null {
  const test = testPrescription(dayKey, exerciseName, week)
  if (test) return test
  const cell = SCHEDULE[dayKey]?.[exerciseName]?.[Math.max(1, Math.min(12, week))]
  if (!cell) return null
  const [sets, reps, rir, repsLabel, amrap] = cell
  return { sets, reps, rir, pct: rtfPercent(reps, rir), repsLabel, amrap }
}

export function getBikiniBuilderWeekConfig(week: number, _dayType?: DayType): WeekConfig {
  const isDeload = week % 4 === 0
  const block = week <= 4 ? 1 : week <= 8 ? 2 : 3
  return {
    sets:  { primary: 2, secondary: 3, isolation: 3 },
    reps:  { primary: '5-9', secondary: '6-8', isolation: '12-15' },
    rir: isDeload ? 3 : 2,
    phase: isDeload ? `Deload — Block ${block}` : `Block ${block} — Weeks ${(block - 1) * 4 + 1}-${block * 4 - 1}`,
    isDeload,
    note: isDeload
      ? (week === 12
          ? 'Deload week. Days 1 and 2 stay light — half the usual work. Days 4 and 5 are a true 1RM test on your main lifts: the final measure of twelve weeks of training.'
          : 'Deload week. Days 1 and 2 stay light — half the usual work. Days 4 and 5 are rep tests: one all-out set at 90% of your training max, logged for reps.')
      : 'Exercise selection changes every week by design — variety is the point. Where a set is marked AMRAP, take the final set for as many clean reps as you can.',
    percentages: { primary: rtfPercent(7, 1), secondary: rtfPercent(7, 2), isolation: rtfPercent(13, 2) },
  }
}

export const BIKINI_BUILDER_PROGRAM: Program = {
  id:            BIKINI_BUILDER_ID,
  name:          'Bikini Builder (Beginner) — 4-Day',
  shortName:     'Bikini Builder',
  author:        'Biolayne Workout Builder',
  description:   'Twelve weeks, four training days a week, alternating lower and upper sessions. Each day opens with heavy main-lift top sets and then moves into a hypertrophy block. Exercise selection rotates every single week, which keeps the work varied and teaches a wide range of movements — well suited to a newer lifter. Weeks 4, 8 and 12 are deloads at roughly half the usual volume.',
  focus:         'Hypertrophy · Glutes & Shoulders',
  daysPerWeek:   4,
  totalWeeks:    12,
  split:         'Lower / Upper · 4-Day',
  workouts:      WEEK_WORKOUTS[1],
  getWeekConfig: getBikiniBuilderWeekConfig,
}
