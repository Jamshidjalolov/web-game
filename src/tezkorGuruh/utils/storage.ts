import type { TezkorGuruhConfig } from '../types.ts'

const STORAGE_KEY_LAST_SETUP = 'tezkorGuruh_last_setup'
const STORAGE_KEY_SESSION_PREFIX = 'tezkorGuruh_session_'

export const saveLastSetup = (config: TezkorGuruhConfig) => {
  try {
    window.localStorage.setItem(STORAGE_KEY_LAST_SETUP, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export const loadLastSetup = (): TezkorGuruhConfig | null => {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY_LAST_SETUP)
    if (!item) return null
    return JSON.parse(item) as TezkorGuruhConfig
  } catch {
    return null
  }
}

export const createSessionConfigKey = () => `teg_${Math.random().toString(36).slice(2)}`

export const saveSessionConfig = (key: string, config: TezkorGuruhConfig) => {
  try {
    window.localStorage.setItem(`${STORAGE_KEY_SESSION_PREFIX}${key}`, JSON.stringify(config))
  } catch {
    // ignore
  }
}

export const loadSessionConfig = (key: string | null) => {
  if (!key) return null
  try {
    const item = window.localStorage.getItem(`${STORAGE_KEY_SESSION_PREFIX}${key}`)
    if (!item) return null
    return JSON.parse(item) as TezkorGuruhConfig
  } catch {
    return null
  }
}
