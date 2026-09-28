const storageKey = 'max-chat.api-url'

export function loadApiUrl(): string | null {
  try {
    const value = localStorage.getItem(storageKey)

    if (value === null) {
      return null
    }

    const apiUrl = normalizeApiUrl(value)

    if (apiUrl !== null) {
      return apiUrl
    }
  } catch {
    clearApiUrl()
    return null
  }

  clearApiUrl()
  return null
}

export function saveApiUrl(apiUrl: string): void {
  try {
    localStorage.setItem(storageKey, apiUrl)
  } catch {
    return
  }
}

export function clearApiUrl(): void {
  try {
    localStorage.removeItem(storageKey)
  } catch {
    return
  }
}

export function normalizeApiUrl(value: string): string | null {
  try {
    const source = value.trim()
    const url = new URL(source)
    const authority = source.match(/^https:\/\/([^/?#]*)/i)?.[1]

    if (
      url.protocol !== 'https:' ||
      authority === undefined ||
      authority.includes(':') ||
      !isGreenApiHost(url.hostname) ||
      url.pathname !== '/' ||
      url.search !== '' ||
      url.hash !== '' ||
      source.includes('?') ||
      source.includes('#') ||
      url.port !== '' ||
      url.username !== '' ||
      url.password !== ''
    ) {
      return null
    }

    return `https://${url.hostname}`
  } catch {
    return null
  }
}

function isGreenApiHost(hostname: string): boolean {
  return (
    hostname === 'green-api.com' ||
    hostname === 'greenapi.com' ||
    hostname.endsWith('.green-api.com') ||
    hostname.endsWith('.greenapi.com')
  )
}
