'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Check, LogOut, ChevronRight } from 'lucide-react'
import BottomNav from '@/components/BottomNav'
import { createClient } from '@/lib/supabase/client'
import { fetchSettings, updateSettings, fetchEquipment, saveEquipment,
         fetchCoachPrefs, saveCoachPrefs } from '@/lib/db'
import { DEFAULT_COACH_PREFS } from '@/lib/program/coach'
import { EQUIPMENT_LABELS, EQUIPMENT_ICONS, type EquipmentKey } from '@/lib/program/alternatives'

export default function SettingsPage() {
  const router = useRouter()
  const [round,         setRound]         = useState(5)
  const [equip,         setEquip]         = useState<string[]>(['barbell','dumbbells','cables','machines'])
  const [loading,       setLoading]       = useState(true)
  const [coachPrefs,    setCoachPrefs]    = useState(DEFAULT_COACH_PREFS)

  const [userEmail,     setUserEmail]     = useState('')
  const [signingOut,    setSigningOut]    = useState(false)

  const init = useCallback(async () => {
    try {
      const sb = createClient()
      const { data:{ session } } = await sb.auth.getSession()
      if (session?.user?.email) setUserEmail(session.user.email)
      const [s, eq, cp] = await Promise.all([fetchSettings(), fetchEquipment(), fetchCoachPrefs()])
      setCoachPrefs(cp)

      setRound(s.round_to_lbs)
      setEquip(eq)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { init() }, [init])

  const toggleCoach = async (key: 'rirTrend'|'deloadAlerts'|'setFatigue') => {
    const next = { ...coachPrefs, [key]: !coachPrefs[key] }
    setCoachPrefs(next)
    try { await saveCoachPrefs(next) } catch {}
  }



const changeRound = async (v: number) => {
    setRound(v)
    try { await updateSettings({ round_to_lbs: v }) } catch {}
  }

  const toggleEquip = async (k: string) => {
    const next = equip.includes(k) ? equip.filter(e=>e!==k) : [...equip, k]
    setEquip(next)
    try { await saveEquipment(next) } catch {}
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      const sb = createClient()
      await sb.auth.signOut()
      router.push('/login')
    } catch { setSigningOut(false) }
  }

  const Header = (
    <div className="pt-safe sticky top-0 z-20"
      style={{ background:'rgba(8,8,14,0.97)', backdropFilter:'saturate(200%) blur(28px)',
               WebkitBackdropFilter:'saturate(200%) blur(28px)',
               borderBottom:'0.5px solid rgba(84,84,88,0.45)' }}>
      <div style={{ padding:'10px 18px 13px' }}>
        <p style={{ fontSize:9, fontWeight:700, color:'rgba(142,142,147,0.6)', textTransform:'uppercase', letterSpacing:'0.1em' }}>
          App Configuration
        </p>
        <p style={{ fontSize:22, fontWeight:800, color:'#fff', letterSpacing:'-0.7px', lineHeight:1.1, marginTop:1 }}>
          Settings
        </p>
      </div>
    </div>
  )

  if (loading) return (
    <div className="min-h-screen" style={{ background:'var(--bg)' }}>
      {Header}
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-[2.5px] border-t-transparent animate-spin"
             style={{ borderColor:'var(--accent)' }} />
      </div>
      <BottomNav />
    </div>
  )

  return (
    <div className="min-h-screen pb-tabs" style={{ background:'var(--bg)' }}>
      {Header}

      <div className="px-4 pt-6 space-y-8">

        {/* ── Equipment ── */}
        <div>
          <p className="ios-section-label mb-2">Available Equipment</p>
          <div className="ios-group">
            {(Object.keys(EQUIPMENT_LABELS) as EquipmentKey[]).map((k, i) => {
              const on = equip.includes(k)
              return (
                <button key={k} onClick={() => toggleEquip(k)}
                  className={`ios-row tap w-full ${i===0?'ios-row-first':''}`}>
                  <span style={{ fontSize:18, width:30, flexShrink:0, textAlign:'center' }}>
                    {EQUIPMENT_ICONS[k]}
                  </span>
                  <p className="t-subhead flex-1 text-left"
                     style={{ color: on ? 'var(--label)' : '#8E8E93' }}>
                    {EQUIPMENT_LABELS[k]}
                  </p>
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                       style={{ background: on ? 'var(--accent)' : 'var(--fill-3)' }}>
                    {on && <Check size={12} strokeWidth={3} style={{ color:'#fff' }} />}
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption1 mt-2 px-1" style={{ color:'#8E8E93', lineHeight:1.5 }}>
            Workout alternatives will show your available equipment first.
          </p>
        </div>

        {/* ── Weight Rounding ── */}
        <div>
          <p className="ios-section-label mb-2">Round weights to nearest</p>
          <div className="ios-group">
            {[2.5, 5, 10].map((v, i) => (
              <button key={v} onClick={() => changeRound(v)}
                className={`ios-row tap w-full ${i===0?'ios-row-first':''}`}>
                <span className="t-body flex-1 text-left" style={{ color:'var(--label)' }}>
                  {v} lbs
                </span>
                {round===v && <Check size={19} strokeWidth={2.5} style={{ color:'var(--accent)' }} />}
              </button>
            ))}
          </div>
        </div>



        {/* ── Coaching Intelligence ── */}
        <div>
          <p className="ios-section-label mb-2">Coaching Intelligence</p>
          <div className="ios-group">
            {([
              { key:'rirTrend'    as const, title:'Fatigue Tracking',    desc:'Flags when a lift feels harder at the same weight' },
              { key:'deloadAlerts' as const, title:'Smart Deload Alerts', desc:'Warns when performance signals suggest a recovery week' },
              { key:'setFatigue'  as const, title:'Set Fatigue Analysis', desc:'Suggests rep vs load progression from your set drop-off' },
            ]).map((row, i) => {
              const on = coachPrefs[row.key]
              return (
                <button key={row.key} onClick={() => toggleCoach(row.key)}
                  className={`ios-row w-full ${i===0?'ios-row-first':''}`}
                  style={{ textAlign:'left' }}>
                  <div style={{ flex:1, minWidth:0, paddingRight:12 }}>
                    <p className="t-body" style={{ color:'var(--label)', fontWeight:600 }}>{row.title}</p>
                    <p className="t-caption1" style={{ color:'#8E8E93', marginTop:2, lineHeight:1.4 }}>{row.desc}</p>
                  </div>
                  <div style={{ width:48, height:28, borderRadius:999, flexShrink:0, position:'relative',
                    background: on ? 'var(--green)' : 'rgba(118,118,128,0.32)', transition:'background 0.2s' }}>
                    <div style={{ position:'absolute', top:3, left: on ? 22 : 3, width:22, height:22,
                      borderRadius:'50%', background:'#fff', transition:'left 0.2s',
                      boxShadow:'0 1px 4px rgba(0,0,0,0.35)' }} />
                  </div>
                </button>
              )
            })}
          </div>
          <p className="t-caption1 mt-2 px-1" style={{ color:'#8E8E93', lineHeight:1.5 }}>
            Signals appear in Insights only when there's something actionable.
          </p>
        </div>

        {/* ── Account ── */}
        <div>
          <p className="ios-section-label mb-2">Account</p>
          <div className="ios-group">
            <div className="ios-row ios-row-first">
              <div style={{ width:34, height:34, borderRadius:'50%', flexShrink:0,
                background:'rgba(255,159,10,0.15)', display:'flex', alignItems:'center',
                justifyContent:'center', fontSize:13, fontWeight:800, color:'var(--accent)' }}>
                {userEmail ? userEmail[0].toUpperCase() : '?'}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p className="t-subhead sf-semibold" style={{ color:'var(--label)' }}>Signed in</p>
                <p className="t-caption1 mt-0.5 truncate" style={{ color:'#8E8E93' }}>{userEmail}</p>
              </div>
            </div>
            <button onClick={handleSignOut} disabled={signingOut}
              className="ios-row tap w-full"
              style={{ opacity: signingOut ? 0.6 : 1 }}>
              {signingOut
                ? <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin flex-shrink-0"
                       style={{ borderColor:'#FF453A' }} />
                : <LogOut size={18} strokeWidth={1.8} style={{ color:'#FF453A', flexShrink:0 }} />}
              <span className="t-subhead flex-1 text-left" style={{ color:'#FF453A' }}>
                {signingOut ? 'Signing out…' : 'Sign out'}
              </span>
            </button>
          </div>
        </div>

        <div style={{ height:8 }} />
      </div>



      <BottomNav />
    </div>
  )
}
