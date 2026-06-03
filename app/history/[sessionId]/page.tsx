'use client'
import { use, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, Check, Trash2, Plus } from 'lucide-react'
import { fetchSessionWithSets, updateLoggedSet, deleteLoggedSet, deleteSession } from '@/lib/db'
import { WORKOUTS } from '@/lib/program/data'
import type { WorkoutKey } from '@/types'

const WC: Record<string,string> = { A:'#0A84FF', B:'#30D158', C:'#BF5AF2', D:'#FF9F0A' }

function relDate(d: string) {
  const diff = Math.floor((Date.now() - new Date(d).getTime()) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7)  return `${diff} days ago`
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' })
}

// ── Editable set row ────────────────────────────────────────────────
function EditableSetRow({ set, isBodyweight, accentColor, onSaved, onDeleted }: {
  set: any; isBodyweight: boolean; accentColor: string
  onSaved: (id: string, weight: number|null, reps: number) => void
  onDeleted: (id: string) => void
}) {
  const [wt,      setWt]      = useState(set.weight_lbs?.toString() ?? '')
  const [reps,    setReps]    = useState(set.reps?.toString() ?? '')
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)
  const [confirm, setConfirm] = useState(false)

  const dirty = wt !== (set.weight_lbs?.toString() ?? '') ||
                reps !== (set.reps?.toString() ?? '')

  const save = async () => {
    if (!dirty || saving) return
    setSaving(true)
    const newWt   = isBodyweight ? null : (parseFloat(wt) || null)
    const newReps = parseInt(reps) || set.reps
    await updateLoggedSet(set.id, { weight_lbs: newWt, reps: newReps })
    onSaved(set.id, newWt, newReps)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDelete = async () => {
    if (!confirm) { setConfirm(true); setTimeout(() => setConfirm(false), 3000); return }
    await deleteLoggedSet(set.id)
    onDeleted(set.id)
  }

  return (
    <div style={{
      borderRadius:12, transition:'background 0.2s',
      background: saved ? 'rgba(48,209,88,0.1)' : 'rgba(118,118,128,0.08)',
      border:`0.5px solid ${saved ? 'rgba(48,209,88,0.35)' : 'rgba(84,84,88,0.3)'}`,
      overflow:'hidden',
    }}>
      {/* Main row: badge | weight | × | reps | save | delete */}
      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 12px' }}>
        {/* Set badge */}
        <div style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center',
          background: saved ? '#30D158' : 'rgba(84,84,88,0.3)',
          fontSize:10, fontWeight:800, color: saved ? '#000' : '#8E8E93' }}>
          {saved ? '✓' : set.set_number}
        </div>

        {/* Weight */}
        {isBodyweight
          ? <span style={{ flex:1, fontSize:13, color:'#8E8E93', textAlign:'center' }}>Bodyweight</span>
          : <input type="number" inputMode="decimal"
              value={wt} onChange={e => setWt(e.target.value)}
              onFocus={e => e.target.select()} onBlur={save}
              style={{ flex:1, minWidth:0, height:34, textAlign:'center', borderRadius:9,
                outline:'none', fontSize:14, fontWeight:700,
                background: dirty ? `color-mix(in srgb, ${accentColor} 12%, rgba(118,118,128,0.18))` : 'rgba(118,118,128,0.18)',
                color:'#fff', border: dirty ? `1px solid ${accentColor}55` : 'none' }} />}

        <span style={{ fontSize:11, color:'rgba(84,84,88,0.7)', flexShrink:0 }}>×</span>

        {/* Reps */}
        <input type="number" inputMode="numeric"
          value={reps} onChange={e => setReps(e.target.value)}
          onFocus={e => e.target.select()} onBlur={save}
          style={{ width:46, height:34, textAlign:'center', borderRadius:9,
            outline:'none', fontSize:14, fontWeight:700, flexShrink:0,
            background: dirty ? `color-mix(in srgb, ${accentColor} 12%, rgba(118,118,128,0.18))` : 'rgba(118,118,128,0.18)',
            color:'#fff', border: dirty ? `1px solid ${accentColor}55` : 'none' }} />

        <span style={{ fontSize:10, color:'rgba(84,84,88,0.5)', flexShrink:0 }}>reps</span>

        {/* Save / spinner */}
        {saving
          ? <div style={{ width:24, height:24, borderRadius:'50%', border:'2px solid transparent',
              borderTopColor: accentColor, animation:'spin 0.7s linear infinite', flexShrink:0 }} />
          : dirty
            ? <button onClick={save} style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
                display:'flex', alignItems:'center', justifyContent:'center',
                background: accentColor, border:'none', cursor:'pointer' }}>
                <Check size={12} strokeWidth={3} style={{ color:'#fff' }} />
              </button>
            : <div style={{ width:24, flexShrink:0 }} />}

        {/* Delete */}
        <button onClick={handleDelete} style={{ width:24, height:24, borderRadius:'50%', flexShrink:0,
          display:'flex', alignItems:'center', justifyContent:'center', border:'none', cursor:'pointer',
          background: confirm ? 'rgba(255,69,58,0.25)' : 'transparent' }}>
          <Trash2 size={13} style={{ color: confirm ? '#FF453A' : 'rgba(84,84,88,0.55)' }} />
        </button>
      </div>

      {/* RIR sub-row — only shown when RIR was logged */}
      {set.rir != null && (
        <div style={{ display:'flex', alignItems:'center', gap:6,
          padding:'4px 12px 8px', paddingLeft:43 }}>
          <span style={{ fontSize:10, fontWeight:600, color:'#636366' }}>RIR</span>
          {[0,1,2,3,4].map(r => (
            <div key={r} style={{
              width:22, height:22, borderRadius:6, flexShrink:0,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:11, fontWeight:800,
              background: r === set.rir
                ? r === 0 ? 'rgba(255,69,58,0.25)'
                : r <= 2   ? `color-mix(in srgb, ${accentColor} 20%, transparent)`
                :            'rgba(48,209,88,0.2)'
                : 'rgba(44,44,46,0.6)',
              color: r === set.rir
                ? r === 0 ? '#FF453A'
                : r <= 2   ? accentColor
                :            '#30D158'
                : '#3A3A3C',
              border: r === set.rir
                ? `0.5px solid ${r === 0 ? 'rgba(255,69,58,0.4)' : r <= 2 ? accentColor+'55' : 'rgba(48,209,88,0.4)'}`
                : '0.5px solid rgba(44,44,46,0.4)',
            }}>{r === 4 ? '4+' : r}</div>
          ))}
          <span style={{ fontSize:10, color:'#636366', marginLeft:2 }}>
            {set.rir === 0 ? 'Failure' : set.rir === 1 ? '1 left' : set.rir === 2 ? '2 left' : set.rir === 3 ? '3 left' : '4+ left'}
          </span>
        </div>
      )}
    </div>
  )
}

