// Product names, defaults and target ranges.
// Values mirror the original app exactly (see CLAUDE.md §4/§5). Safety-critical —
// do not change defaults without re-reading the dosing provenance.

export const PRODUCTS = {
  chlorineShock: 'Spa Snabbklor (granulat)',
  chlorineTabs: 'Kayoba Chlorine tablets (i ChemConnect-doseraren)',
  phUp: 'Pool Höjer pH',
  phDown: 'Pool Sänker pH',
  alkUp: 'Spa Höjer Alkalinitet',
  clarifier: 'Spa Klarningsmedel',
  scale: 'Spa Kalkkontroll',
  lineFlush: 'Spa Rörcleaner',
}

export const DEFAULT_SETTINGS = {
  strip: '3',          // '3' = 3-in-1, '7' = 7-in-1
  volume: 1123,        // litres (Lay-Z-Spa Helsinki ~1123 L)
  childMode: false,
  temp: 31,            // usual water temperature, °C
  targetFC: 3,         // deliberate safety margin over the label's 1–3
  fcRate: 1.7,         // g per 1 mg/L rise, per 1000 L (derived — keep flagged)
  fcShock: 15,         // g per 1000 L (chloramine shock)
  fcDaily: 7.5,        // g per 1000 L (daily upkeep)
  taRate: 17,          // g per 10 mg/L rise, per 1000 L
  phUpRate: 10,        // g per 0.1 pH rise, per 1000 L
  phDownRate: 10,      // g per 0.1 pH drop, per 1000 L
  scaleRate: 40,       // ml per 1000 L (weekly)
  clarStart: 80,       // ml per 1000 L (first clarifier dose)
  clarWeekly: 40,      // ml per 1000 L (clarifier upkeep)
  flushRate: 400,      // ml per 1000 L (pipe flush)
}

export const DEFAULT_STATE = { lastChange: null, lastTest: null, log: [] }

export const LOG_LIMIT = 8
export const WATER_CHANGE_DUE_DAYS = 45

// Target ranges shown in the UI (units: mg/L = ppm).
export const TARGETS = {
  freeChlorine: { lo: 3, hi: 5, label: '3–5 mg/L', note: 'label: 1–3' },
  pH: { lo: 7.2, hi: 7.6, label: '7.2–7.6' },
  alkalinity: { lo: 80, hi: 120, label: '80–120 mg/L' },
  hardness: { lo: 150, hi: 250, label: '~150–250 mg/L' },
}

export const UNIT = 'mg/L'
