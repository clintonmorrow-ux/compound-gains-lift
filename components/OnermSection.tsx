'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, RotateCcw } from 'lucide-react'
import { getProgram } from '@/lib/program/programLibrary'
import { fetchAllOneRms, upsertOneRm, fetchAllLoggedSets } from '@/lib/db'
import { loggedDerivedOneRm } from '@/lib/program/smartSuggestions'
import type { UserOneRm } from '@/types'

const WC: Record<string,string> = {
  A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)',
  D:'var(--wkt-d)', E:'#F25C54',
}

export default function OnermSection({ programId }: { programId?: string }) {
  const [rms,   setRms]   = useState<Record<string,string>>({})
  const [group, setGroup] = useState<string>('')
  const [saved, setSaved] = useState<string|null>(null)
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string|null>(null)

  useEffect(() => {
    fetchAllOneRms().then(r => {
      const m: Record<string,string> = {}
      ;(r as UserOneRm[]).forEach(x => { m[x.exercise_name] = String(x.weight_lbs) })
      setRms(m)
    }).catch(console.error)
  }, [])

  const save = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n <= 0) return
    try { await upsertOneRm(name, n); setSaved(name); setTimeout(()=>setSaved(null), 1800) }
    catch(e) { console.error(e) }
  }

  // Recalculate saved 1RMs from actual logged sets (RIR-aware, recency-weighted —
  // the same number the suggestion engine derives). Only updates lifts with
  // enough logged history; manual entries for un-logged lifts are left alone.
  const syncFromLogs = async () => {
    setSyncing(true); setSyncMsg(null)
    try {
      const sets = await fetchAllLoggedSets() as any[]
      const byEx: Record<string, any[]> = {}
      sets.filter(s => s.weight_lbs > 0 && s.reps > 0).forEach(s => { (byEx[s.exercise_name] ??= []).push(s) })
      const next = { ...rms }
      let updated = 0
      for (const [name, arr] of Object.entries(byEx)) {
        if (arr.length < 3) continue   // need enough data to be reliable
        arr.sort((a, b) => (a.completed_at < b.completed_at ? 1 : -1))  // most recent first
        const est = loggedDerivedOneRm(arr.slice(0, 15))
        if (est > 0 && String(est) !== rms[name]) { await upsertOneRm(name, est); next[name] = String(est); updated++ }
      }
      setRms(next)
      setSyncMsg(updated > 0 ? `Updated ${updated} lift${updated===1?'':'s'} from your logged sets` : 'Already in sync with your logs')
    } catch (e) { console.error(e); setSyncMsg('Sync failed — try again') }
    finally { setSyncing(false); setTimeout(()=>setSyncMsg(null), 3500) }
  }

  const list = getProgram(programId).workouts
  const allNonBW = list.flatMap(w => w.exercises).filter(e => !e.isBodyweight)
  const totalEntered = allNonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length
  const allDone = totalEntered === allNonBW.length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <p className="ios-section-label">1RM Calibration</p>
        <span style={{
          fontSize:11, fontWeight:700, letterSpacing:'0.02em',
          color: allDone ? 'var(--green)' : 'var(--orange)',
          background: allDone ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'color-mix(in srgb, var(--orange) 12%, transparent)',
          border: `0.5px solid ${allDone ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'color-mix(in srgb, var(--orange) 30%, transparent)'}`,
          padding:'2px 9px', borderRadius:99,
        }}>
          {totalEntered}/{allNonBW.length} set
        </span>
      </div>
      <p className="t-footnote" style={{ color:'#8E8E93', marginBottom:12, lineHeight:1.6 }}>
        Your 1RMs are estimated from your logged sets. Tap a workout to fine-tune by hand, or sync them from your logs.
      </p>

      <button onClick={syncFromLogs} disabled={syncing}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:42, borderRadius:12, marginBottom:14,
          background:'color-mix(in srgb, var(--blue) 14%, transparent)', border:'0.5px solid color-mix(in srgb, var(--blue) 32%, transparent)',
          color:'var(--teal)', fontSize:14, fontWeight:700, opacity: syncing ? 0.6 : 1 }}>
        <RotateCcw size={15} strokeWidth={2.3} style={{ animation: syncing ? 'spin 0.9s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : 'Sync 1RMs from logged sets'}
      </button>
      {syncMsg && (
        <p style={{ fontSize:12.5, color:'var(--green)', marginTop:-8, marginBottom:14, textAlign:'center' }}>{syncMsg}</p>
      )}

      <div className="space-y-2">
        {list.map(wkt => {
          const c = WC[wkt.key] ?? '#8E8E93'
          const isOpen = group === wkt.key
          const nonBW = wkt.exercises.filter(e => !e.isBodyweight)
          const entered = nonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length
          const wktDone = entered === nonBW.length

          return (
            <div key={wkt.key} className="ios-group overflow-hidden">
              <button className="ios-row ios-row-first tap w-full"
                      onClick={() => setGroup(isOpen ? '' : wkt.key)}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 t-subhead sf-heavy"
                     style={{ background:`color-mix(in srgb, ${c} 20%, transparent)`, color: c }}>
                  {wkt.key}
                </div>
                <div className="flex-1 text-left min-w-0">
                  <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{wkt.shortName}</p>
                  <p className="t-caption1 mt-0.5" style={{ color: wktDone ? 'var(--green)' : 'var(--orange)' }}>
                    {entered} of {nonBW.length} entered{wktDone ? ' ✓' : ' — tap to fill in'}
                  </p>
                </div>
                {isOpen
                  ? <ChevronUp   size={16} style={{ color:'#8E8E93', flexShrink:0 }} />
                  : <ChevronDown size={16} style={{ color:'#8E8E93', flexShrink:0 }} />}
              </button>

              {isOpen && wkt.exercises.map(ex => {
                if (ex.isBodyweight) return (
                  <div key={ex.name} className="ios-row">
                    <div className="flex-1 min-w-0">
                      <p className="t-subhead" style={{ color:'var(--label-2)' }}>{ex.name}</p>
                      <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>Bodyweight exercise</p>
                    </div>
                    <span className="t-caption2 px-2 py-1 rounded-lg"
                          style={{ background:'var(--fill-3)', color:'#8E8E93' }}>BW</span>
                  </div>
                )

                const isSaved = saved === ex.name
                const hasVal  = !!(rms[ex.name] && parseFloat(rms[ex.name]) > 0)
                return (
                  <div key={ex.name} className="ios-row"
                       style={{ background: isSaved ? 'color-mix(in srgb, var(--green) 12%, var(--bg-2))' : 'var(--bg-2)' }}>
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                      <p className="t-caption1 mt-0.5" style={{ color: hasVal ? '#8E8E93' : 'var(--orange)' }}>
                        {hasVal ? ex.muscle : `Enter 1RM · ${ex.muscle}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isSaved && <Check size={14} strokeWidth={3} style={{ color:'var(--green)' }} />}
                      <input
                        type="number" inputMode="decimal" placeholder="0"
                        value={rms[ex.name] ?? ''}
                        onChange={e => setRms(p => ({ ...p, [ex.name]: e.target.value }))}
                        onBlur={e => save(ex.name, e.target.value)}
                        style={{
                          width:72, height:40, textAlign:'right', padding:'0 10px',
                          fontSize:15, fontWeight:700, outline:'none', borderRadius:10,
                          background: hasVal ? 'var(--fill-3)' : 'color-mix(in srgb, var(--orange) 15%, var(--fill-3))',
                          color:'var(--label)',
                          border: hasVal ? 'none' : '1px solid color-mix(in srgb, var(--orange) 50%, transparent)',
                        }}
                      />
                      <span className="t-caption1" style={{ color:'#8E8E93' }}>lbs</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