// ── Page ────────────────────────────────────────────────────────────
export default function SessionEditPage({ params }: { params: Promise<{sessionId:string}> }) {
  const { sessionId } = use(params)
  const router = useRouter()

  const [session,  setSession]  = useState<any>(null)
  const [sets,     setSets]     = useState<any[]>([])
  const [loading,       setLoading]  = useState(true)
  const [confirmDelete,   setConfirmDelete] = useState(false)
  const [deleting,        setDeleting]     = useState(false)

  const init = useCallback(async () => {
    try {
      const s = await fetchSessionWithSets(sessionId)
      setSession(s)
      setSets(s.logged_sets ?? [])
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [sessionId])

  useEffect(() => { init() }, [init])

  const handleSaved = (id: string, weight: number|null, reps: number) => {
    setSets(prev => prev.map(s => s.id===id ? {...s, weight_lbs:weight, reps} : s))
  }

  const handleDeleted = (id: string) => {
    setSets(prev => prev.filter(s => s.id !== id))
  }

  const handleDeleteSession = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    try {
      await deleteSession(sessionId)
      router.replace('/history')
    } catch(e) { setDeleting(false); setConfirmDelete(false) }
  }

  // Group sets by exercise name (preserving workout order)
  const grouped: Record<string, any[]> = {}
  sets.forEach(s => {
    if (!grouped[s.exercise_name]) grouped[s.exercise_name] = []
    grouped[s.exercise_name].push(s)
  })

  // Sort each group by set_number
  Object.values(grouped).forEach(g => g.sort((a,b) => a.set_number - b.set_number))

  // Find workout exercises for bodyweight flag
  const wkt = session ? WORKOUTS.find(w => w.key === session.workout_key) : null
  const isBodyweight = (name: string) =>
    wkt?.exercises.find(e => e.name === name)?.isBodyweight ?? false

  const accent = session ? (WC[session.workout_key as WorkoutKey] ?? '#FF9F0A') : '#FF9F0A'

  if (loading) return (
    <div style={{ minHeight:'100svh', background:'#000', display:'flex',
      alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid transparent',
        borderTopColor:'#FF9F0A', animation:'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ minHeight:'100svh', background:'#000', paddingBottom:40 }}>

      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:20, paddingTop:'env(safe-area-inset-top)',
        background:'rgba(0,0,0,0.95)', backdropFilter:'saturate(180%) blur(24px)',
        WebkitBackdropFilter:'saturate(180%) blur(24px)',
        borderBottom:'0.5px solid rgba(84,84,88,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px 12px' }}>
          <button onClick={() => router.back()} style={{ width:38, height:38, borderRadius:'50%',
            background:'rgba(118,118,128,0.2)', display:'flex', alignItems:'center',
            justifyContent:'center', flexShrink:0, border:'none', cursor:'pointer' }}>
            <ChevronLeft size={18} strokeWidth={2.5} style={{ color: accent }} />
          </button>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:17, fontWeight:700, color:'#fff', letterSpacing:'-0.5px' }}>
              {wkt?.shortName ?? session?.workout_key}
            </p>
            <p style={{ fontSize:12, color:'#8E8E93', marginTop:1 }}>
              Week {session?.week_number} · {relDate(session?.started_at ?? '')}
              {' · '}{sets.length} sets
            </p>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            <div style={{ padding:'5px 12px', borderRadius:8,
              background:`color-mix(in srgb, ${accent} 15%, transparent)`,
              border:`0.5px solid ${accent}44` }}>
              <span style={{ fontSize:12, fontWeight:700, color: accent }}>Editing</span>
            </div>
            <button onClick={handleDeleteSession} disabled={deleting}
              style={{ padding:'5px 12px', borderRadius:8, border:'none', cursor:'pointer',
                background: confirmDelete ? 'rgba(255,69,58,0.25)' : 'rgba(255,69,58,0.1)',
                transition:'background 0.2s' }}>
              {deleting
                ? <div style={{ width:14,height:14,borderRadius:'50%',border:'2px solid transparent',
                    borderTopColor:'#FF453A',animation:'spin 0.7s linear infinite' }} />
                : <span style={{ fontSize:12, fontWeight:700, color:'#FF453A' }}>
                    {confirmDelete ? 'Confirm' : 'Delete'}
                  </span>}
            </button>
          </div>
        </div>
      </div>

      {/* Helper note */}
      <div style={{ margin:'16px 16px 0', padding:'10px 14px', borderRadius:12,
        background:'rgba(118,118,128,0.1)', border:'0.5px solid rgba(84,84,88,0.3)' }}>
        <p style={{ fontSize:13, color:'#8E8E93', lineHeight:1.5 }}>
          Tap any field to edit. Changes save automatically when you move to the next field.
          Fields highlighted in <span style={{ color: accent }}>color</span> have unsaved changes.
        </p>
      </div>

      {/* Exercise groups */}
      <div style={{ padding:'16px', display:'flex', flexDirection:'column', gap:20 }}>
        {Object.entries(grouped).map(([exName, exSets]) => (
          <div key={exName}>
            {/* Exercise header */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:4, height:20, borderRadius:99, background: accent, flexShrink:0 }} />
              <p style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.3px', flex:1 }}>
                {exName}
              </p>
              <p style={{ fontSize:12, color:'#8E8E93' }}>{exSets.length} sets</p>
            </div>

            {/* Set rows */}
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {exSets.map(s => (
                <EditableSetRow
                  key={s.id}
                  set={s}
                  isBodyweight={isBodyweight(exName)}
                  accentColor={accent}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                />
              ))}
            </div>
          </div>
        ))}

        {sets.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 0' }}>
            <p style={{ fontSize:16, color:'#8E8E93' }}>No sets logged for this session</p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
