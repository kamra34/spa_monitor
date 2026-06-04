// The "Can we get in?" entry verdict. Branches on free chlorine and pH only.
// Copy and decision order mirror the original app exactly (CLAUDE.md §4). Locked by tests.
import { freeChlorineStatus, phStatus } from './chemistry.js'

export function entryVerdict(fc, ph) {
  const cl = freeChlorineStatus(fc)
  const p = phStatus(ph)

  if (fc == null || ph == null) {
    return {
      tone: 'warn',
      title: 'Test chlorine & pH first',
      lines: ["Tap your strip's colours for chlorine and pH to get a verdict."],
    }
  }
  if (cl === 'none' || cl === 'low') {
    return {
      tone: 'bad',
      title: 'Hold off — not safe yet',
      lines: [
        'Chlorine is too low to keep the water clean.',
        'Add Snabbklor, circulate, re-test until it reads 3–5.',
      ],
    }
  }
  if (cl === 'high') {
    return {
      tone: 'bad',
      title: 'Too much chlorine — wait',
      lines: [
        'Above 5 mg/L can irritate skin and eyes.',
        'Lid off, jets on, wait until it drops under 5.',
      ],
    }
  }
  if (p === 'low' || p === 'high') {
    return {
      tone: 'warn',
      title: 'Okay, but balance pH first',
      lines: [
        'Chlorine is fine, but pH is out of range and may sting or feel harsh.',
        'Nudge pH into 7.2–7.6 for comfort.',
      ],
    }
  }
  return {
    tone: 'good',
    title: "Water's in good shape",
    lines: ['Chlorine and pH are in a healthy range.'],
  }
}
