import React, { useState, useEffect } from 'react'
import { GlassCard, RichText, Icon } from '../components/ui.jsx'
import EventItem from '../components/EventItem.jsx'
import { PRODUCTS } from '../lib/constants.js'
import { recentByType } from '../lib/events.js'
import { dateTime } from '../lib/format.js'

export default function FreshFillTab({ ctx }) {
  const { doses, addRefill, events, goTo } = ctx
  const P = PRODUCTS

  const [flash, setFlash] = useState(null)
  useEffect(() => {
    if (!flash) return undefined
    const t = setTimeout(() => setFlash(null), 5000)
    return () => clearTimeout(t)
  }, [flash])
  const onLog = () => setFlash(addRefill())

  const refills = recentByType(events, 'refill', 5)

  const steps = [
    { title: 'Fill & warm up', body: ['Fill to the line, run the pump, let it warm. Chemicals dissolve and react better in warm water.'] },
    { title: 'Test everything', body: ['Read alkalinity, pH and chlorine so you know your starting point.'] },
    {
      title: 'Alkalinity into 80–120 mg/L',
      body: ['Add ', { b: P.alkUp }, ' (~15 g / 1000 L per addition) ', { b: 'straight into the water' }, ', not the dispenser. Circulate 30+ min, re-test. Do this first — it stabilises pH.'],
    },
    {
      title: 'pH into 7.2–7.6',
      body: ['Use ', { b: P.phUp }, ' / ', { b: P.phDown }, ' (~100 g / 10 m³ ≈ 0.1 pH). Dissolve in a watering can, circulate, re-test.'],
    },
    {
      title: 'Chlorine to 3–5 mg/L',
      body: ['Add ', { b: `~${doses.freshCl} g ${P.chlorineShock}` }, ' (start dose 1 tbsp / 1000 L) and put a tablet in the ChemConnect dispenser. Lid off 20–30 min after.'],
    },
    {
      title: 'Optional extras',
      body: ['Hard water? ', { b: `~${doses.scale} ml ${P.scale}` }, ' straight into the water. Want it clear? First-dose ', { b: `~${doses.clarStart} ml ${P.clarifier}` }, '.'],
    },
    { title: 'Wait, then enter', body: ['Only get in once chlorine has settled to 3–5 and pH is in range. With your child: supervise closely; she may get cold if she stays in long.'] },
  ]

  return (
    <div className="stack tab-enter">
      <div className="section-title"><Icon.refresh size={18} /> Fresh fill — rebalance order</div>
      <div className="glass card muted">
        Balancing a fresh fill, in order. After each chemical: run the pump, wait, re-test. Don't rush to the next step.
      </div>

      {steps.map((s, i) => (
        <GlassCard key={i} tone="petrol" className="step">
          <div className="step-num">{i + 1}</div>
          <div>
            <div className="step-title">{s.title}</div>
            <div className="step-body"><RichText parts={s.body} /></div>
          </div>
        </GlassCard>
      ))}

      <button className="btn btn-primary btn-block" onClick={onLog}>
        <Icon.drop size={18} /> I just did a fresh refill — log it
      </button>

      {flash && (
        <div className="inline-note t-good">
          <span className="ic"><Icon.check size={18} /></span>
          <span>
            <strong>Fresh water logged</strong> · {dateTime(flash.at)}. The change counter resets.{' '}
            <button className="link-btn" onClick={() => goTo('history')}>View in History →</button>
          </span>
        </div>
      )}

      {/* ---- recent refills ---- */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginTop: 4 }}>
        <div className="section-title" style={{ margin: 0 }}><Icon.history size={18} /> Recent refills</div>
        {refills.length > 0 && <button className="link-btn" onClick={() => goTo('history')}>See all →</button>}
      </div>
      {refills.length === 0 ? (
        <div className="glass card muted">No refills logged yet. When you change the water, tap the button above.</div>
      ) : (
        refills.map((e) => <EventItem key={e.id} event={e} />)
      )}
    </div>
  )
}
