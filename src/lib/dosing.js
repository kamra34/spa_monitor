// Dose calculators. Every dose scales by volume/1000 and rounds to a whole gram/ml,
// clamped at 0. Rates are the editable defaults from constants.js (CLAUDE.md §4).
// Locked by dosing.test.js.

export const roundDose = (x) => (x <= 0 ? 0 : Math.round(x))
const per1000 = (volume) => volume / 1000

// Raise alkalinity toward ~100 (step of 10 mg/L).
export function raiseAlkalinity(ta, taRate, volume) {
  if (ta == null || ta >= 80) return 0
  return roundDose(((100 - ta) / 10) * taRate * per1000(volume))
}

// Raise free chlorine up to the target.
export function chlorineToTarget(fc, targetFC, fcRate, volume) {
  if (fc == null || fc >= targetFC) return 0
  return roundDose((targetFC - fc) * fcRate * per1000(volume))
}

// pH always targets the 7.4 midpoint; 0.1 pH per step.
export function raisePH(ph, phUpRate, volume) {
  if (ph == null || ph >= 7.2) return 0
  return roundDose(((7.4 - ph) / 0.1) * phUpRate * per1000(volume))
}

export function lowerPH(ph, phDownRate, volume) {
  if (ph == null || ph <= 7.6) return 0
  return roundDose(((ph - 7.4) / 0.1) * phDownRate * per1000(volume))
}

export const shockDose = (fcShock, volume) => roundDose(fcShock * per1000(volume))
export const dailyDose = (fcDaily, volume) => roundDose(fcDaily * per1000(volume))
export const scaleDose = (scaleRate, volume) => roundDose(scaleRate * per1000(volume))
export const clarifierStartDose = (clarStart, volume) => roundDose(clarStart * per1000(volume))
export const clarifierWeeklyDose = (clarWeekly, volume) => roundDose(clarWeekly * per1000(volume))
export const flushDose = (flushRate, volume) => roundDose(flushRate * per1000(volume))

// Fresh fill uses a fixed 15 g / 1000 L start dose (not the upkeep/shock rates).
export const freshFillChlorine = (volume) => roundDose(15 * per1000(volume))

// Generic "per X" hint used in the Doses tab.
export const perUnit = (rate, volume) => roundDose(rate * per1000(volume))
