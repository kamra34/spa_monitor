import { describe, it, expect } from 'vitest'
import { entryVerdict } from './verdict.js'

describe('entryVerdict', () => {
  it('asks to test when chlorine or pH missing', () => {
    expect(entryVerdict(null, 7.4).title).toBe('Test chlorine & pH first')
    expect(entryVerdict(4, null).title).toBe('Test chlorine & pH first')
  })
  it('blocks entry when chlorine is none/low', () => {
    expect(entryVerdict(0, 7.4).tone).toBe('bad')
    expect(entryVerdict(2, 7.4).title).toBe('Hold off — not safe yet')
  })
  it('blocks entry when chlorine is high', () => {
    expect(entryVerdict(7, 7.4).title).toBe('Too much chlorine — wait')
  })
  it('warns on out-of-range pH (only low/high, not edges)', () => {
    expect(entryVerdict(4, 6.5).title).toBe('Okay, but balance pH first')
    expect(entryVerdict(4, 8.0).title).toBe('Okay, but balance pH first')
    // edge pH still reads as good
    expect(entryVerdict(4, 7.15).tone).toBe('good')
  })
  it('green-lights healthy water', () => {
    expect(entryVerdict(4, 7.4)).toMatchObject({ tone: 'good', title: "Water's in good shape" })
  })
})
