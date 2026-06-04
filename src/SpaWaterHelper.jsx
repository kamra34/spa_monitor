import React, { useState, useEffect, useRef, useMemo } from 'react'
import { subscribeOffline } from './storage.js'
import { DEFAULT_SETTINGS } from './lib/constants.js'
import {
  shockDose, dailyDose, scaleDose, clarifierStartDose, clarifierWeeklyDose,
  flushDose, freshFillChlorine, perUnit, chlorineToTarget,
} from './lib/dosing.js'
import { migrateState, makeReadingEvent, makeRefillEvent } from './lib/events.js'
import { Icon } from './components/ui.jsx'
import TestTab from './tabs/TestTab.jsx'
import RoutineTab from './tabs/RoutineTab.jsx'
import FreshFillTab from './tabs/FreshFillTab.jsx'
import DosesTab from './tabs/DosesTab.jsx'
import SetupTab from './tabs/SetupTab.jsx'
import HistoryTab from './tabs/HistoryTab.jsx'

const EMPTY_READINGS = { fc: null, ph: null, ta: null, totalCl: null, hardness: null, cya: null }

const TABS = [
  { id: 'test', label: 'Test', icon: Icon.flask, C: TestTab },
  { id: 'routine', label: 'Routine', icon: Icon.checks, C: RoutineTab },
  { id: 'fresh', label: 'Fresh', icon: Icon.refresh, C: FreshFillTab },
  { id: 'doses', label: 'Doses', icon: Icon.beaker, C: DosesTab },
  { id: 'setup', label: 'Setup', icon: Icon.settings, C: SetupTab },
  { id: 'history', label: 'History', icon: Icon.history, C: HistoryTab },
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
  const [log, setLog] = useState({ events: [] })
  const [tab, setTab] = useState('test')
  const [offline, setOffline] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('spaHelper:theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    } catch { return 'light' }
  })
  const ready = useRef(false)
  const syncingRef = useRef(false)
  const lastSettingsRaw = useRef(null)
  const lastStateRaw = useRef(null)

  // Pull the latest from the cloud into state. Safe to call any time: when online it
  // reads the server, when offline window.storage falls back to the localStorage mirror
  // (so a stale server can never clobber unsynced local data). Only applies values that
  // actually changed, so a single-device re-sync is a no-op.
  const syncFromCloud = async () => {
    if (syncingRef.current) return
    syncingRef.current = true
    setSyncing(true)
    try {
      const [s, st] = await Promise.all([
        window.storage.get('spa:settings'),
        window.storage.get('spa:state'),
      ])
      if (s?.value && s.value !== lastSettingsRaw.current) {
        lastSettingsRaw.current = s.value
        try { setSettings(normalizeSettings(JSON.parse(s.value))) } catch { /* keep current */ }
      }
      if (st?.value && st.value !== lastStateRaw.current) {
        lastStateRaw.current = st.value
        try { setLog(migrateState(JSON.parse(st.value))) } catch { /* keep current */ }
      }
    } finally {
      ready.current = true // only persist AFTER the first load (don't clobber cloud with defaults)
      syncingRef.current = false
      setSyncing(false)
    }
  }

  // Initial load + re-sync whenever the app returns to the foreground. On an iOS home-screen
  // app there's no pull-to-refresh, so this keeps data fresh when you reopen it.
  useEffect(() => {
    syncFromCloud()
    const onForeground = () => { if (document.visibilityState === 'visible') syncFromCloud() }
    document.addEventListener('visibilitychange', onForeground)
    window.addEventListener('pageshow', onForeground)
    return () => {
      document.removeEventListener('visibilitychange', onForeground)
      window.removeEventListener('pageshow', onForeground)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!ready.current) return
    const raw = JSON.stringify(settings)
    lastSettingsRaw.current = raw
    window.storage.set('spa:settings', raw)
  }, [settings])
  useEffect(() => {
    if (!ready.current) return
    const raw = JSON.stringify(log)
    lastStateRaw.current = raw
    window.storage.set('spa:state', raw)
  }, [log])
  useEffect(() => subscribeOffline(setOffline), [])
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('spaHelper:theme', theme) } catch { /* ignore */ }
  }, [theme])

  // Refresh button: when online, a full reload (also picks up a new app version, the
  // closest thing to "close & reopen"). When offline, a soft re-sync that can't blank the
  // screen — it just re-reads the on-device data.
  const refresh = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) { syncFromCloud(); return }
    window.location.reload()
  }

  const setSetting = (key, val) => setSettings((s) => ({ ...s, [key]: val }))
  const setReading = (field, val) => setReadings((r) => ({ ...r, [field]: val }))
  const clearReadings = () => setReadings(EMPTY_READINGS)

  const addReading = (reading, strip) => {
    const ev = makeReadingEvent(reading, strip)
    setLog((s) => ({ events: [ev, ...s.events] }))
    return ev
  }
  const addRefill = () => {
    const ev = makeRefillEvent()
    setLog((s) => ({ events: [ev, ...s.events] }))
    return ev
  }
  const updateEvent = (id, patch) => setLog((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) }))
  const deleteEvent = (id) => setLog((s) => ({ events: s.events.filter((e) => e.id !== id) }))

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

  const ctx = {
    settings, setSetting, readings, setReading, clearReadings, doses,
    events: log.events, addReading, addRefill, updateEvent, deleteEvent, goTo: setTab,
  }
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="iconbtn" aria-label="Refresh" title="Refresh" onClick={refresh}>
                  <Icon.sync size={19} className={syncing ? 'spin' : undefined} />
                </button>
                <button
                  className="iconbtn"
                  aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                  onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                >
                  {theme === 'dark' ? <Icon.sun size={20} /> : <Icon.moon size={20} />}
                </button>
              </div>
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
                <I size={20} />
                {t.label}
              </button>
            )
          })}
        </div>
      </nav>
    </>
  )
}
