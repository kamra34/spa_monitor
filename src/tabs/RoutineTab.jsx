import React from 'react'
import { GlassCard, Icon } from '../components/ui.jsx'

const Item = ({ children }) => (
  <li><span className="tick"><Icon.check size={15} /></span><span>{children}</span></li>
)

function Section({ icon, title, children }) {
  return (
    <GlassCard className="card">
      <div className="section-title">{icon} {title}</div>
      <ul className="list" style={{ marginTop: 12 }}>{children}</ul>
    </GlassCard>
  )
}

export default function RoutineTab({ ctx }) {
  const { doses } = ctx
  return (
    <div className="stack tab-enter">
      <Section icon={<Icon.sun size={18} />} title="Before each use">
        <Item>Quick-test chlorine &amp; pH.</Item>
        <Item>Chlorine should read 3–5 mg/L; pH 7.2–7.6.</Item>
        <Item>With your child: supervise within arm's reach, and don't let her drink the water.</Item>
      </Section>

      <Section icon={<Icon.drop size={18} />} title="Daily baseline">
        <Item>Keep a tablet in the ChemConnect dispenser, or add ~{doses.daily} g Snabbklor (½ tbsp) per day.</Item>
        <Item>Test and top up to keep chlorine in range.</Item>
      </Section>

      <Section icon={<Icon.calendar size={18} />} title="Weekly">
        <Item>Test alkalinity too; rebalance if it's drifting.</Item>
        <Item>On the 7-in-1, glance at the stabiliser pad — drain when it climbs over ~50.</Item>
        <Item>Kalkkontroll: ~{doses.scale} ml, <strong>straight into the water</strong> (never the dispenser/skimmer).</Item>
        <Item>If cloudy, clarifier: ~{doses.clarWeekly} ml (first-ever dose ~{doses.clarStart} ml).</Item>
        <Item>Rinse the filter cartridge; wipe the waterline.</Item>
      </Section>

      <Section icon={<Icon.refresh size={18} />} title="Every 1–2 months">
        <Item>Before draining, circulate ~{doses.flush} ml Rörcleaner for ≥30 min <strong>(corrosive — handle with care)</strong>.</Item>
        <Item>Drain, wipe down, refill, then rebalance from scratch (see Fresh fill).</Item>
        <Item>Swap in a fresh filter cartridge (type VI).</Item>
      </Section>

      <div className="inline-note t-petrol">
        <span className="ic"><Icon.info size={18} /></span>
        <span>
          <strong>Why watch the stabiliser?</strong> Your Snabbklor and tablets are stabilised chlorine, so
          cyanuric acid slowly builds up — and a small warm tub concentrates it fast. Once high, chlorine stops
          working and fresh water is the only fix. The 7-in-1's stabiliser pad is your early warning.
        </span>
      </div>
    </div>
  )
}
