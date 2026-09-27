import type { Credentials } from '../types'

type GreenApiErrorType = 'network' | 'http' | 'response'

export class GreenApiError extends Error {
  readonly status: number | undefined
  readonly type: GreenApiErrorType

  constructor(message: string, type: GreenApiErrorType, status?: number) {
    super(message)
    this.name = 'GreenApiError'
    this.type = type
    this.status = status
  }
}

export async function getStateInstance(apiUrl: string, credentials: Credentials): Promise<string> {
  const response = await request(apiUrl, credentials, 'getStateInstance')

  if (!isRecord(response) || typeof response.stateInstance !== 'string') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }

  return response.stateInstance
}

export async function checkWhatsapp(
  apiUrl: string,
  credentials: Credentials,
  chatId: string,
): Promise<boolean> {
  const response = await request(apiUrl, credentials, 'checkWhatsapp', {
    body: { chatId },
  })

  if (!isRecord(response) || typeof response.existsWhatsapp !== 'boolean') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }

  return response.existsWhatsapp
}

type RequestOptions = {
  body?: Record<string, string>
}

async function request(
  apiUrl: string,
  credentials: Credentials,
  method: string,
  options?: RequestOptions,
): Promise<unknown> {
  let response: Response

  try {
    response = await fetch(buildUrl(apiUrl, credentials, method), {
      method: options?.body ? 'POST' : 'GET',
      headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new GreenApiError('Не удалось подключиться к GREEN-API.', 'network')
  }

  if (!response.ok) {
    throw new GreenApiError('GREEN-API вернул ошибку.', 'http', response.status)
  }

  try {
    return await response.json()
  } catch {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response', response.status)
  }
}

function buildUrl(apiUrl: string, credentials: Credentials, method: string): string {
  const idInstance = encodeURIComponent(credentials.idInstance)
  const apiTokenInstance = encodeURIComponent(credentials.apiTokenInstance)

  return `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
