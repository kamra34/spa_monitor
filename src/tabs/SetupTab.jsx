import React from 'react'
import { GlassCard, NumberField, Icon } from '../components/ui.jsx'
import { PRODUCTS } from '../lib/constants.js'

export default function SetupTab({ ctx }) {
  const { settings, setSetting } = ctx
  return (
    <div className="stack tab-enter">
      <div className="section-title"><Icon.settings size={18} /> Setup</div>

      <GlassCard className="card stack">
        <NumberField label="Water volume (litres)" step={1} value={settings.volume}
          onChange={(v) => setSetting('volume', v)} hint="Every dose scales to this." />
        <hr className="hairline" />
        <NumberField label="Usual water temperature (°C)" step={1} value={settings.temp}
          onChange={(v) => setSetting('temp', v)} hint="Drives the child-mode guidance. ~31°C = warm play, not hot-tub heat." />
      </GlassCard>

      <GlassCard className="card">
        <div className="section-title"><Icon.drops size={18} /> Your products</div>
        <div style={{ marginTop: 10 }}>
          {Object.values(PRODUCTS).map((p) => (
            <div className="prod-row" key={p}><span className="dot" />{p}</div>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
          Edit dosing amounts in the <strong>Doses</strong> tab. The 7-in-1 strip adds a stabiliser pad — your cue for when to drain.
        </div>
      </GlassCard>

      <div className="muted" style={{ fontSize: 12, lineHeight: 1.5, padding: '4px 6px 8px' }}>
        Estimates for guidance only — always follow each product's label, and treat the entry checks as a guide, not
        medical advice. Store all chemicals locked away from children. If anyone is pregnant or has a heart condition,
        check with a doctor before hot-tub use.
      </div>
    </div>
  )
}
