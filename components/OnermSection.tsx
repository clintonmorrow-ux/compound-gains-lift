'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, Check, RotateCcw, TrendingUp } from 'lucide-react'
import { getProgram } from '@/lib/program/programLibrary'
import { fetchAllOneRms, upsertOneRm, fetchAllLoggedSets } from '@/lib/db'
import { loggedDerivedOneRm } from '@/lib/program/smartSuggestions'
import type { UserOneRm } from '@/types'

const WC: Record<string,string> = {
  A:'var(--wkt-a)', B:'var(--wkt-b)', C:'var(--wkt-c)',
  D:'var(--wkt-d)', E:'#F25C54',
}

export default function OnermSection({ programId }: { programId?: string }) {
  const [rms,      setRms]      = useState<Record<string,string>>({})
  const [derived,  setDerived]  = useState<Record<string,number>>({})   // logged-derived estimates
  const [group,    setGroup]    = useState<string>('')
  const [saved,    setSaved]    = useState<string|null>(null)
  const [syncing,  setSyncing]  = useState(false)
  const [syncMsg,  setSyncMsg]  = useState<string|null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([fetchAllOneRms(), fetchAllLoggedSets()]).then(([ormArr, sets]) => {
      // Stored training maxes
      const m: Record<string,string> = {}
      ;(ormArr as UserOneRm[]).forEach(x => { m[x.exercise_name] = String(x.weight_lbs) })
      setRms(m)

      // Logged-derived estimates — compute once on load
      const byEx: Record<string, any[]> = {}
      ;(sets as any[]).filter(s => s.weight_lbs > 0 && s.reps > 0)
        .forEach(s => { (byEx[s.exercise_name] ??= []).push(s) })
      const d: Record<string,number> = {}
      for (const [name, arr] of Object.entries(byEx)) {
        if (arr.length < 3) continue
        arr.sort((a:any, b:any) => (a.completed_at < b.completed_at ? 1 : -1))
        const est = loggedDerivedOneRm(arr.slice(0, 15))
        if (est > 0) d[name] = est
      }
      setDerived(d)
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const save = async (name: string, val: string) => {
    const n = parseFloat(val)
    if (!val || isNaN(n) || n <= 0) return
    try { await upsertOneRm(name, n); setSaved(name); setTimeout(()=>setSaved(null), 1800) }
    catch(e) { console.error(e) }
  }

  const syncFromLogs = async () => {
    setSyncing(true); setSyncMsg(null)
    try {
      const next = { ...rms }
      let updated = 0
      for (const [name, est] of Object.entries(derived)) {
        if (est > 0 && String(est) !== rms[name]) {
          await upsertOneRm(name, est); next[name] = String(est); updated++
        }
      }
      setRms(next)
      setSyncMsg(updated > 0
        ? `Updated ${updated} lift${updated===1?'':'s'} from your logged sets`
        : 'Already in sync with your logs')
    } catch (e) { console.error(e); setSyncMsg('Sync failed — try again') }
    finally { setSyncing(false); setTimeout(()=>setSyncMsg(null), 3500) }
  }

  const list    = getProgram(programId).workouts
  const allNonBW = list.flatMap(w => w.exercises).filter(e => !e.isBodyweight)
  const totalEntered = allNonBW.filter(e => rms[e.name] && parseFloat(rms[e.name]) > 0).length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
        <p className="ios-section-label">1RM Calibration</p>
        <span style={{
          fontSize:11, fontWeight:700, letterSpacing:'0.02em',
          color: totalEntered===allNonBW.length ? 'var(--green)' : 'var(--orange)',
          background: totalEntered===allNonBW.length ? 'color-mix(in srgb, var(--green) 12%, transparent)' : 'color-mix(in srgb, var(--orange) 12%, transparent)',
          border: `0.5px solid ${totalEntered===allNonBW.length ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'color-mix(in srgb, var(--orange) 30%, transparent)'}`,
          padding:'2px 9px', borderRadius:99,
        }}>
          {totalEntered}/{allNonBW.length} set
        </span>
      </div>

      <p className="t-footnote" style={{ color:'#8E8E93', marginBottom:12, lineHeight:1.6 }}>
        <b style={{ color:'var(--label-2)' }}>Locked TM</b> is what drives this cycle&rsquo;s prescriptions.{' '}
        <b style={{ color:'var(--teal)' }}>From logs</b> is what your actual sets currently estimate — this updates your TM at the end of each cycle.
      </p>

      <button onClick={syncFromLogs} disabled={syncing || loading}
        style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', height:42, borderRadius:12, marginBottom:14,
          background:'color-mix(in srgb, var(--blue) 14%, transparent)',
          border:'0.5px solid color-mix(in srgb, var(--blue) 32%, transparent)',
          color:'var(--teal)', fontSize:14, fontWeight:700, opacity: (syncing||loading) ? 0.6 : 1 }}>
        <RotateCcw size={15} strokeWidth={2.3} style={{ animation: syncing ? 'spin 0.9s linear infinite' : 'none' }} />
        {syncing ? 'Syncing…' : 'Sync TM from logged sets now'}
      </button>
      {syncMsg && (
        <p style={{ fontSize:12.5, color:'var(--green)', marginTop:-8, marginBottom:14, textAlign:'center' }}>{syncMsg}</p>
      )}

      <div className="space-y-2">
        {list.map(wkt => {
          if (wkt.isRest) return null
          const c = WC[wkt.key] ?? '#8E8E93'
          const isOpen  = group === wkt.key
          const nonBW   = wkt.exercises.filter(e => !e.isBodyweight)
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
                      <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>Bodyweight</p>
                    </div>
                    <span className="t-caption2 px-2 py-1 rounded-lg"
                          style={{ background:'var(--fill-3)', color:'#8E8E93' }}>BW</span>
                  </div>
                )

                const isSaved    = saved === ex.name
                const tmVal      = parseFloat(rms[ex.name] ?? '0') || 0
                const loggedEst  = derived[ex.name] ?? 0
                const diff       = tmVal > 0 && loggedEst > 0 ? loggedEst - tmVal : 0
                const diffPct    = tmVal > 0 ? diff / tmVal : 0
                const hasGain    = diff > 0.5
                const hasDrop    = diff < -0.5
                const isBig      = Math.abs(diffPct) >= 0.10  // 10% threshold

                return (
                  <div key={ex.name} className="ios-row" style={{
                    flexDirection:'column', alignItems:'stretch', gap:0,
                    background: isSaved ? 'color-mix(in srgb, var(--green) 8%, var(--bg-2))' : 'var(--bg-2)',
                  }}>
                    {/* top row: name + muscle */}
                    <div style={{ display:'flex', alignItems:'center', gap:8, paddingBottom:10 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>{ex.name}</p>
                        <p className="t-caption1 mt-0.5" style={{ color:'#8E8E93' }}>{ex.muscle}</p>
                      </div>
                      {isSaved && <Check size={14} strokeWidth={3} style={{ color:'var(--green)', flexShrink:0 }} />}
                    </div>

                    {/* two-column data row */}
                    <div style={{ display:'flex', gap:8 }}>
                      {/* Locked TM */}
                      <div style={{ flex:1, borderRadius:10, padding:'9px 12px',
                        background:'var(--fill-3)', border:'0.5px solid rgba(84,84,88,0.3)' }}>
                        <p style={{ fontSize:10, fontWeight:700, color:'#8E8E93', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>
                          Locked TM
                        </p>
                        <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                          <input
                            type="number" inputMode="decimal" placeholder="—"
                            value={rms[ex.name] ?? ''}
                            onChange={e => setRms(p => ({ ...p, [ex.name]: e.target.value }))}
                            onBlur={e => save(ex.name, e.target.value)}
                            style={{ width:'100%', fontSize:20, fontWeight:800, color:'var(--label)',
                              background:'transparent', outline:'none', border:'none', padding:0 }}
                          />
                          <span style={{ fontSize:11, color:'#8E8E93', fontWeight:500, flexShrink:0 }}>lbs</span>
                        </div>
                        <p style={{ fontSize:10, color:'rgba(239,250,248,0.4)', marginTop:2 }}>drives prescription</p>
                      </div>

                      {/* From logs */}
                      <div style={{ flex:1, borderRadius:10, padding:'9px 12px',
                        background: isBig
                          ? (hasGain ? 'color-mix(in srgb, var(--green) 10%, var(--fill-3))' : 'color-mix(in srgb, var(--orange) 10%, var(--fill-3))')
                          : 'var(--fill-3)',
                        border: `0.5px solid ${isBig
                          ? (hasGain ? 'color-mix(in srgb, var(--green) 32%, transparent)' : 'color-mix(in srgb, var(--orange) 32%, transparent)')
                          : 'rgba(84,84,88,0.3)'}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:4, marginBottom:4 }}>
                          <p style={{ fontSize:10, fontWeight:700, color: loggedEst ? 'var(--teal)' : '#8E8E93',
                            textTransform:'uppercase', letterSpacing:'0.08em' }}>From logs</p>
                          {loggedEst > 0 && <TrendingUp size={9} style={{ color:'var(--teal)', flexShrink:0 }} strokeWidth={2.5} />}
                        </div>
                        {loggedEst > 0 ? (
                          <>
                            <div style={{ display:'flex', alignItems:'baseline', gap:4 }}>
                              <span style={{ fontSize:20, fontWeight:800,
                                color: isBig ? (hasGain ? 'var(--green)' : 'var(--orange)') : 'var(--label)' }}>
                                {loggedEst}
                              </span>
                              <span style={{ fontSize:11, color:'#8E8E93', fontWeight:500 }}>lbs</span>
                            </div>
                            <p style={{ fontSize:10, marginTop:2,
                              color: isBig ? (hasGain ? 'var(--green)' : 'var(--orange)') : 'rgba(239,250,248,0.4)' }}>
                              {isBig
                                ? (hasGain
                                  ? `↑ ${Math.round(diff)} lbs gain — syncs at cycle end`
                                  : `↓ ${Math.round(-diff)} lbs below TM — syncs at cycle end`)
                                : diff > 0.5 ? `↑ ${Math.round(diff)} lbs ahead`
                                : diff < -0.5 ? `↓ ${Math.round(-diff)} lbs behind`
                                : 'tracking with TM'}
                            </p>
                          </>
                        ) : (
                          <>
                            <span style={{ fontSize:20, fontWeight:800, color:'#8E8E93' }}>—</span>
                            <p style={{ fontSize:10, color:'rgba(239,250,248,0.3)', marginTop:2 }}>not enough sets yet</p>
                          </>
                        )}
                      </div>
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
