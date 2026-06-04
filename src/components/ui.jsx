import React from 'react'
import {
  Droplet, Droplets, Waves, FlaskConical, ShieldCheck, TriangleAlert, Check, X,
  Sun, Moon, Snowflake, Flame, Baby, ListChecks, RefreshCw, Sparkles,
  SlidersHorizontal, Settings2, Thermometer, Plus, Minus, Info, ArrowRight,
  CalendarDays, Trash2, Save, Beaker, CircleDot,
} from 'lucide-react'
import { daysSince } from '../lib/format.js'
import { WATER_CHANGE_DUE_DAYS } from '../lib/constants.js'

export const Icon = {
  drop: Droplet, drops: Droplets, waves: Waves, flask: FlaskConical, shield: ShieldCheck,
  warn: TriangleAlert, check: Check, x: X, sun: Sun, moon: Moon, snow: Snowflake, flame: Flame,
  baby: Baby, checks: ListChecks, refresh: RefreshCw, sparkles: Sparkles, sliders: SlidersHorizontal,
  settings: Settings2, temp: Thermometer, plus: Plus, minus: Minus, info: Info, arrow: ArrowRight,
  calendar: CalendarDays, trash: Trash2, save: Save, beaker: Beaker, dot: CircleDot,
}

// tone → the emblem icon used by verdict + child cards
export const toneIcon = (tone) => (tone === 'good' ? Check : tone === 'bad' ? X : TriangleAlert)

// Renders a "rich text" array: string = plain, { b } = bold accent, { m } = muted.
export function RichText({ parts }) {
  return (
    <>
      {parts.map((p, i) => {
        if (typeof p === 'string') return <React.Fragment key={i}>{p}</React.Fragment>
        if (p.b) return <strong key={i}>{p.b}</strong>
        if (p.m) return <span key={i} className="mut">{p.m}</span>
        return null
      })}
    </>
  )
}

export function GlassCard({ tone, className = '', children, ...rest }) {
  return (
    <div className={`glass${tone ? ` t-${tone}` : ''} ${className}`} {...rest}>
      {children}
    </div>
  )
}

export function Badge({ tone, children }) {
  return <span className={`badge t-${tone}`}>{children}</span>
}

export function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          className={value === o.value ? 'is-active' : ''}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function NumberField({ product, label, step = 1, value, onChange, hint }) {
  return (
    <div className="field">
      {product && <div className="field-prod">{product}</div>}
      <label>{label}</label>
      <input
        className="input"
        type="number"
        inputMode="decimal"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
      />
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}

export function Stepper({ value, min, max, onChange, format }) {
  return (
    <div className="stepper">
      <button aria-label="decrease" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={18} />
      </button>
      <span className="val">{format ? format(value) : value}</span>
      <button aria-label="increase" onClick={() => onChange(Math.min(max, value + 1))}>
        <Plus size={18} />
      </button>
    </div>
  )
}

export function WaterChange({ lastChange, onMark }) {
  const d = daysSince(lastChange)
  const due = d != null && d >= WATER_CHANGE_DUE_DAYS
  const tone = due ? 'bad' : 'petrol'
  const pct = d == null ? 0 : Math.min(100, (d / WATER_CHANGE_DUE_DAYS) * 100)
  return (
    <div className={`glass wc t-${tone}`}>
      <div className="ring" style={{ '--p': pct }}>
        <i>{d == null ? '—' : d}</i>
      </div>
      <div style={{ flex: 1 }}>
        <div className="wc-big">
          {d == null ? 'Water change not logged' : `${d} ${d === 1 ? 'day' : 'days'} since fresh water`}
        </div>
        <div className="muted" style={{ fontSize: 13 }}>
          {due ? 'Time to drain & refill' : 'Aim for every 1–2 months'}
        </div>
      </div>
      <button className="btn btn-tone btn-sm t-petrol" onClick={onMark}>
        <Droplet size={16} /> Changed today
      </button>
    </div>
  )
}
