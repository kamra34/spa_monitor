// Child-safety guidance, branched on water temperature. Supervision/drowning is the
// message at EVERY temperature. Copy mirrors the original app exactly (CLAUDE.md §4).
// Points are "rich text" arrays: string = plain, { b } = bold.

export function childGuide(temp) {
  if (temp >= 38) {
    return {
      tone: 'bad',
      heading: "That's hot-tub warm for a child",
      points: [
        ['At this temperature a young child can ', { b: 'overheat quickly' }, '.'],
        ['Bring it down to about ', { b: '37°C or below' }, ' for her, and keep it brief (5–10 min).'],
        ['Health bodies advise under-5s avoid hot-tub-temperature water — a 5-year-old is right at that edge.'],
        ['Watch for flushed cheeks, dizziness or drowsiness — out straight away.'],
        [{ b: 'Never leave her alone' }, ', and she must keep her head above water.'],
      ],
    }
  }
  if (temp >= 34) {
    return {
      tone: 'warn',
      heading: "Comfortably warm — just don't let it climb",
      points: [
        ['Fine for play; keep it from rising toward hot-tub heat for her.'],
        [{ b: "Stay within arm's reach" }, ' the whole time — drowning is the real risk at any temperature.'],
        ['Keep chlorine balanced (3–5 mg/L) since she splashes and may swallow a little.'],
        ["Cover and secure the tub when you're done."],
      ],
    }
  }
  return {
    tone: 'good',
    heading: "Warm play — overheating isn't the worry here",
    points: [
      [`${temp}°C is warm-pool / bath range, not hot-tub heat, so the overheating warnings don't apply to how you use it.`],
      ['The rule that matters at any temperature: ', { b: "stay within arm's reach" }, ' — a child can get into trouble in shallow water silently and fast.'],
      ['Keep chlorine in the ', { b: '3–5 mg/L' }, " range so the water stays sanitary, and don't let her drink it."],
      ['She may get ', { b: 'cold' }, " if she's in a long while — watch for shivering and warm her up after."],
      ['Rinse her off afterwards; keep the cover on and secured when not in use.'],
    ],
  }
}

export const TEMP_MIN = 20
export const TEMP_MAX = 40
