import React from 'react'
import { BANDS, SWATCHES, labelFor } from '../lib/strips.js'
import { STATUS_FN, STATUS } from '../lib/chemistry.js'
import { GlassCard, Badge, Icon } from './ui.jsx'

// One test-strip pad: a title, a status pill, and a row of tappable colour bands.
// Tapping the selected band again clears the reading.
export default function StripPad({ pad, value, onPick }) {
  const bands = BANDS[pad.key]
  const swatches = SWATCHES[pad.key]
  const statusFn = STATUS_FN[pad.key]
  const st = statusFn ? statusFn(value) : null
  const meta = st ? STATUS[st] : null

  return (
    <GlassCard className="card">
      <div className="pad-head">
        <div>
          <div className="pad-title">{pad.title}</div>
          <div className="pad-sub">{pad.subtitle}</div>
        </div>
        {meta && <Badge tone={meta.tone}>{meta.word}</Badge>}
      </div>
      <div className="bands">
        {bands.map((b, i) => {
          const sel = value === b
          return (
            <button
              key={i}
              className={`band${sel ? ' is-sel' : ''}`}
              aria-pressed={sel}
              aria-label={`${pad.title}: ${labelFor(pad.key, b)}`}
              onClick={() => onPick(sel ? null : b)}
            >
              <span className="swatch" style={{ background: swatches[i] }}>
                <Icon.check className="check" size={18} />
              </span>
              <span className="blabel">{labelFor(pad.key, b)}</span>
            </button>
          )
        })}
      </div>
    </GlassCard>
  )
}
