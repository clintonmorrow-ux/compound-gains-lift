'use client'

// Colors a muscle region by training-volume intensity (0..1).
// 0 = untrained (dim grey), 1 = heavily trained (hot orange).
function heat(intensity: number): string {
  if (intensity <= 0.01) return 'rgba(84,84,88,0.35)'
  // interpolate grey → blue → orange → red as intensity climbs
  if (intensity < 0.33) {
    const t = intensity / 0.33
    return `rgba(${Math.round(84+ (10-84)*t)},${Math.round(84+(132-84)*t)},${Math.round(88+(255-88)*t)},0.85)`
  }
  if (intensity < 0.66) {
    const t = (intensity-0.33)/0.33
    return `rgba(${Math.round(10+(255-10)*t)},${Math.round(132+(159-132)*t)},${Math.round(255+(10-255)*t)},0.9)`
  }
  const t = (intensity-0.66)/0.34
  return `rgba(255,${Math.round(159+(69-159)*t)},${Math.round(10+(58-10)*t)},0.95)`
}

export default function BodyHeatmap({ regions }: { regions: Record<string, number> }) {
  const r = (name: string) => heat(regions[name] ?? 0)

  return (
    <div style={{ display:'flex', justifyContent:'center', gap:16 }}>
      {/* ── FRONT ── */}
      <svg viewBox="0 0 120 260" style={{ width:'42%', maxWidth:160 }}>
        {/* Head */}
        <circle cx="60" cy="20" r="13" fill="rgba(84,84,88,0.3)" />
        {/* Neck */}
        <rect x="54" y="31" width="12" height="8" rx="3" fill="rgba(84,84,88,0.3)" />
        {/* Shoulders */}
        <ellipse cx="38" cy="48" rx="13" ry="9" fill={r('shoulders')} />
        <ellipse cx="82" cy="48" rx="13" ry="9" fill={r('shoulders')} />
        {/* Chest */}
        <path d="M44 44 H76 Q80 60 60 66 Q40 60 44 44 Z" fill={r('chest')} />
        {/* Arms (biceps) */}
        <ellipse cx="30" cy="74" rx="8" ry="20" fill={r('arms')} />
        <ellipse cx="90" cy="74" rx="8" ry="20" fill={r('arms')} />
        {/* Forearms */}
        <ellipse cx="26" cy="106" rx="6" ry="16" fill="rgba(84,84,88,0.3)" />
        <ellipse cx="94" cy="106" rx="6" ry="16" fill="rgba(84,84,88,0.3)" />
        {/* Core / abs */}
        <rect x="48" y="68" width="24" height="34" rx="6" fill={r('core')} />
        {/* Quads */}
        <path d="M46 108 Q48 150 50 168 L58 168 Q58 140 58 108 Z" fill={r('quads')} />
        <path d="M74 108 Q72 150 70 168 L62 168 Q62 140 62 108 Z" fill={r('quads')} />
        {/* Calves (front=shins, dim) */}
        <ellipse cx="52" cy="200" rx="7" ry="22" fill={r('calves')} />
        <ellipse cx="68" cy="200" rx="7" ry="22" fill={r('calves')} />
        <text x="60" y="252" textAnchor="middle" fontSize="9" fill="#8E8E93" fontWeight="600">FRONT</text>
      </svg>

      {/* ── BACK ── */}
      <svg viewBox="0 0 120 260" style={{ width:'42%', maxWidth:160 }}>
        {/* Head */}
        <circle cx="60" cy="20" r="13" fill="rgba(84,84,88,0.3)" />
        <rect x="54" y="31" width="12" height="8" rx="3" fill="rgba(84,84,88,0.3)" />
        {/* Rear delts */}
        <ellipse cx="38" cy="48" rx="13" ry="9" fill={r('shoulders')} />
        <ellipse cx="82" cy="48" rx="13" ry="9" fill={r('shoulders')} />
        {/* Back (lats + traps) */}
        <path d="M44 44 H76 Q82 80 60 100 Q38 80 44 44 Z" fill={r('back')} />
        {/* Triceps */}
        <ellipse cx="30" cy="74" rx="8" ry="20" fill={r('arms')} />
        <ellipse cx="90" cy="74" rx="8" ry="20" fill={r('arms')} />
        <ellipse cx="26" cy="106" rx="6" ry="16" fill="rgba(84,84,88,0.3)" />
        <ellipse cx="94" cy="106" rx="6" ry="16" fill="rgba(84,84,88,0.3)" />
        {/* Glutes */}
        <path d="M48 104 Q48 124 58 126 Q60 110 60 104 Z" fill={r('glutes')} />
        <path d="M72 104 Q72 124 62 126 Q60 110 60 104 Z" fill={r('glutes')} />
        {/* Hamstrings */}
        <path d="M48 128 Q50 152 52 168 L58 168 Q58 146 58 128 Z" fill={r('hamstrings')} />
        <path d="M72 128 Q70 152 68 168 L62 168 Q62 146 62 128 Z" fill={r('hamstrings')} />
        {/* Calves */}
        <ellipse cx="52" cy="200" rx="7" ry="22" fill={r('calves')} />
        <ellipse cx="68" cy="200" rx="7" ry="22" fill={r('calves')} />
        <text x="60" y="252" textAnchor="middle" fontSize="9" fill="#8E8E93" fontWeight="600">BACK</text>
      </svg>
    </div>
  )
}
