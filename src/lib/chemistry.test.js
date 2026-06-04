import { describe, it, expect } from 'vitest'
import {
  freeChlorineStatus, phStatus, alkalinityStatus, hardnessStatus,
  cyaStatus, combinedChlorine, totalChlorineStatus,
} from './chemistry.js'

describe('freeChlorineStatus', () => {
  it('null reading → null', () => expect(freeChlorineStatus(null)).toBe(null))
  it('0 or below → none', () => {
    expect(freeChlorineStatus(0)).toBe('none')
    expect(freeChlorineStatus(-1)).toBe('none')
  })
  it('below 3 → low', () => expect(freeChlorineStatus(2.9)).toBe('low'))
  it('3 to 5 → good', () => {
    expect(freeChlorineStatus(3)).toBe('good')
    expect(freeChlorineStatus(5)).toBe('good')
  })
  it('above 5 → high', () => expect(freeChlorineStatus(5.1)).toBe('high'))
})

describe('phStatus', () => {
  it('null → null', () => expect(phStatus(null)).toBe(null))
  it('below 7 → low', () => expect(phStatus(6.9)).toBe('low'))
  it('7 to 7.2 → low-edge', () => {
    expect(phStatus(7)).toBe('low-edge')
    expect(phStatus(7.1)).toBe('low-edge')
  })
  it('7.2 to 7.6 → good', () => {
    expect(phStatus(7.2)).toBe('good')
    expect(phStatus(7.6)).toBe('good')
  })
  it('7.6 to 7.8 → high-edge', () => {
    expect(phStatus(7.7)).toBe('high-edge')
    expect(phStatus(7.8)).toBe('high-edge')
  })
  it('above 7.8 → high', () => expect(phStatus(7.9)).toBe('high'))
})

describe('alkalinityStatus', () => {
  it('below 80 → low', () => expect(alkalinityStatus(79)).toBe('low'))
  it('80 to 120 → good', () => {
    expect(alkalinityStatus(80)).toBe('good')
    expect(alkalinityStatus(120)).toBe('good')
  })
  it('above 120 → high', () => expect(alkalinityStatus(121)).toBe('high'))
})

describe('hardnessStatus', () => {
  it('below 100 → low', () => expect(hardnessStatus(99)).toBe('low'))
  it('100 to 250 → good', () => expect(hardnessStatus(250)).toBe('good'))
  it('250 to 500 → high-edge', () => {
    expect(hardnessStatus(251)).toBe('high-edge')
    expect(hardnessStatus(500)).toBe('high-edge')
  })
  it('above 500 → high', () => expect(hardnessStatus(501)).toBe('high'))
})

describe('cyaStatus', () => {
  it('below 50 → good', () => expect(cyaStatus(49)).toBe('good'))
  it('50 to 100 → high-edge', () => {
    expect(cyaStatus(50)).toBe('high-edge')
    expect(cyaStatus(100)).toBe('high-edge')
  })
  it('above 100 → high (drain territory)', () => expect(cyaStatus(101)).toBe('high'))
})

describe('combinedChlorine', () => {
  it('needs both readings', () => {
    expect(combinedChlorine(null, 3)).toBe(null)
    expect(combinedChlorine(3, null)).toBe(null)
  })
  it('total − free, never negative', () => {
    expect(combinedChlorine(3, 4)).toBe(1)
    expect(combinedChlorine(4, 3)).toBe(0)
  })
  it('totalChlorineStatus has no pill', () => expect(totalChlorineStatus()).toBe(null))
})
