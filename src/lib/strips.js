// Test-strip pad definitions. The user taps a colour band; the tapped numeric value
// becomes the reading. Band values mirror the original app exactly (CLAUDE.md §4).
// The `swatches` are indicative colours for the UI (cosmetic — they make the on-screen
// band look like a real strip; they do not affect any reading or dose).

export const BANDS = {
  alkalinity: [0, 40, 80, 120, 180, 240],
  pH: [6.2, 6.8, 7.2, 7.6, 8.4],
  freeChlorine: [0, 1, 3, 5, 10],
  totalChlorine: [0, 1, 3, 5, 10],
  cya: [0, 30, 50, 100, 150, 240],
  hardness: [0, 100, 250, 500, 1000],
}

export const SWATCHES = {
  alkalinity: ['#d7e4c4', '#bcd9b3', '#8ec9a6', '#5fb1a2', '#3d8a93', '#356486'],
  pH: ['#e79a45', '#e6c258', '#7fc89e', '#46b1a6', '#7e6cb0'],
  freeChlorine: ['#eef3ec', '#e2efd6', '#cfe7b0', '#9fd190', '#3f9f86'],
  totalChlorine: ['#eef3ec', '#e2efd6', '#cfe7b0', '#9fd190', '#3f9f86'],
  cya: ['#eceee6', '#e7e0c4', '#e2c69f', '#d79a82', '#c2685e', '#a23f4e'],
  hardness: ['#efd9e7', '#e2b6d3', '#cf8fc0', '#b06aab', '#864e98'],
}

export const labelFor = (key, v) => (key === 'pH' ? v.toFixed(1) : String(v))

// key → which field on the readings object it writes.
export const FIELD = {
  alkalinity: 'ta',
  pH: 'ph',
  freeChlorine: 'fc',
  totalChlorine: 'totalCl',
  cya: 'cya',
  hardness: 'hardness',
}

const PAD = {
  alkalinity: { key: 'alkalinity', title: 'Total alkalinity', subtitle: 'Target 80–120 mg/L · the pH buffer' },
  pH: { key: 'pH', title: 'pH', subtitle: 'Target 7.2–7.6 (no units)' },
  freeChlorine: { key: 'freeChlorine', title: 'Free chlorine', subtitle: 'Target 3–5 mg/L (label: 1–3)' },
  totalChlorine: { key: 'totalChlorine', title: 'Total chlorine', subtitle: 'Read with free chlorine — the gap = chloramines' },
  cya: { key: 'cya', title: 'Cyanuric acid (stabiliser)', subtitle: 'Keep low · drain if over 100 mg/L' },
  hardness: { key: 'hardness', title: 'Total hardness', subtitle: 'Target ~150–250 mg/L' },
}

// The three core pads, shown in both strip modes.
export const PADS_CORE = [PAD.alkalinity, PAD.pH, PAD.freeChlorine]

// The extra pads, shown only on the 7-in-1 strip.
export const PADS_EXTRA = [PAD.totalChlorine, PAD.cya, PAD.hardness]

export function padsFor(strip) {
  return strip === '7' ? [...PADS_CORE, ...PADS_EXTRA] : PADS_CORE
}
