import { describe, it, expect } from 'vitest'
import { buildPlan, hasAnyReading } from './plan.js'
import { DEFAULT_SETTINGS } from './constants.js'

const S = DEFAULT_SETTINGS
const base = { fc: null, ph: null, ta: null, totalCl: null, hardness: null, cya: null }
const ids = (steps) => steps.map((s) => s.id)

describe('buildPlan', () => {
  it('CYA > 100 short-circuits to a single drain step', () => {
    const plan = buildPlan({ ...base, cya: 120, fc: 1, ph: 6.5, ta: 50 }, S)
    expect(ids(plan)).toEqual(['drain'])
  })

  it('enforces alkalinity → pH → chlorine order, then re-test', () => {
    const plan = buildPlan({ ...base, ta: 50, ph: 7.0, fc: 1 }, S)
    expect(ids(plan)).toEqual(['alk-up', 'ph-up', 'cl-up', 'retest'])
  })

  it('returns empty when everything is balanced', () => {
    const plan = buildPlan({ ...base, ta: 100, ph: 7.4, fc: 4 }, S)
    expect(plan).toEqual([])
  })

  it('recommends a shock when combined chlorine > 0.5 and chlorine is not high', () => {
    const plan = buildPlan({ ...base, fc: 4, ph: 7.4, ta: 100, totalCl: 5 }, S)
    expect(ids(plan)).toEqual(['shock', 'retest'])
  })

  it('suppresses the shock when chlorine is already high', () => {
    const plan = buildPlan({ ...base, fc: 7, ph: 7.4, ta: 100, totalCl: 9 }, S)
    expect(ids(plan)).toEqual(['cl-drop', 'retest'])
  })

  it('flags hard water', () => {
    const plan = buildPlan({ ...base, fc: 4, ph: 7.4, ta: 100, hardness: 600 }, S)
    expect(ids(plan)).toEqual(['hard', 'retest'])
  })

  it('hasAnyReading', () => {
    expect(hasAnyReading(base)).toBe(false)
    expect(hasAnyReading({ ...base, ph: 7.4 })).toBe(true)
  })
})
