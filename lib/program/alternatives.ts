export type EquipmentKey =
  | 'dumbbells' | 'barbell' | 'cables' | 'machines'
  | 'hammer_strength' | 'kettlebells' | 'bands' | 'bodyweight'

export const EQUIPMENT_LABELS: Record<EquipmentKey, string> = {
  dumbbells:       'Dumbbells',
  barbell:         'Barbell',
  cables:          'Cables',
  machines:        'Machines',
  hammer_strength: 'Hammer Strength',
  kettlebells:     'Kettlebells',
  bands:           'Bands',
  bodyweight:      'Bodyweight',
}

export const EQUIPMENT_ICONS: Record<EquipmentKey, string> = {
  dumbbells:       '🏋️',
  barbell:         '🔩',
  cables:          '🔗',
  machines:        '⚙️',
  hammer_strength: '🔨',
  kettlebells:     '🔔',
  bands:           '🎀',
  bodyweight:      '🤸',
}

export interface Alt { name: string; cue: string }
export type AltsMap = Partial<Record<EquipmentKey, Alt[]>>

// ── Alternatives for every exercise ──────────────────────────────────
export const EXERCISE_ALTS: Record<string, AltsMap> = {

  // ── WORKOUT A ────────────────────────────────────────────────────────
  'Barbell Bench Press': {
    dumbbells:       [{ name:'Dumbbell Bench Press',        cue:'Full ROM · wrists neutral or pronated · elbows ~45°' },
                      { name:'DB Floor Press',              cue:'Removes bottom stretch — good for shoulder issues' }],
    cables:          [{ name:'Cable Chest Press (seated)',  cue:'Cables active through entire range of motion' }],
    machines:        [{ name:'Chest Press Machine',         cue:'Seat height: handles at lower chest · full extension' }],
    hammer_strength: [{ name:'Hammer Strength Chest Press', cue:'Load both sides evenly · full stretch each rep' }],
    kettlebells:     [{ name:'Kettlebell Floor Press',      cue:'Neutral wrists · press straight up · full lockout' }],
    bands:           [{ name:'Band Push-Up',                cue:'Band across upper back, anchor under palms' }],
    bodyweight:      [{ name:'Push-Up',                     cue:'Chest to floor · elbows track 45° from torso' },
                      { name:'Weighted Push-Up',            cue:'Plate on upper back or vest for added resistance' }],
  },

  'Incline Dumbbell Press': {
    barbell:         [{ name:'Incline Barbell Press',           cue:'30-45° bench · wide grip · bar to upper chest' }],
    cables:          [{ name:'Low-to-High Cable Press',         cue:'Cables set low · press up and together' }],
    machines:        [{ name:'Incline Machine Press',           cue:'Adjust to target upper chest emphasis' }],
    hammer_strength: [{ name:'Hammer Strength Incline Press',   cue:'Drive elbows forward and up at top' }],
    kettlebells:     [{ name:'KB Incline Press',                cue:'Rack bells on forearms · press straight overhead' }],
    bands:           [{ name:'Incline Band Press',              cue:'Anchor band behind bench · press at 45° angle' }],
    bodyweight:      [{ name:'Decline Push-Up',                 cue:'Feet elevated hits upper chest like incline press' }],
  },

  'Cable Chest Fly': {
    dumbbells:       [{ name:'Dumbbell Fly',           cue:'Slight elbow bend · wide arc · feel the stretch' },
                      { name:'DB Incline Fly',         cue:'30° bench · emphasises upper chest' }],
    machines:        [{ name:'Pec Deck Machine',       cue:'Elbows at 90° or arms slightly bent · squeeze at front' }],
    hammer_strength: [{ name:'Hammer Strength Fly',    cue:'Adjust arm pad height to mid-chest' }],
    bands:           [{ name:'Band Fly',                cue:'Anchor band behind you at chest height' }],
    kettlebells:     [{ name:'KB Svend Press / Fly',   cue:'Hold KB between palms · press and flare at top' }],
    bodyweight:      [{ name:'Wide-Grip Push-Up',       cue:'Hands wider than shoulder-width · chest-focused' }],
  },

  'Overhead Press (Barbell)': {
    dumbbells:       [{ name:'Dumbbell Overhead Press', cue:'Neutral or pronated grip · press overhead to full extension' },
                      { name:'Arnold Press',            cue:'Rotate from neutral to pronated as you press — full delt sweep' }],
    cables:          [{ name:'Single-Arm Cable Press',  cue:'Stand sideways to cable · core anti-rotation challenge' }],
    machines:        [{ name:'Machine Shoulder Press',  cue:'Adjust seat so handles start at shoulder height' }],
    hammer_strength: [{ name:'Hammer Strength OHP',     cue:'Full extension overhead · controlled descent' }],
    kettlebells:     [{ name:'KB Overhead Press',       cue:'Rack position · press straight up · lock out bicep by ear' },
                      { name:'KB Push Press',           cue:'Slight dip and drive from legs to assist heavier loads' }],
    bands:           [{ name:'Band Overhead Press',     cue:'Stand on band · press straight up · brace hard' }],
    bodyweight:      [{ name:'Pike Push-Up',            cue:'Hips high, head toward floor · forehead nearly touches ground' }],
  },

  'Cable Lateral Raise': {
    dumbbells:       [{ name:'DB Lateral Raise',         cue:'Lead with elbow · slight lean forward · 3-sec eccentric' },
                      { name:'DB Incline Lateral Raise', cue:'Lie sideways on incline bench — removes momentum' }],
    bands:           [{ name:'Band Lateral Raise',       cue:'Anchor band under feet · slow and controlled' }],
    machines:        [{ name:'Machine Lateral Raise',    cue:'Adjust arm pad to forearm — eliminates momentum' }],
    kettlebells:     [{ name:'KB Lateral Raise',         cue:'Keep wrist pronated (thumb down) at top for peak activation' }],
    bodyweight:      [{ name:'Prone Y Raise',            cue:'Lie face down · raise arms to Y at 45° — no weight needed' }],
  },

  'Tricep Rope Pushdown': {
    dumbbells:       [{ name:'DB Overhead Tricep Extension', cue:'One or two hands · elbows close · full stretch overhead' },
                      { name:'DB Kickback',                  cue:'Hinge forward · upper arm parallel to floor · extend' }],
    bands:           [{ name:'Band Pushdown',                cue:'Anchor band overhead · elbows fixed · full extension' }],
    machines:        [{ name:'Machine Tricep Extension',     cue:'Adjust pad to upper arm · push down through full ROM' }],
    hammer_strength: [{ name:'Hammer Strength Dip',          cue:'Narrow grip · lean slightly forward · deep at bottom' }],
    kettlebells:     [{ name:'KB Tricep Extension',          cue:'Hold KB by horns overhead · lower behind head' }],
    bodyweight:      [{ name:'Bench Dip',                    cue:'Hands on bench behind you · chest tall · full depth' },
                      { name:'Diamond Push-Up',              cue:'Hands forming diamond shape — heavy tricep emphasis' }],
  },

  'Overhead DB Tricep Extension': {
    barbell:         [{ name:'EZ-Bar Skull Crusher',     cue:'Slight elbow flare — bar to forehead then extend' },
                      { name:'EZ-Bar Overhead Extension',cue:'Grip inside knurling · elbows close to ears' }],
    cables:          [{ name:'Cable Overhead Extension', cue:'Face away from stack · pull attachment behind head' }],
    bands:           [{ name:'Band Overhead Extension',  cue:'Stand on band · both hands overhead · press up' }],
    machines:        [{ name:'Machine Overhead Extension',cue:'Adjust seat for full overhead stretch' }],
    kettlebells:     [{ name:'KB Overhead Extension',    cue:'Hold single bell by horns overhead · lower behind head' }],
    bodyweight:      [{ name:'Diamond Push-Up',          cue:'Hands close together · direct tricep load' }],
  },

  // ── WORKOUT B ────────────────────────────────────────────────────────
  'Barbell Back Squat': {
    dumbbells:       [{ name:'DB Goblet Squat',          cue:'Hold DB at chest · elbows inside knees · upright torso' },
                      { name:'DB Front Squat',           cue:'DBs on shoulders in rack position · stay upright' }],
    machines:        [{ name:'Leg Press',                cue:'Feet shoulder-width · press through heels · full ROM' },
                      { name:'Hack Squat Machine',       cue:'Feet low and narrow for quad emphasis' }],
    hammer_strength: [{ name:'Hammer Strength Squat',    cue:'Lean into pad · drive through platform evenly' }],
    cables:          [{ name:'Cable Squat (goblet hold)',cue:'Low pulley · hold handle at chest · counterbalance' }],
    kettlebells:     [{ name:'KB Goblet Squat',          cue:'Hold bell at chest · elbows push knees out · depth' }],
    bands:           [{ name:'Band Squat',               cue:'Stand on band · loop over shoulders · add resistance' }],
    bodyweight:      [{ name:'Bodyweight Squat',         cue:'Arms forward for balance · full depth · 3-sec descent' },
                      { name:'Jump Squat',               cue:'Explosive version — for power / conditioning emphasis' }],
  },

  'Bulgarian Split Squat (DB)': {
    barbell:         [{ name:'Barbell BSS',              cue:'Bar on traps or front-rack · same mechanics apply' }],
    machines:        [{ name:'Hack Squat (Single Leg)', cue:'One leg on platform · step back off pad for split stance' }],
    cables:          [{ name:'Cable BSS',                cue:'Low pulley in opposite hand of front leg — core challenge' }],
    kettlebells:     [{ name:'KB Bulgarian Split Squat', cue:'Hold KBs at sides · same pattern as DB version' }],
    bands:           [{ name:'Band-Resisted Lunge',      cue:'Loop band around hips anchored behind — hip flexor emphasis' }],
    bodyweight:      [{ name:'Reverse Lunge',            cue:'Step back · drop knee toward floor · drive through heel' },
                      { name:'Walking Lunge',            cue:'Long stride · knee tracks over toe · upright torso' }],
  },

  'Leg Press': {
    barbell:         [{ name:'Barbell Front Squat',      cue:'Upper body more upright — more quad dominant' },
                      { name:'Hack Squat (Barbell)',     cue:'Bar behind legs · feet forward — challenging but effective' }],
    dumbbells:       [{ name:'DB Sumo Squat',            cue:'Wide stance · toes out · hold DB between legs' }],
    machines:        [{ name:'Hack Squat Machine',       cue:'Feet low for quad emphasis · full depth' }],
    kettlebells:     [{ name:'KB Goblet Squat',          cue:'High rep replacement for machine volume' }],
    bands:           [{ name:'Band Squat',               cue:'Heavy band load, slow tempo to match leg press stimulus' }],
    bodyweight:      [{ name:'Single-Leg Box Squat',     cue:'Sit back onto box · drive up through heel' }],
  },

  'Leg Extension': {
    cables:          [{ name:'Cable Leg Extension',      cue:'Ankle attachment · knee locked at full extension' }],
    bands:           [{ name:'Band Leg Extension',       cue:'Anchor band behind · sit on chair · extend against resistance' }],
    machines:        [{ name:'Seated Leg Extension',     cue:'Adjust pad to shin · extend to full lockout · slow eccentric' }],
    kettlebells:     [{ name:'KB Step-Up',               cue:'Box at knee height · drive up through heel of front leg' }],
    bodyweight:      [{ name:'Wall Sit Isometric Hold',  cue:'90° knee angle · hold 45-60 sec per set for sustained quad work' },
                      { name:'Step-Up',                  cue:'Box step height at knee · drive through heel at top' }],
  },

  'Standing Calf Raise': {
    machines:        [{ name:'Seated Calf Raise',        cue:'Different angle targets soleus more — do both when possible' },
                      { name:'Donkey Calf Raise',        cue:'Hinge forward 90° — maximizes gastrocnemius stretch' }],
    dumbbells:       [{ name:'Single-Leg DB Calf Raise', cue:'Hold DB on same-side hand · full stretch at bottom' }],
    kettlebells:     [{ name:'KB Single-Leg Calf Raise', cue:'Hold KB for loading · free hand for light balance only' }],
    bands:           [{ name:'Band Calf Raise',          cue:'Stand on band · loop over shoulders · full ROM essential' }],
    bodyweight:      [{ name:'Single-Leg Bodyweight Calf Raise', cue:'Slow 3-sec eccentric · 15-20 reps per leg for volume' }],
  },

  'Hanging Leg Raise': {
    machines:        [{ name:"Captain's Chair Leg Raise", cue:'Posterior pelvic tilt before raising · control descent' }],
    cables:          [{ name:'Cable Knee-Up',             cue:'Ankle attachment · draw knees to chest against cable' }],
    bands:           [{ name:'Decline Sit-Up w/ Band',    cue:'Band adds top-range resistance · go slow through ROM' }],
    bodyweight:      [{ name:'Floor Leg Raise',           cue:'Lower back flat · raise legs to 90° · controlled descent' },
                      { name:'V-Up',                      cue:'Simultaneous upper and lower crunch — high difficulty' }],
  },

  'Ab Wheel Rollout': {
    cables:          [{ name:'Cable Crunch (kneeling)',   cue:'Flex at waist not hips · round spine fully through ROM' }],
    bands:           [{ name:'Band Anti-Extension Hold',  cue:'Band around wrist, anchor above · resist extension forces' }],
    machines:        [{ name:'Machine Ab Crunch',         cue:'Adjust weight for 10-15 rep range · full flexion each rep' }],
    bodyweight:      [{ name:'Plank to Pike',             cue:'Start in plank · drive hips up to pike then return' },
                      { name:'Bear Crawl',                cue:'Knees 2 inches off ground · slow controlled steps' }],
  },

  // ── WORKOUT C ────────────────────────────────────────────────────────
  'Barbell Bent-Over Row': {
    dumbbells:       [{ name:'DB Chest-Supported Row',    cue:'Lie prone on 45° bench · eliminates lower back involvement' },
                      { name:'Single-Arm DB Row',         cue:'Knee on bench · pull to hip · full stretch at bottom' }],
    cables:          [{ name:'Seated Cable Row (Close)',  cue:'Neutral grip · elbows past torso · hard scap squeeze' }],
    machines:        [{ name:'Seated Row Machine',        cue:'Chest pad stabilises torso — focus on back squeeze' }],
    hammer_strength: [{ name:'Hammer Strength Iso Row',   cue:'Single arm option for address imbalances' }],
    kettlebells:     [{ name:'KB Bent-Over Row',          cue:'Hinge at hips · row to hip · slow eccentric' }],
    bands:           [{ name:'Band Row',                  cue:'Anchor band in front · hinge back · row to torso' }],
    bodyweight:      [{ name:'Inverted Row (TRX/Bar)',    cue:'Body plank · pull chest to bar · retract scapulae' }],
  },

  'Pull-Up / Lat Pulldown': {
    cables:          [{ name:'Lat Pulldown (Cable)',      cue:'Wide overhand grip · pull bar to upper chest · stretch at top' },
                      { name:'Close-Grip Lat Pulldown',  cue:'Supinated narrow grip — strong bicep assist' }],
    machines:        [{ name:'Assisted Pull-Up Machine',  cue:'Select assistance weight · full dead hang each rep' }],
    hammer_strength: [{ name:'Hammer Strength Lat Pulldown', cue:'Lean back slightly · elbows drive to hips' }],
    bands:           [{ name:'Band-Assisted Pull-Up',    cue:'Band around knee — reduces body weight · full ROM' }],
    dumbbells:       [{ name:'DB Pullover',               cue:'Lie across bench · arms wide arc · feel lat stretch' }],
    kettlebells:     [{ name:'KB Pullover',               cue:'Same arc pattern as DB pullover using single bell' }],
    bodyweight:      [{ name:'Negative Pull-Up',          cue:'Jump to top · lower yourself over 5 sec — eccentric focus' }],
  },

  'Seated Cable Row (Wide Grip)': {
    dumbbells:       [{ name:'DB Chest-Supported Row',    cue:'Prone on incline bench · wide elbows · rear delt focus' },
                      { name:'DB Prone Row',              cue:'Face down flat bench · arms out wide · squeeze at top' }],
    barbell:         [{ name:'Pendlay Row',               cue:'Bar starts on floor each rep · flat back · explosive pull' },
                      { name:'Chest-Supported BB Row',   cue:'Prone on incline bench · full hang at bottom' }],
    bands:           [{ name:'Band Seated Row',           cue:'Anchor band in front · sit tall · row to lower sternum' }],
    machines:        [{ name:'Row Machine (Wide)',        cue:'Select wide grip attachment · elbows drive out and back' }],
    hammer_strength: [{ name:'Hammer Strength Row',       cue:'Unilateral or bilateral · full stretch and contraction' }],
    kettlebells:     [{ name:'KB Renegade Row',           cue:'Plank on KBs · alternate rows · anti-rotation challenge' }],
    bodyweight:      [{ name:'Wide-Grip Inverted Row',    cue:'Hands wider than shoulders · elbows flare · rear delt hit' }],
  },

  'Face Pull': {
    bands:           [{ name:'Band Face Pull',            cue:'Anchor at head height · pull to forehead · externally rotate' }],
    dumbbells:       [{ name:'DB Rear Delt Row',          cue:'Hinge 45° · elbows flare wide · think Face Pull angle' }],
    machines:        [{ name:'Reverse Pec Deck',          cue:'Arms parallel to floor · elbows slightly bent · wide arc' }],
    cables:          [{ name:'Single-Arm Cable Face Pull',cue:'One hand at a time — stronger mind-muscle connection' }],
    kettlebells:     [{ name:'KB Halo',                   cue:'Circle bell around head — shoulder and upper back health' }],
    bodyweight:      [{ name:'Prone W Raise',             cue:'Face down · arms in W shape · retract and depress scaps' }],
  },

  'DB Rear Delt Fly': {
    cables:          [{ name:'Cable Rear Delt Fly',       cue:'Cross cables · pull wide arcs · squeeze rear delts' }],
    machines:        [{ name:'Reverse Pec Deck',          cue:'Adjust to chest height · arc back as far as possible' }],
    hammer_strength: [{ name:'Hammer Strength Rear Delt', cue:'Adjust pad height · full ROM arc each rep' }],
    bands:           [{ name:'Band Rear Delt Fly',        cue:'Anchor band at chest height · pull to sides' }],
    barbell:         [{ name:'Prone BB Rear Delt Row',    cue:'Face down on bench · wide grip · shrug elbows to ceiling' }],
    kettlebells:     [{ name:'KB Rear Delt Swing',        cue:'Same fly motion · bell provides natural arc' }],
    bodyweight:      [{ name:'Prone T Raise',             cue:'Arms straight out · lift off floor — pure rear delt work' }],
  },

  'Barbell Curl': {
    dumbbells:       [{ name:'Alternating DB Curl',       cue:'Supinate at top · don\'t swing · slow 3-sec eccentric' },
                      { name:'DB Preacher Curl',          cue:'Eliminates cheating · full stretch at bottom' }],
    cables:          [{ name:'Cable Curl (EZ-bar)',       cue:'Constant tension throughout ROM — great for peak contraction' },
                      { name:'High Cable Curl',           cue:'Arms up at shoulder height · curl toward ears — peak focus' }],
    machines:        [{ name:'Machine Preacher Curl',     cue:'Full stretch · no cheat · perfect isolation' }],
    bands:           [{ name:'Band Curl',                 cue:'Stand on band · both hands · slow eccentric is key' }],
    kettlebells:     [{ name:'KB Curl',                   cue:'Neutral grip or supinate — bell challenges at different angles' }],
    bodyweight:      [{ name:'Underhand Inverted Row',    cue:'Supinated grip · curling motion — compound bicep work' }],
  },

  'DB Lateral Raise': {
    cables:          [{ name:'Cable Lateral Raise',       cue:'Low pulley · constant tension entire arc' }],
    bands:           [{ name:'Band Lateral Raise',        cue:'Doubled band for higher resistance · slow and controlled' }],
    machines:        [{ name:'Machine Lateral Raise',     cue:'Pad on forearm — removes grip fatigue · pure delt' }],
    kettlebells:     [{ name:'KB Lateral Raise',          cue:'Hold by horns · thumb down at top for peak activation' }],
    barbell:         [{ name:'Upright Row (wide grip)',   cue:'Wide grip reduces impingement risk · elbows lead' }],
    bodyweight:      [{ name:'Prone Y Raise',             cue:'Lie face down · arms at 45° — scapular health bonus' }],
  },

  // ── WORKOUT D ────────────────────────────────────────────────────────
  'Romanian Deadlift (RDL)': {
    dumbbells:       [{ name:'DB Romanian Deadlift',      cue:'Same hinge pattern · DBs track close to legs' },
                      { name:'Single-Leg DB RDL',         cue:'Balance challenge · excellent hamstring isolation per side' }],
    cables:          [{ name:'Cable Pull-Through',        cue:'Low pulley · hip hinge · drive hips forward aggressively' }],
    machines:        [{ name:'Leg Curl (stiff-leg focus)',cue:'Straighten knee more than usual for hamstring stretch' }],
    bands:           [{ name:'Band Good Morning',         cue:'Band on traps · hinge back · feel hamstring tension' }],
    kettlebells:     [{ name:'KB RDL',                    cue:'Same hinge pattern · bell hangs between legs' },
                      { name:'KB Single-Leg RDL',         cue:'Bell in opposite hand to standing leg — natural counter-balance' }],
    bodyweight:      [{ name:'Bodyweight Single-Leg RDL', cue:'Arms forward for balance · slow and controlled per side' }],
  },

  'Barbell Hip Thrust': {
    dumbbells:       [{ name:'DB Hip Thrust',             cue:'DBs on hip crests · same mechanics · lighter load ceiling' }],
    machines:        [{ name:'Hip Thrust Machine',        cue:'Adjustable pad on hips · often allows heavier loading' },
                      { name:'Glute Bridge Machine',      cue:'Lying position · reduces upper body setup time' }],
    hammer_strength: [{ name:'Hammer Strength Hip Press', cue:'Seated version of hip extension — adjust pad placement' }],
    cables:          [{ name:'Cable Hip Extension',       cue:'Ankle attachment · standing hip hinge into extension' }],
    kettlebells:     [{ name:'KB Hip Thrust',             cue:'Bell at hip crease · same glute squeeze cue at top' }],
    bands:           [{ name:'Banded Hip Thrust',         cue:'Band across hips adds top-range resistance — peak glute work' }],
    bodyweight:      [{ name:'Single-Leg Glute Bridge',   cue:'High reps per side · pause 2 sec at top for activation' }],
  },

  'Lying Leg Curl': {
    cables:          [{ name:'Standing Cable Leg Curl',   cue:'Ankle attachment · one leg at a time · full knee flex' }],
    bands:           [{ name:'Band Leg Curl',             cue:'Anchor band at ground in front · curl against resistance' }],
    machines:        [{ name:'Seated Leg Curl Machine',   cue:'Seated version — different hamstring emphasis · try both' }],
    dumbbells:       [{ name:'DB Leg Curl (lying)',       cue:'DB between feet · curl toward glutes · slow eccentric' }],
    kettlebells:     [{ name:'KB Hamstring Curl (slider)',cue:'Heels on KB · bridge up · pull KBs toward glutes' }],
    bodyweight:      [{ name:'Nordic Hamstring Curl',     cue:'Knees anchored · lower as slow as possible · hardest BW option' },
                      { name:'Slider Leg Curl',           cue:'Slide heel toward glutes on smooth surface · bridges combined' }],
  },

  'Cable Pull-Through': {
    bands:           [{ name:'Band Pull-Through',         cue:'Anchor band to fixed point · same hip hinge pattern' }],
    barbell:         [{ name:'Good Morning',              cue:'Bar on traps · hinge at hips · feel hamstring tension' }],
    dumbbells:       [{ name:'DB Sumo Deadlift',          cue:'Wide stance · DB between legs · hinge to floor' }],
    kettlebells:     [{ name:'KB Swing',                  cue:'Explosive hip drive — ballistic version of same pattern' },
                      { name:'KB Deadlift',               cue:'Slower and controlled — matches pull-through stimulus' }],
    bodyweight:      [{ name:'Hip Hinge (BW Good Morning)', cue:'Hands on hips · sit back · feel hamstring load · RDL pattern' }],
    machines:        [{ name:'Glute Kickback Machine',    cue:'Different angle but similar posterior chain activation' }],
  },

  'Seated Calf Raise': {
    machines:        [{ name:'Standing Calf Raise',       cue:'Gastroc dominant — different muscle emphasis than seated' },
                      { name:'Donkey Calf Raise',         cue:'Best gastrocnemius stretch of any calf exercise' }],
    dumbbells:       [{ name:'DB Seated Calf Raise',      cue:'DB on quads · slow full-ROM reps · feel the stretch' }],
    bands:           [{ name:'Seated Band Calf Raise',    cue:'Band around arch of foot · extend against resistance' }],
    kettlebells:     [{ name:'KB Seated Calf Raise',      cue:'KB on quad for loading · same seated mechanics' }],
    bodyweight:      [{ name:'Seated BW Calf Raise',      cue:'High volume (25+ reps) compensates for lower load' }],
  },

  'Cable Crunch': {
    bands:           [{ name:'Band Crunch',               cue:'Anchor band above · kneel and flex spine — same pattern' }],
    machines:        [{ name:'Ab Machine Crunch',         cue:'Arms cross over chest or hands behind head · full flex' }],
    dumbbells:       [{ name:'DB Crunch',                 cue:'Hold DB at chest · slow tempo · don\'t use momentum' }],
    barbell:         [{ name:'Ab Wheel Rollout',          cue:'Barbell can be used instead of ab wheel — same muscles' }],
    kettlebells:     [{ name:'KB Windmill',               cue:'Core anti-rotation and flexion combined — high difficulty' }],
    bodyweight:      [{ name:'Crunch / Sit-Up',           cue:'High rep volume (25-30) with bodyweight to compensate' },
                      { name:'V-Up',                      cue:'Advanced — upper and lower crunch simultaneously' }],
  },

  'Pallof Press (per side)': {
    bands:           [{ name:'Band Pallof Press',         cue:'Anchor band at chest height · press and resist rotation' }],
    cables:          [{ name:'Half-Kneeling Pallof Press',cue:'Kneeling version increases hip flexor involvement' }],
    dumbbells:       [{ name:'DB Rotational Press',       cue:'Press DB while rotating torso — dynamic anti-rotation' }],
    machines:        [{ name:'Landmine Rotation',         cue:'Barbell in landmine — sweep arc with arms · core fights resist' }],
    kettlebells:     [{ name:'KB Windmill',               cue:'Lateral flexion + rotation — advanced core stability work' }],
    bodyweight:      [{ name:'Side Plank',                cue:'Hold 30-45 sec per side · hips up throughout · scales easily' },
                      { name:'Dead Bug',                  cue:'Opposite arm/leg extend · lower back stays flat — anti-extension' }],
  },
}
