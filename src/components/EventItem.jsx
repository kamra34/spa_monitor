import React, { useState } from 'react'
import { GlassCard, NumberField, Segmented, Icon } from './ui.jsx'
import { STRIP_LABEL, readingSummary, scopeReading } from '../lib/events.js'
import { dateTime, toLocalInput, fromLocalInput } from '../lib/format.js'

// One activity-log entry. Read-only by default; pass editable + onUpdate/onDelete to
// allow inline editing and deletion (used on the History tab).
export default function EventItem({ event, editable = false, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const isRefill = event.type === 'refill'

  if (editing) {
    const onSave = (patch) => { onUpdate(event.id, patch); setEditing(false) }
    const Editor = isRefill ? RefillEditor : ReadingEditor
    return <Editor event={event} onSave={onSave} onCancel={() => setEditing(false)} />
  }

  return (
    <GlassCard className="card-tight" tone={isRefill ? 'petrol' : undefined}>
      <div className="ev-row">
        <span className="icon-badge t-petrol">{isRefill ? <Icon.refresh size={18} /> : <Icon.flask size={18} />}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="ev-head">
            <span className="ev-title">{isRefill ? 'Fresh water change' : 'Test reading'}</span>
            {!isRefill && <span className="chip">{STRIP_LABEL[event.strip] || 'strip ?'}</span>}
          </div>
          <div className="ev-meta"><Icon.clock size={12} /> {dateTime(event.at)}</div>
          <div className="ev-summary">{isRefill ? (event.note || 'Drained, refilled & rebalanced.') : readingSummary(event)}</div>
        </div>
      </div>
      {editable && (
        <div className="ev-actions">
          {confirmDel ? (
            <>
              <span className="muted" style={{ fontSize: 12.5, marginRight: 'auto' }}>Delete this entry?</span>
              <button className="btn btn-sm btn-tone t-bad" onClick={() => onDelete(event.id)}>Yes, delete</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(false)}>No</button>
            </>
          ) : (
            <>
              <button className="btn btn-sm btn-ghost" style={{ marginLeft: 'auto' }} onClick={() => setEditing(true)}><Icon.edit size={15} /> Edit</button>
              <button className="btn btn-sm btn-ghost" onClick={() => setConfirmDel(true)}><Icon.trash size={15} /> Delete</button>
            </>
          )}
        </div>
      )}
    </GlassCard>
  )
}

function ReadingEditor({ event, onSave, onCancel }) {
  const [strip, setStrip] = useState(event.strip === '7' ? '7' : '3')
  const [vals, setVals] = useState({ fc: event.fc, ph: event.ph, ta: event.ta, totalCl: event.totalCl, hardness: event.hardness, cya: event.cya })
  const [at, setAt] = useState(toLocalInput(event.at))
  const set = (k) => (v) => setVals((s) => ({ ...s, [k]: v }))

  return (
    <GlassCard className="card stack">
      <div className="ev-title">Edit reading</div>
      <Segmented value={strip} onChange={setStrip} options={[{ value: '3', label: '3-in-1' }, { value: '7', label: '7-in-1' }]} />
      <div className="edit-grid">
        <NumberField label="Alkalinity" step={1} value={vals.ta} onChange={set('ta')} />
        <NumberField label="pH" step={0.1} value={vals.ph} onChange={set('ph')} />
        <NumberField label="Free chlorine" step={0.5} value={vals.fc} onChange={set('fc')} />
        {strip === '7' && <NumberField label="Total chlorine" step={0.5} value={vals.totalCl} onChange={set('totalCl')} />}
        {strip === '7' && <NumberField label="Stabiliser (CYA)" step={1} value={vals.cya} onChange={set('cya')} />}
        {strip === '7' && <NumberField label="Hardness" step={1} value={vals.hardness} onChange={set('hardness')} />}
      </div>
      <div className="field">
        <label>Date &amp; time</label>
        <input className="input" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      </div>
      <div className="btn-row">
        <button className="btn btn-primary btn-block" onClick={() => onSave({ strip, at: fromLocalInput(at) || event.at, ...scopeReading(vals, strip) })}>
          <Icon.check size={16} /> Save changes
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </GlassCard>
  )
}

function RefillEditor({ event, onSave, onCancel }) {
  const [at, setAt] = useState(toLocalInput(event.at))
  const [note, setNote] = useState(event.note || '')
  return (
    <GlassCard className="card stack" tone="petrol">
      <div className="ev-title">Edit refill</div>
      <div className="field">
        <label>Date &amp; time</label>
        <input className="input" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      </div>
      <div className="field">
        <label>Note (optional)</label>
        <input className="input" type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. swapped the filter too" />
      </div>
      <div className="btn-row">
        <button className="btn btn-primary btn-block" onClick={() => onSave({ at: fromLocalInput(at) || event.at, note })}>
          <Icon.check size={16} /> Save changes
        </button>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </GlassCard>
  )
}
