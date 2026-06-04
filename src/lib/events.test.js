import { describe, it, expect } from 'vitest'
import {
  scopeReading, makeReadingEvent, makeRefillEvent, migrateState,
  recentByType, lastRefillAt, readingSummary,
} from './events.js'

const full = { fc: 3, ph: 7.2, ta: 120, totalCl: 5, hardness: 200, cya: 40 }

describe('scopeReading', () => {
  it('keeps everything on a 7-in-1', () => {
    expect(scopeReading(full, '7')).toEqual(full)
  })
  it('drops total chlorine, stabiliser and hardness on a 3-in-1', () => {
    expect(scopeReading(full, '3')).toEqual({ fc: 3, ph: 7.2, ta: 120, totalCl: null, hardness: null, cya: null })
  })
})

describe('makeReadingEvent', () => {
  it('records the strip and scopes the values (the stale-stabiliser bug)', () => {
    const ev = makeReadingEvent(full, '3', '2026-06-04T12:00:00.000Z')
    expect(ev).toMatchObject({ type: 'reading', strip: '3', cya: null, totalCl: null, hardness: null, fc: 3, ph: 7.2, ta: 120 })
    expect(ev.id).toBeTruthy()
  })
})

describe('migrateState', () => {
  it('converts the legacy { log, lastChange } shape into events', () => {
    const out = migrateState({
      log: [{ d: '2026-06-03T10:00:00.000Z', fc: 3, ph: 7.4, ta: 100, cya: 40 }],
      lastChange: '2026-06-01T08:00:00.000Z',
    })
    expect(out.events).toHaveLength(2)
    expect(recentByType(out.events, 'reading', 9)).toHaveLength(1)
    expect(recentByType(out.events, 'refill', 9)).toHaveLength(1)
    expect(lastRefillAt(out.events)).toBe('2026-06-01T08:00:00.000Z')
  })
  it('passes through the new shape and sorts newest-first', () => {
    const out = migrateState({ events: [
      makeRefillEvent('2026-06-01T00:00:00.000Z'),
      makeReadingEvent(full, '7', '2026-06-05T00:00:00.000Z'),
    ] })
    expect(out.events[0].at).toBe('2026-06-05T00:00:00.000Z')
  })
  it('handles junk safely', () => {
    expect(migrateState(null)).toEqual({ events: [] })
    expect(migrateState({}).events).toEqual([])
  })
})

describe('readingSummary', () => {
  it('omits pads that were not read', () => {
    expect(readingSummary({ fc: 3, ph: 7.2, ta: 120, totalCl: null, cya: null, hardness: null }))
      .toBe('TA 120 · pH 7.2 · Cl 3')
  })
})
