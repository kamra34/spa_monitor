import React, { useState, useEffect, useRef, useMemo } from 'react'
import { subscribeOffline } from './storage.js'
import { DEFAULT_SETTINGS, DEFAULT_STATE, LOG_LIMIT } from './lib/constants.js'
import {
  shockDose, dailyDose, scaleDose, clarifierStartDose, clarifierWeeklyDose,
  flushDose, freshFillChlorine, perUnit, chlorineToTarget,
} from './lib/dosing.js'
import { hasAnyReading } from './lib/plan.js'
import { Icon } from './components/ui.jsx'
import TestTab from './tabs/TestTab.jsx'
import RoutineTab from './tabs/RoutineTab.jsx'
import FreshFillTab from './tabs/FreshFillTab.jsx'
import DosesTab from './tabs/DosesTab.jsx'
import SetupTab from './tabs/SetupTab.jsx'

const EMPTY_READINGS = { fc: null, ph: null, ta: null, totalCl: null, hardness: null, cya: null }
const nowISO = () => new Date().toISOString()

const TABS = [
  { id: 'test', label: 'Test & fix', icon: Icon.flask, C: TestTab },
  { id: 'routine', label: 'Routine', icon: Icon.checks, C: RoutineTab },
  { id: 'fresh', label: 'Fresh fill', icon: Icon.refresh, C: FreshFillTab },
  { id: 'doses', label: 'Doses', icon: Icon.beaker, C: DosesTab },
  { id: 'setup', label: 'Setup', icon: Icon.settings, C: SetupTab },
]

function normalizeSettings(o) {
  const s = { ...DEFAULT_SETTINGS, ...o }
  s.strip = o.strip === '7' || o.strip === '3' ? o.strip : DEFAULT_SETTINGS.strip
  s.childMode = !!o.childMode
  s.volume = o.volume ?? DEFAULT_SETTINGS.volume
  s.temp = o.temp ?? DEFAULT_SETTINGS.temp
  s.targetFC = o.targetFC ?? DEFAULT_SETTINGS.targetFC
  return s
}

export default function SpaWaterHelper() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [readings, setReadings] = useState(EMPTY_READINGS)
  const [appState, setAppState] = useState(DEFAULT_STATE)
  const [tab, setTab] = useState('test')
  const [offline, setOffline] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('spaHelper:theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })
  const ready = useRef(false)

  // Load once from the cloud (with localStorage mirror fallback inside window.storage).
  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [s, st] = await Promise.all([
          window.storage.get('spa:settings'),
          window.storage.get('spa:state'),
        ])
        if (!alive) return
        if (s?.value) { try { setSettings(normalizeSettings(JSON.parse(s.value))) } catch { /* keep defaults */ } }
        if (st?.value) {
          try {
            const o = JSON.parse(st.value)
            setAppState({
              lastChange: o.lastChange ?? null,
              lastTest: o.lastTest ?? null,
              log: Array.isArray(o.log) ? o.log : [],
            })
          } catch { /* keep defaults */ }
        }
      } finally {
        ready.current = true // only persist AFTER the initial load (don't clobber cloud with defaults)
      }
    })()
    return () => { alive = false }
  }, [])

  useEffect(() => { if (ready.current) window.storage.set('spa:settings', JSON.stringify(settings)) }, [settings])
  useEffect(() => { if (ready.current) window.storage.set('spa:state', JSON.stringify(appState)) }, [appState])
  useEffect(() => subscribeOffline(setOffline), [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('spaHelper:theme', theme) } catch { /* ignore */ }
  }, [theme])

  const setSetting = (key, val) => setSettings((s) => ({ ...s, [key]: val }))
  const setReading = (field, val) => setReadings((r) => ({ ...r, [field]: val }))
  const clearReadings = () => setReadings(EMPTY_READINGS)
  const markChange = () => setAppState((s) => ({ ...s, lastChange: nowISO() }))
  const saveReading = () => {
    if (!hasAnyReading(readings)) return
    const entry = { d: nowISO(), fc: readings.fc, ph: readings.ph, ta: readings.ta, cya: readings.cya }
    setAppState((s) => ({ ...s, lastTest: nowISO(), log: [entry, ...s.log].slice(0, LOG_LIMIT) }))
  }

  const doses = useMemo(() => ({
    shock: shockDose(settings.fcShock, settings.volume),
    daily: dailyDose(settings.fcDaily, settings.volume),
    scale: scaleDose(settings.scaleRate, settings.volume),
    clarStart: clarifierStartDose(settings.clarStart, settings.volume),
    clarWeekly: clarifierWeeklyDose(settings.clarWeekly, settings.volume),
    flush: flushDose(settings.flushRate, settings.volume),
    freshCl: freshFillChlorine(settings.volume),
    fcPer: perUnit(settings.fcRate, settings.volume),
    taPer: perUnit(settings.taRate, settings.volume),
    phUpPer: perUnit(settings.phUpRate, settings.volume),
    phDownPer: perUnit(settings.phDownRate, settings.volume),
    clToTarget: chlorineToTarget(readings.fc, settings.targetFC, settings.fcRate, settings.volume),
  }), [settings, readings.fc])

  const ctx = { settings, setSetting, readings, setReading, clearReadings, saveReading, appState, markChange, doses }
  const ActiveTab = TABS.find((t) => t.id === tab).C

  return (
    <>
      <div className="app-bg" />
      <div className="shell">
        <header className="appbar">
          <div className="container">
            <div className="appbar-row">
              <div className="brand-mark"><Icon.waves size={22} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="eyebrow">Lay-Z-Spa Helsinki · {settings.volume} L</div>
                <h1 className="app-title">Water care helper</h1>
              </div>
              <button
                className="iconbtn"
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              >
                {theme === 'dark' ? <Icon.sun size={20} /> : <Icon.moon size={20} />}
              </button>
            </div>
            <div className="app-sub">Test → follow the steps in order → re-test.</div>
          </div>
        </header>

        <main className="content">
          <div className="container">
            <ActiveTab key={tab} ctx={ctx} />
          </div>
        </main>
      </div>

      {offline && (
        <div className="offline">
          <Icon.info size={15} /> Cloud not connected — changes saved on this device only.
        </div>
      )}

      <nav className="tabbar">
        <div className="tabbar-inner">
          {TABS.map((t) => {
            const I = t.icon
            return (
              <button
                key={t.id}
                className={`tab${tab === t.id ? ' is-active' : ''}`}
                aria-current={tab === t.id}
                onClick={() => setTab(t.id)}
              >
                <I size={21} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
