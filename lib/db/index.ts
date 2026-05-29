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
  skipped = false
) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('logged_sets')
    .insert({ session_id: sessionId, exercise_name: exerciseName, set_number: setNumber, weight_lbs: weightLbs, reps, skipped })
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
    .select('weight_lbs, reps, completed_at')
    .eq('exercise_name', exerciseName)
    .not('weight_lbs', 'is', null)
    .not('reps', 'is', null)
    .order('completed_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as { weight_lbs: number; reps: number; completed_at: string }[]
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
