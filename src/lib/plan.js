// The ordered action plan. Enforces alkalinity → pH → chlorine, with the CYA>100
// drain short-circuit first, then chloramine shock and hardness. Copy and ordering
// mirror the original app exactly (CLAUDE.md §4). Locked by plan.test.js.
//
// Each step body is a "rich text" array: a string renders plain, { b } bold, { m } muted.
import {
  freeChlorineStatus, phStatus, alkalinityStatus, hardnessStatus,
  combinedChlorine, COMBINED_CL_THRESHOLD,
} from './chemistry.js'
import {
  raiseAlkalinity, chlorineToTarget, raisePH, lowerPH, scaleDose, shockDose,
} from './dosing.js'
import { PRODUCTS } from './constants.js'

// readings: { fc, ph, ta, totalCl, hardness, cya }   settings: DEFAULT_SETTINGS shape
export function buildPlan(readings, settings, products = PRODUCTS) {
  const r = readings
  const s = settings
  const P = products

  // CYA > 100 short-circuits everything — dosing old water is pointless.
  if (r.cya != null && r.cya > 100) {
    return [{
      id: 'drain', tone: 'bad', title: 'Drain & refill first',
      body: [
        "Stabiliser is over 100 — chlorine can't sanitise at this level, so adding chemicals now is wasted. Drain, refill, and rebalance on fresh water (",
        { b: 'Fresh fill' }, ' tab).',
      ],
    }]
  }

  const steps = []
  const taSt = alkalinityStatus(r.ta)
  const phSt = phStatus(r.ph)
  const fcSt = freeChlorineStatus(r.fc)
  const hSt = hardnessStatus(r.hardness)
  const combined = combinedChlorine(r.fc, r.totalCl)

  // 1) Alkalinity (buffers pH).
  if (taSt === 'low') {
    const g = raiseAlkalinity(r.ta, s.taRate, s.volume)
    steps.push({
      id: 'alk-up', tone: 'warn', title: 'Raise alkalinity',
      body: [
        'Add ', { b: `~${g} g ${P.alkUp}` },
        ' to reach ~100 — best in 2–3 portions ',
        { b: 'straight into the circulating water' },
        ' (never the dispenser or skimmer — reaction risk), re-testing between. ',
        { m: '(Label portion: ~15 g / 1000 L.)' },
      ],
    })
  } else if (taSt === 'high') {
    steps.push({
      id: 'alk-down', tone: 'warn', title: 'Lower alkalinity',
      body: [
        'Add a small dose of ', { b: P.phDown },
        ' (dry acid lowers alkalinity too), or dilute with fresh water. Re-test before pH.',
      ],
    })
  }

  // 2) pH (targets the 7.4 midpoint).
  if (phSt === 'low' || phSt === 'low-edge') {
    const g = raisePH(r.ph, s.phUpRate, s.volume)
    steps.push({
      id: 'ph-up', tone: 'warn', title: 'Raise pH',
      body: [
        'Add ', { b: `~${g} g ${P.phUp}` },
        ' (dissolve in a watering can, then sprinkle in). Circulate, re-test. ',
        { m: '(Label: ~100 g / 10 m³ ≈ 0.1 pH — approximate, so re-test.)' },
      ],
    })
  } else if (phSt === 'high' || phSt === 'high-edge') {
    const g = lowerPH(r.ph, s.phDownRate, s.volume)
    steps.push({
      id: 'ph-down', tone: 'warn', title: 'Lower pH',
      body: [
        'Add ', { b: `~${g} g ${P.phDown}` },
        ' (dissolve in a watering can, then sprinkle in). Circulate, re-test. ',
        { m: '(Label: ~100 g / 10 m³ ≈ 0.1 pH — also lowers alkalinity.)' },
      ],
    })
  }

  // 3) Chlorine.
  if (fcSt === 'none' || fcSt === 'low') {
    const g = chlorineToTarget(r.fc, s.targetFC, s.fcRate, s.volume)
    steps.push({
      id: 'cl-up', tone: 'bad', title: 'Raise chlorine',
      body: [
        'Add ', { b: `~${g} g ${P.chlorineShock}` },
        ' into the running water; leave the lid off 20–30 min after. Re-test. Keep a tablet in the dispenser for baseline. ',
        { b: 'No one in until it reads 3–5.' },
      ],
    })
  } else if (fcSt === 'high') {
    steps.push({
      id: 'cl-drop', tone: 'warn', title: 'Let chlorine drop',
      body: ["Don't add chlorine. Lid off, jets on, and wait until it falls under 5 before anyone gets in."],
    })
  }

  // 4) Chloramine shock (only when chlorine isn't already high).
  if (combined != null && combined > COMBINED_CL_THRESHOLD && fcSt !== 'high') {
    const g = shockDose(s.fcShock, s.volume)
    steps.push({
      id: 'shock', tone: 'warn', title: 'Shock out the chlorine smell',
      body: [
        `Combined chlorine ≈ ${combined} mg/L (chloramines). Add a shock dose of `,
        { b: `~${g} g ${P.chlorineShock}` },
        ' (label: 1 tbsp / 1000 L), lid off, run the pump, and wait until it falls to 3–5 before use.',
      ],
    })
  }

  // 5) Stabiliser climbing (50–100) — plan a change.
  if (r.cya != null && r.cya > 50 && r.cya <= 100) {
    steps.push({
      id: 'cya-soon', tone: 'warn', title: 'Plan a water change soon',
      body: [`Stabiliser is climbing (${r.cya} mg/L) — chlorine is getting less effective. Drain and refill within a week or two.`],
    })
  }

  // 6) Hardness.
  if (hSt === 'high-edge' || hSt === 'high') {
    const ml = scaleDose(s.scaleRate, s.volume)
    steps.push({
      id: 'hard', tone: 'warn', title: 'Tackle hard water',
      body: [
        'Add ', { b: `~${ml} ml ${P.scale}` }, ' ',
        { b: 'straight into the circulating water' },
        ' — never via the dispenser or skimmer (it can react). Or dilute with fresh water.',
      ],
    })
  }

  if (steps.length === 0) return []

  // Always close an actionable plan with a re-test reminder.
  steps.push({
    id: 'retest', tone: 'petrol', title: 'Re-test, then check entry',
    body: ['After your last addition, run the pump, wait, and re-test. When chlorine reads 3–5 and pH 7.2–7.6, see the verdict below.'],
  })
  return steps
}

// True when the user has entered at least one of the core readings.
export function hasAnyReading(r) {
  return [r.fc, r.ph, r.ta, r.totalCl, r.hardness, r.cya].some((v) => v != null)
}
