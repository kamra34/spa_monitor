// Unified activity log: "reading" events (a saved test, scoped to the strip used) and
// "refill" events (a fresh water change). Replaces the old flat `log` array. Pure +
// tested (events.test.js). Persisted under spa:state as { events: [...] }.

export const STRIP_LABEL = { 3: '3-in-1', '3': '3-in-1', 7: '7-in-1', '7': '7-in-1' }
const READING_FIELDS = ['fc', 'ph', 'ta', 'totalCl', 'hardness', 'cya']

let _seq = 0
export function newId() {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  } catch { /* not available */ }
  return `e${Date.now()}_${_seq++}`
}

// A 3-in-1 strip has no total-chlorine, stabiliser or hardness pad — null those out so a
// stale 7-in-1 value can never be saved or feed a recommendation in 3-in-1 mode.
export function scopeReading(reading, strip) {
  const r = {
    fc: reading.fc ?? null, ph: reading.ph ?? null, ta: reading.ta ?? null,
    totalCl: reading.totalCl ?? null, hardness: reading.hardness ?? null, cya: reading.cya ?? null,
  }
  if (String(strip) === '7') return r
  return { ...r, totalCl: null, hardness: null, cya: null }
}

export function makeReadingEvent(reading, strip, at) {
  return { id: newId(), type: 'reading', at: at || new Date().toISOString(), strip: String(strip), ...scopeReading(reading, strip) }
}

export function makeRefillEvent(at, note) {
  return { id: newId(), type: 'refill', at: at || new Date().toISOString(), note: note || '' }
}

function normalizeEvent(e) {
  if (!e || typeof e !== 'object') return null
  const at = e.at || e.d || new Date().toISOString()
  if (e.type === 'refill') return { id: e.id || newId(), type: 'refill', at, note: e.note || '' }
  const strip = e.strip != null ? String(e.strip) : (e.cya != null || e.totalCl != null || e.hardness != null ? '7' : '3')
  return { id: e.id || newId(), type: 'reading', at, strip, ...scopeReading(e, strip) }
}

// Accepts the new shape ({ events }) or the legacy shape ({ log, lastChange, lastTest }).
export function migrateState(raw) {
  if (!raw || typeof raw !== 'object') return { events: [] }
  if (Array.isArray(raw.events)) {
    return { events: raw.events.map(normalizeEvent).filter(Boolean).sort(byNewest) }
  }
  const events = []
  if (Array.isArray(raw.log)) for (const e of raw.log) { const n = normalizeEvent(e); if (n) events.push(n) }
  if (raw.lastChange) events.push({ id: newId(), type: 'refill', at: raw.lastChange, note: '' })
  return { events: events.sort(byNewest) }
}

export const byNewest = (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()
export const sortedEvents = (events) => [...events].sort(byNewest)
export const recent = (events, n) => sortedEvents(events).slice(0, n)
export const recentByType = (events, type, n) => sortedEvents(events).filter((e) => e.type === type).slice(0, n)
export function lastRefillAt(events) {
  const r = sortedEvents(events).find((e) => e.type === 'refill')
  return r ? r.at : null
}

// "TA 120 · pH 7.2 · Cl 3 · Stab 40" — omits pads that weren't read.
export function readingSummary(e) {
  const parts = []
  if (e.ta != null) parts.push(`TA ${e.ta}`)
  if (e.ph != null) parts.push(`pH ${e.ph}`)
  if (e.fc != null) parts.push(`Cl ${e.fc}`)
  if (e.totalCl != null) parts.push(`Tot ${e.totalCl}`)
  if (e.cya != null) parts.push(`Stab ${e.cya}`)
  if (e.hardness != null) parts.push(`Hard ${e.hardness}`)
  return parts.length ? parts.join(' · ') : 'No values recorded'
}

export { READING_FIELDS }
