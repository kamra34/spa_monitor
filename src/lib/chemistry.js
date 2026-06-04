// Water-chemistry status functions. SAFETY-CRITICAL (a child plays in this water).
// Each returns a status KEY, or null when there's no reading. Thresholds mirror the
// original app exactly (CLAUDE.md §4) and are locked by chemistry.test.js.

export function freeChlorineStatus(fc) {
  if (fc == null) return null
  if (fc < 3) return fc <= 0 ? 'none' : 'low'
  return fc <= 5 ? 'good' : 'high'
}

export function phStatus(ph) {
  if (ph == null) return null
  if (ph < 7) return 'low'
  if (ph < 7.2) return 'low-edge'
  if (ph <= 7.6) return 'good'
  if (ph <= 7.8) return 'high-edge'
  return 'high'
}

export function alkalinityStatus(ta) {
  if (ta == null) return null
  if (ta < 80) return 'low'
  return ta <= 120 ? 'good' : 'high'
}

export function hardnessStatus(h) {
  if (h == null) return null
  if (h < 100) return 'low'
  if (h <= 250) return 'good'
  return h <= 500 ? 'high-edge' : 'high'
}

export function cyaStatus(c) {
  if (c == null) return null
  if (c < 50) return 'good'
  return c <= 100 ? 'high-edge' : 'high'
}

// Total chlorine has no status pill of its own — it's only used to derive chloramines.
export function totalChlorineStatus() {
  return null
}

// Combined chlorine (chloramines) = total − free, never negative, 1 decimal.
export function combinedChlorine(free, total) {
  if (free == null || total == null) return null
  return Math.max(0, +(total - free).toFixed(1))
}

// Status key → tone + human word (the pill text/colour).
export const STATUS = {
  none: { tone: 'bad', word: 'None' },
  low: { tone: 'warn', word: 'Low' },
  'low-edge': { tone: 'warn', word: 'A touch low' },
  good: { tone: 'good', word: 'In range' },
  'high-edge': { tone: 'warn', word: 'A touch high' },
  high: { tone: 'bad', word: 'High' },
}

// Above this much combined chlorine, the plan recommends a shock.
export const COMBINED_CL_THRESHOLD = 0.5

// Which chemistry function applies to each strip-pad key.
export const STATUS_FN = {
  freeChlorine: freeChlorineStatus,
  pH: phStatus,
  alkalinity: alkalinityStatus,
  hardness: hardnessStatus,
  cya: cyaStatus,
  totalChlorine: totalChlorineStatus,
}
