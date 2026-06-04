// window.storage — the key-value contract the app is built on (CLAUDE.md §6), over the
// /api/kv Postgres backend, with a localStorage MIRROR so it keeps working offline by
// the tub. Optional access token from a #token= URL fragment or localStorage.
//
// Offline state is observable via subscribeOffline() so the UI can show a banner in React.

const API = '/api/kv'
const TOKEN_KEY = 'spaHelper:token'
const MIRROR = 'spaHelperMirror:'

let offline = false
const listeners = new Set()

export function subscribeOffline(cb) {
  listeners.add(cb)
  cb(offline)
  return () => listeners.delete(cb)
}
function setOffline(v) {
  if (v === offline) return
  offline = v
  listeners.forEach((f) => f(v))
}

function readToken() {
  try {
    const m = (location.hash || '').match(/token=([^&]+)/)
    if (m) {
      localStorage.setItem(TOKEN_KEY, decodeURIComponent(m[1]))
      history.replaceState(null, '', location.pathname + location.search)
    }
  } catch { /* ignore */ }
  try { return localStorage.getItem(TOKEN_KEY) || '' } catch { return '' }
}

function headers(json) {
  const h = {}
  if (json) h['Content-Type'] = 'application/json'
  const t = readToken()
  if (t) h.Authorization = 'Bearer ' + t
  return h
}

// localStorage mirror helpers.
const mGet = (k) => { try { return localStorage.getItem(MIRROR + k) } catch { return null } }
const mSet = (k, v) => { try { localStorage.setItem(MIRROR + k, v) } catch { /* full/blocked */ } }
const mDel = (k) => { try { localStorage.removeItem(MIRROR + k) } catch { /* ignore */ } }
function mList(prefix) {
  const out = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(MIRROR)) {
        const real = key.slice(MIRROR.length)
        if (real.startsWith(prefix)) out.push(real)
      }
    }
  } catch { /* ignore */ }
  return out.sort()
}

window.storage = {
  async get(key) {
    try {
      const r = await fetch(`${API}/${encodeURIComponent(key)}`, { headers: headers(false) })
      if (r.status === 404) { setOffline(false); return null }
      if (!r.ok) throw new Error('http ' + r.status)
      const j = await r.json()
      setOffline(false)
      mSet(key, j.value)
      return { key, value: j.value }
    } catch {
      setOffline(true)
      const v = mGet(key)
      return v == null ? null : { key, value: v }
    }
  },

  async set(key, value) {
    mSet(key, value) // mirror first so an offline write still persists locally
    try {
      const r = await fetch(`${API}/${encodeURIComponent(key)}`, {
        method: 'PUT', headers: headers(true), body: JSON.stringify({ value }),
      })
      if (!r.ok) throw new Error('http ' + r.status)
      setOffline(false)
    } catch {
      setOffline(true)
    }
    return { key, value }
  },

  async delete(key) {
    mDel(key)
    try {
      const r = await fetch(`${API}/${encodeURIComponent(key)}`, { method: 'DELETE', headers: headers(false) })
      if (!r.ok && r.status !== 404) throw new Error('http ' + r.status)
      setOffline(false)
    } catch {
      setOffline(true)
    }
    return { key, deleted: true }
  },

  async list(prefix = '') {
    try {
      const r = await fetch(`${API}?prefix=${encodeURIComponent(prefix)}`, { headers: headers(false) })
      if (!r.ok) throw new Error('http ' + r.status)
      const j = await r.json()
      setOffline(false)
      return { keys: j.keys || [] }
    } catch {
      setOffline(true)
      return { keys: mList(prefix) }
    }
  },
}
