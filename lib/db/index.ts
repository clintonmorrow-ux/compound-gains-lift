import { createClient } from '@/lib/supabase/client'
import type { UserOneRm, UserSettings } from '@/types'

// ── 1RM ──────────────────────────────────────────────────────────────────

export async function fetchAllOneRms(): Promise<UserOneRm[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_1rm')
    .select('exercise_name, weight_lbs')
    .order('exercise_name')
  if (error) throw error
  return data ?? []
}

export async function upsertOneRm(exerciseName: string, weightLbs: number): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('user_1rm')
    .upsert({ user_id: user.id, exercise_name: exerciseName, weight_lbs: weightLbs }, {
      onConflict: 'user_id,exercise_name',
    })
  if (error) throw error
}

export async function deleteOneRm(exerciseName: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('user_1rm')
    .delete()
    .eq('exercise_name', exerciseName)
  if (error) throw error
}

// ── Settings ─────────────────────────────────────────────────────────────

export async function fetchSettings(): Promise<UserSettings> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('current_week, round_to_lbs')
    .single()
  if (error || !data) return { current_week: 1, round_to_lbs: 5 }
  return data
}

export async function updateSettings(settings: Partial<UserSettings>): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { error } = await supabase
    .from('user_settings')
    .upsert({ id: user.id, ...settings }, { onConflict: 'id' })
  if (error) throw error
}

// ── Sessions ─────────────────────────────────────────────────────────────

export async function createSession(weekNumber: number, workoutKey: string) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  const { data, error } = await supabase
    .from('sessions')
    .insert({ user_id: user.id, week_number: weekNumber, workout_key: workoutKey })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function completeSession(sessionId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('sessions')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) throw error
}

export async function logSet(
  sessionId: string,
  exerciseName: string,
  setNumber: number,
  weightLbs: number | null,
  reps: number | null,
  skipped = false,
  rir: number | null = null,
  tempo: string | null = null
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logged_sets')
    .insert({ session_id: sessionId, exercise_name: exerciseName, set_number: setNumber, weight_lbs: weightLbs, reps, skipped, rir, tempo })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function fetchRecentSessions(limit = 20) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, logged_sets(*)')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data ?? []
}

export async function getLastWeightForExercise(exerciseName: string): Promise<number | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logged_sets')
    .select('weight_lbs')
    .eq('exercise_name', exerciseName)
    .not('weight_lbs', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()
  if (error || !data) return null
  return data.weight_lbs
}

export async function getRecentSetsForExercise(exerciseName: string, limit = 15) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logged_sets')
    .select('weight_lbs, reps, completed_at, rir')
    .eq('exercise_name', exerciseName)
    .not('weight_lbs', 'is', null)
    .not('reps', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as { weight_lbs: number; reps: number; completed_at: string; rir: number | null }[]
}

export async function fetchEquipment(): Promise<string[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('equipment_types')
    .single()
  if (error || !data?.equipment_types) return ['barbell','dumbbells','cables','machines']
  return data.equipment_types
}

export async function saveEquipment(types: string[]): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_settings').upsert({ id: user.id, equipment_types: types }, { onConflict:'id' })
}

// ── Analytics: fetch ALL logged sets joined with session dates ──────
export async function fetchAllLoggedSets(): Promise<{
  exercise_name: string; weight_lbs: number|null; reps: number|null;
  completed_at: string; rir: number|null; set_number: number;
  session_id: string; week_number: number|null
}[]> {
  const supabase = createClient()
  // Fetch sets + sessions in parallel; merge week_number onto each set
  // so the volume chart groups by program week (not calendar week)
  const [{ data: setsData, error }, { data: sessData }] = await Promise.all([
    supabase.from('logged_sets')
      .select('exercise_name, weight_lbs, reps, completed_at, rir, set_number, session_id')
      .not('reps', 'is', null)
      .order('completed_at', { ascending: true }),
    supabase.from('sessions').select('id, week_number'),
  ])
  if (error) { console.error(error); return [] }
  const weekMap: Record<string, number> = {}
  ;(sessData ?? []).forEach((s: any) => { weekMap[s.id] = s.week_number })
  return (setsData ?? []).map((s: any) => ({ ...s, week_number: weekMap[s.session_id] ?? null })) as any[]
}

// ── Session detail + editing ────────────────────────────────────────
export async function fetchSessionWithSets(sessionId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, logged_sets(*)')
    .eq('id', sessionId)
    .single()
  if (error) throw error
  // Sort sets by exercise name then set_number
  if (data?.logged_sets) {
    data.logged_sets.sort((a: any, b: any) =>
      a.exercise_name.localeCompare(b.exercise_name) || a.set_number - b.set_number
    )
  }
  return data
}

export async function updateLoggedSet(
  setId: string,
  updates: { weight_lbs?: number | null; reps?: number | null }
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logged_sets')
    .update(updates)
    .eq('id', setId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLoggedSet(setId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('logged_sets')
    .delete()
    .eq('id', setId)
  if (error) throw error
}

// ── Exercise preferences (whole-program customization) ───────────────
export async function fetchExercisePreferences(): Promise<Record<string,{name:string;cue:string}>> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return {}
  const { data, error } = await supabase
    .from('user_exercise_preferences')
    .select('original_name, preferred_name, preferred_cue')
    .eq('user_id', user.id)
  if (error) { console.error('fetchExercisePreferences error:', error); return {} }
  const map: Record<string,{name:string;cue:string}> = {}
  ;(data ?? []).forEach((r: any) => { map[r.original_name] = { name: r.preferred_name, cue: r.preferred_cue } })
  return map
}

export async function saveExercisePreference(
  originalName: string,
  preferred: { name: string; cue: string } | null  // null = reset to default
): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  if (!preferred) {
    // Delete the preference row
    const { error } = await supabase
      .from('user_exercise_preferences')
      .delete()
      .eq('user_id', user.id)
      .eq('original_name', originalName)
    if (error) throw error
    return
  }

  // Upsert by (user_id, original_name)
  const { error } = await supabase
    .from('user_exercise_preferences')
    .upsert({
      user_id:        user.id,
      original_name:  originalName,
      preferred_name: preferred.name,
      preferred_cue:  preferred.cue,
      updated_at:     new Date().toISOString(),
    }, { onConflict: 'user_id,original_name' })
  if (error) throw error
}

// ── Coaching preferences ─────────────────────────────────────────────
export async function fetchCoachPrefs(): Promise<{rirTrend:boolean;deloadAlerts:boolean;setFatigue:boolean}> {
  const def = { rirTrend:true, deloadAlerts:true, setFatigue:true }
  const supabase = createClient()
  const { data, error } = await supabase
    .from('user_settings')
    .select('coaching_prefs')
    .single()
  if (error || !data?.coaching_prefs) return def
  return { ...def, ...(data.coaching_prefs as any) }
}

export async function saveCoachPrefs(prefs: {rirTrend:boolean;deloadAlerts:boolean;setFatigue:boolean}): Promise<void> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_settings')
    .upsert({ id: user.id, coaching_prefs: prefs }, { onConflict: 'id' })
}

// ── Session management ────────────────────────────────────────────────
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = createClient()
  // logged_sets cascade deletes automatically via FK constraint
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', sessionId)
  if (error) throw error
}
