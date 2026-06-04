import React from 'react'
import { GlassCard, NumberField, Icon } from '../components/ui.jsx'

export default function DosesTab({ ctx }) {
  const { settings, setSetting, doses, readings } = ctx
  const V = settings.volume
  const set = (k) => (v) => setSetting(k, v)

  const clHint = readings.fc != null && readings.fc < settings.targetFC
    ? `→ ~${doses.clToTarget} g now (to reach ${settings.targetFC})`
    : `→ ~${doses.fcPer} g per 1 mg/L in your ${V} L`

  return (
    <div className="stack tab-enter">
      <div className="section-title"><Icon.beaker size={18} /> Doses</div>
      <div className="inline-note t-petrol">
        <span className="ic"><Icon.info size={18} /></span>
        <span>
          Pre-filled from your product labels. <strong>Alkalinity &amp; pH</strong> use the manufacturers' stated
          rates; the <strong>chlorine</strong> per-mg/L is derived (the label gives doses, not a ppm rate). Edit any
          field if you switch products — it saves automatically and the plan recalculates.
        </span>
      </div>

      <GlassCard className="card">
        <NumberField
          label="Chlorine target (mg/L)" step={0.5} value={settings.targetFC} onChange={set('targetFC')}
          hint="Label range is 1–3; default 3 gives a margin for warm child-use. Set to 2 to follow the label midpoint."
        />
      </GlassCard>

      <GlassCard className="card stack">
        <NumberField product="Snabbklor" label="g per 1 mg/L rise, per 1000 L" step={0.1}
          value={settings.fcRate} onChange={set('fcRate')} hint={clHint} />
        <hr className="hairline" />
        <NumberField product="Snabbklor — shock" label="g per 1000 L (chloramine shock)" step={1}
          value={settings.fcShock} onChange={set('fcShock')} hint={`→ ~${doses.shock} g for your ${V} L`} />
        <hr className="hairline" />
        <NumberField product="Snabbklor — daily" label="g per 1000 L (daily upkeep)" step={0.5}
          value={settings.fcDaily} onChange={set('fcDaily')} hint={`→ ~${doses.daily} g for your ${V} L`} />
      </GlassCard>

      <GlassCard className="card stack">
        <NumberField product="Höjer Alkalinitet" label="g per 10 mg/L rise, per 1000 L" step={1}
          value={settings.taRate} onChange={set('taRate')} hint={`→ ~${doses.taPer} g per 10 mg/L in your ${V} L`} />
        <hr className="hairline" />
        <NumberField product="Höjer pH" label="g per 0.1 pH rise, per 1000 L" step={1}
          value={settings.phUpRate} onChange={set('phUpRate')} hint={`→ ~${doses.phUpPer} g per 0.1 pH in your ${V} L`} />
        <hr className="hairline" />
        <NumberField product="Sänker pH" label="g per 0.1 pH drop, per 1000 L" step={1}
          value={settings.phDownRate} onChange={set('phDownRate')} hint={`→ ~${doses.phDownPer} g per 0.1 pH in your ${V} L`} />
      </GlassCard>

      <GlassCard className="card stack">
        <NumberField product="Kalkkontroll (liquid)" label="ml per 1000 L (weekly)" step={5}
          value={settings.scaleRate} onChange={set('scaleRate')}
          hint={`→ ~${doses.scale} ml for your ${V} L · into water only, not the dispenser`} />
        <hr className="hairline" />
        <NumberField product="Klarningsmedel — start" label="ml per 1000 L (first dose)" step={5}
          value={settings.clarStart} onChange={set('clarStart')} hint={`→ ~${doses.clarStart} ml for your ${V} L`} />
        <hr className="hairline" />
        <NumberField product="Klarningsmedel — weekly" label="ml per 1000 L (upkeep)" step={5}
          value={settings.clarWeekly} onChange={set('clarWeekly')} hint={`→ ~${doses.clarWeekly} ml for your ${V} L`} />
        <hr className="hairline" />
        <NumberField product="Rörcleaner (pre-drain)" label="ml per 1000 L" step={10}
          value={settings.flushRate} onChange={set('flushRate')} hint={`→ ~${doses.flush} ml · circulate ≥30 min before draining`} />
      </GlassCard>
    </div>
  )
}
