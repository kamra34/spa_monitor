import React, { useState } from 'react'
import EventItem from '../components/EventItem.jsx'
import { GlassCard, Segmented, Icon } from '../components/ui.jsx'
import { sortedEvents } from '../lib/events.js'

export default function HistoryTab({ ctx }) {
  const { events, updateEvent, deleteEvent } = ctx
  const [filter, setFilter] = useState('all')
  const list = sortedEvents(events).filter((e) => (filter === 'all' ? true : e.type === filter))

  return (
    <div className="stack tab-enter">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
        <div className="section-title" style={{ margin: 0 }}><Icon.history size={18} /> History</div>
        <Segmented
          value={filter}
          onChange={setFilter}
          options={[{ value: 'all', label: 'All' }, { value: 'reading', label: 'Tests' }, { value: 'refill', label: 'Refills' }]}
        />
      </div>
      <div className="muted" style={{ fontSize: 12.5, margin: '-4px 2px 2px' }}>
        Every saved test and refill. Tap <strong>Edit</strong> to correct a value or date, or <strong>Delete</strong> to remove it.
      </div>

      {list.length === 0 ? (
        <GlassCard className="card muted">Nothing here yet — save a reading on the Test tab or log a refill on Fresh fill.</GlassCard>
      ) : (
        list.map((e) => <EventItem key={e.id} event={e} editable onUpdate={updateEvent} onDelete={deleteEvent} />)
      )}
    </div>
  )
}
