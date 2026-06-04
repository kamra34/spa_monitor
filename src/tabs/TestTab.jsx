import React from 'react'
import StripPad from '../components/StripPad.jsx'
import { GlassCard, Segmented, WaterChange, Stepper, RichText, Icon, toneIcon } from '../components/ui.jsx'
import { PADS_CORE, PADS_EXTRA, FIELD } from '../lib/strips.js'
import { combinedChlorine, COMBINED_CL_THRESHOLD } from '../lib/chemistry.js'
import { entryVerdict } from '../lib/verdict.js'
import { buildPlan, hasAnyReading } from '../lib/plan.js'
import { childGuide, TEMP_MIN, TEMP_MAX } from '../lib/childGuide.js'
import { shortDate } from '../lib/format.js'

export default function TestTab({ ctx }) {
  const { settings, setSetting, readings, setReading, clearReadings, saveReading, appState, markChange } = ctx
  const childOpen = settings.childMode
  const cc = combinedChlorine(readings.fc, readings.totalCl)
  const verdict = entryVerdict(readings.fc, readings.ph)
  const VIcon = toneIcon(verdict.tone)
  const plan = buildPlan(readings, settings)
  const anyReading = hasAnyReading(readings)

  const padView = (p) => (
    <StripPad key={p.key} pad={p} value={readings[FIELD[p.key]]} onPick={(v) => setReading(FIELD[p.key], v)} />
  )

  return (
    <div className="stack tab-enter">
      <WaterChange lastChange={appState.lastChange} onMark={markChange} />

      <div className="glass card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div className="section-title" style={{ margin: 0 }}><Icon.flask size={18} /> Test strip</div>
          <Segmented
            value={settings.strip}
            onChange={(v) => setSetting('strip', v)}
            options={[{ value: '3', label: '3-in-1' }, { value: '7', label: '7-in-1' }]}
          />
        </div>
        <div className="muted" style={{ fontSize: 12.5 }}>
          Tap the colour each pad shows. Readings are in mg/L (the same number as ppm).
        </div>
      </div>

      {PADS_CORE.map(padView)}

      {settings.strip === '7' && (
        <>
          <div className="divider-label">Extra pads (7-in-1)</div>
          {PADS_EXTRA.map(padView)}
          {cc != null && (
            <div className={`inline-note t-${cc > COMBINED_CL_THRESHOLD ? 'warn' : 'good'}`}>
              <span className="ic">{cc > COMBINED_CL_THRESHOLD ? <Icon.warn size={18} /> : <Icon.check size={18} />}</span>
              <span>
                <strong>Combined chlorine ≈ {cc} mg/L</strong> —{' '}
                {cc > COMBINED_CL_THRESHOLD ? 'chloramines building; a shock is in the plan below.' : "low, the water's fresh."}
              </span>
            </div>
          )}
          <div className="inline-note t-petrol">
            <span className="ic"><Icon.info size={18} /></span>
            <span><strong>Bromine pad:</strong> ignore it — you sanitise with chlorine, so it doesn't apply.</span>
          </div>
        </>
      )}

      <div className="btn-row">
        <button className="btn btn-primary btn-block" onClick={saveReading}><Icon.save size={18} /> Save this reading</button>
        <button className="btn btn-ghost btn-sm" onClick={clearReadings}><Icon.trash size={16} /> Clear</button>
      </div>

      {/* ---- ordered action plan ---- */}
      <div className="section-title"><Icon.sparkles size={18} /> What to do, in order</div>
      {!anyReading ? (
        <div className="glass card muted">Enter your readings above and a step-by-step plan will appear here.</div>
      ) : plan.length === 0 ? (
        <div className="glass card t-good" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span className="icon-badge"><Icon.check size={20} /></span>
          <span>Nothing to add — your water's balanced. Check the entry verdict below.</span>
        </div>
      ) : (
        plan.map((s, i) => (
          <GlassCard key={s.id} tone={s.tone} className="step">
            <div className="step-num">{i + 1}</div>
            <div>
              <div className="step-title">{s.title}</div>
              <div className="step-body"><RichText parts={s.body} /></div>
            </div>
          </GlassCard>
        ))
      )}

      {/* ---- entry verdict ---- */}
      <GlassCard tone={verdict.tone} className="verdict">
        <div className="kicker">Can we get in?</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 10 }}>
          <div className={`verdict-emblem${verdict.tone === 'good' ? ' pulse' : ''}`}><VIcon size={30} /></div>
          <div className="verdict-title">{verdict.title}</div>
        </div>
        <div style={{ marginTop: 10 }}>
          {verdict.lines.map((l, i) => <div className="verdict-line" key={i}>{l}</div>)}
        </div>
        <button
          className={`btn btn-block ${childOpen ? 'btn-tone t-petrol' : 'btn-ghost'}`}
          style={{ marginTop: 14 }}
          onClick={() => setSetting('childMode', !childOpen)}
        >
          <Icon.baby size={18} /> {childOpen ? 'Child mode ON — tap to hide' : 'Your child going in? Tap for child guidance'}
        </button>
      </GlassCard>

      {childOpen && <ChildCard temp={settings.temp} setTemp={(v) => setSetting('temp', v)} />}

      {/* ---- recent readings ---- */}
      {appState.log.length > 0 && (
        <GlassCard className="card">
          <div className="section-title"><Icon.calendar size={18} /> Recent readings (mg/L)</div>
          <div style={{ marginTop: 6 }}>
            {appState.log.map((e, i) => (
              <div className="read-row" key={i}>
                <span className="read-date">{shortDate(e.d)}</span>
                <span className="read-vals">
                  TA {e.ta ?? '–'} · pH {e.ph ?? '–'} · Cl {e.fc ?? '–'}{e.cya != null ? ` · Stab ${e.cya}` : ''}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  )
}

function ChildCard({ temp, setTemp }) {
  const g = childGuide(temp)
  const TempIcon = temp >= 38 ? Icon.flame : temp < 34 ? Icon.snow : Icon.flame
  return (
    <GlassCard tone={g.tone} className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div className="section-title" style={{ margin: 0 }}><Icon.baby size={18} /> Child guidance</div>
        <Stepper value={temp} min={TEMP_MIN} max={TEMP_MAX} onChange={setTemp} format={(v) => `${v}°C`} />
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', margin: '14px 0 10px' }}>
        <span className="icon-badge"><TempIcon size={20} /></span>
        <div className="step-title">{g.heading}</div>
      </div>
      <ul className="list">
        {g.points.map((pt, i) => (
          <li key={i}><span className="tick"><Icon.drop size={15} /></span><span><RichText parts={pt} /></span></li>
        ))}
      </ul>
    </GlassCard>
  )
}
