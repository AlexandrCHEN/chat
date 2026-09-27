import type { Credentials } from '../types'

const storageKey = 'max-chat.credentials'

export function loadCredentials(): Credentials | null {
  try {
    const value = sessionStorage.getItem(storageKey)

    if (value === null) {
      return null
    }

    const credentials: unknown = JSON.parse(value)

    if (isCredentials(credentials)) {
      return credentials
    }
  } catch {
    clearCredentials()
    return null
  }

  clearCredentials()
  return null
}

export function saveCredentials(credentials: Credentials): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(credentials))
  } catch {
    return
  }
}

export function clearCredentials(): void {
  try {
    sessionStorage.removeItem(storageKey)
  } catch {
    return
  }
}

function isCredentials(value: unknown): value is Credentials {
  if (!isRecord(value)) {
    return false
  }

  const { idInstance, apiTokenInstance } = value

  return (
    typeof idInstance === 'string' &&
    /^\d+$/.test(idInstance) &&
    typeof apiTokenInstance === 'string' &&
    apiTokenInstance.trim().length > 0
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
