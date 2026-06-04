import { describe, it, expect } from 'vitest'
import {
  roundDose, raiseAlkalinity, chlorineToTarget, raisePH, lowerPH,
  shockDose, dailyDose, scaleDose, freshFillChlorine,
} from './dosing.js'

const V = 1123 // the tub's default volume

describe('roundDose', () => {
  it('clamps non-positive to 0', () => {
    expect(roundDose(0)).toBe(0)
    expect(roundDose(-5)).toBe(0)
  })
  it('rounds to nearest whole', () => expect(roundDose(1.9091)).toBe(2))
})

describe('chlorineToTarget', () => {
  it('1 mg/L rise at default rate', () => expect(chlorineToTarget(2, 3, 1.7, V)).toBe(2))
  it('0 when already at/above target', () => {
    expect(chlorineToTarget(3, 3, 1.7, V)).toBe(0)
    expect(chlorineToTarget(4, 3, 1.7, V)).toBe(0)
  })
  it('0 when no reading', () => expect(chlorineToTarget(null, 3, 1.7, V)).toBe(0))
})

describe('raiseAlkalinity', () => {
  it('toward ~100', () => expect(raiseAlkalinity(60, 17, V)).toBe(76))
  it('0 when at/above 80', () => expect(raiseAlkalinity(80, 17, V)).toBe(0))
})

describe('raisePH / lowerPH (target midpoint 7.4)', () => {
  it('raises only below 7.2', () => {
    expect(raisePH(7.0, 10, V)).toBe(45)
    expect(raisePH(7.2, 10, V)).toBe(0)
  })
  it('lowers only above 7.6', () => {
    expect(lowerPH(7.8, 10, V)).toBe(45)
    expect(lowerPH(7.6, 10, V)).toBe(0)
  })
})

describe('flat-rate doses scale by volume/1000', () => {
  it('shock', () => expect(shockDose(15, V)).toBe(17))
  it('daily', () => expect(dailyDose(7.5, V)).toBe(8))
  it('scale control', () => expect(scaleDose(40, V)).toBe(45))
  it('fresh-fill chlorine fixed 15 g/1000 L', () => expect(freshFillChlorine(V)).toBe(17))
})
