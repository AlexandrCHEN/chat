import type { Credentials, Message, MessageStatus } from '../types'

type GreenApiErrorType = 'network' | 'http' | 'quota' | 'response' | 'webhook'

export type NotificationEvent =
  | { type: 'message'; chatId: string; message: Message }
  | { type: 'status'; idMessage: string; status: MessageStatus }

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
): Promise<{ existsWhatsapp: boolean; chatId: string | null }> {
  const response = await request(apiUrl, credentials, 'checkWhatsapp', {
    body: { chatId },
  })

  if (!isRecord(response) || typeof response.existsWhatsapp !== 'boolean') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }

  return {
    existsWhatsapp: response.existsWhatsapp,
    chatId: typeof response.chatId === 'string' ? response.chatId : null,
  }
}

export async function sendMessage(
  apiUrl: string,
  credentials: Credentials,
  chatId: string,
  text: string,
): Promise<string> {
  const response = await request(apiUrl, credentials, 'sendMessage', {
    body: { chatId, message: text },
  })

  if (!isRecord(response) || typeof response.idMessage !== 'string') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }

  return response.idMessage
}

export async function receiveNotification(
  apiUrl: string,
  credentials: Credentials,
  signal: AbortSignal,
): Promise<{ receiptId: number; event: NotificationEvent | null } | null> {
  const response = await request(apiUrl, credentials, 'receiveNotification', {
    query: { receiveTimeout: 20},
    signal,
  })

  if (response === null) {
    return null
  }

  if (!isRecord(response) || typeof response.receiptId !== 'number') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }

  return {
    receiptId: response.receiptId,
    event: parseNotificationEvent(response.body),
  }
}

export async function deleteNotification(
  apiUrl: string,
  credentials: Credentials,
  receiptId: number,
  signal: AbortSignal,
): Promise<void> {
  const response = await request(apiUrl, credentials, 'deleteNotification', {
    method: 'DELETE',
    pathParameters: [String(receiptId)],
    signal,
  })

  if (!isRecord(response) || typeof response.result !== 'boolean') {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response')
  }
}

type RequestOptions = {
  body?: Record<string, string>
  method?: 'DELETE' | 'GET' | 'POST'
  pathParameters?: string[]
  query?: Record<string, number | string>
  signal?: AbortSignal
}

async function request(
  apiUrl: string,
  credentials: Credentials,
  method: string,
  options?: RequestOptions,
): Promise<unknown> {
  const requestMethod = options?.method ?? (options?.body ? 'POST' : 'GET')
  let response: Response

  try {
    response = await fetch(buildUrl(apiUrl, credentials, method, options?.pathParameters, options?.query), {
      method: requestMethod,
      headers: options?.body ? { 'Content-Type': 'application/json' } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: options?.signal,
    })
  } catch {
    throw new GreenApiError('Не удалось подключиться к GREEN-API.', 'network')
  }

  if (!response.ok) {
    if (response.status === 466) {
      throw new GreenApiError(
        'Исчерпан месячный лимит тарифа GREEN-API. На бесплатном тарифе Developer можно переписываться не больше чем с 3 чатами в месяц. Сменить тариф можно в личном кабинете GREEN-API.',
        'quota',
        response.status,
      )
    }

    if (response.status === 400 && (await getResponseText(response)).includes('Custom webhook url is set')) {
      throw new GreenApiError('Получение уведомлений недоступно.', 'webhook', response.status)
    }

    throw new GreenApiError('GREEN-API вернул ошибку.', 'http', response.status)
  }

  try {
    return await response.json()
  } catch {
    throw new GreenApiError('GREEN-API вернул неожиданный ответ.', 'response', response.status)
  }
}

function buildUrl(
  apiUrl: string,
  credentials: Credentials,
  method: string,
  pathParameters: string[] = [],
  query?: Record<string, number | string>,
): string {
  const idInstance = encodeURIComponent(credentials.idInstance)
  const apiTokenInstance = encodeURIComponent(credentials.apiTokenInstance)
  const path = pathParameters.map((parameter) => encodeURIComponent(parameter)).join('/')
  const queryString = query ? new URLSearchParams(stringifyQuery(query)).toString() : ''
  const suffix = path ? `/${path}` : ''
  const search = queryString ? `?${queryString}` : ''

  return `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}${suffix}${search}`
}

function stringifyQuery(query: Record<string, number | string>): Record<string, string> {
  return Object.fromEntries(Object.entries(query).map(([key, value]) => [key, String(value)]))
}

async function getResponseText(response: Response): Promise<string> {
  try {
    return await response.text()
  } catch {
    return ''
  }
}

function parseNotificationEvent(body: unknown): NotificationEvent | null {
  if (!isRecord(body)) {
    return null
  }

  if (body.typeWebhook === 'incomingMessageReceived') {
    return parseIncomingMessage(body)
  }

  if (body.typeWebhook === 'outgoingMessageStatus') {
    return parseOutgoingMessageStatus(body)
  }

  return null
}

function parseIncomingMessage(body: Record<string, unknown>): NotificationEvent | null {
  const chatId = getChatId(body.senderData)
  const text = getMessageText(body.messageData)

  if (
    typeof body.idMessage !== 'string' ||
    typeof body.timestamp !== 'number' ||
    !Number.isFinite(body.timestamp) ||
    chatId === null ||
    text === null
  ) {
    return null
  }

  return {
    type: 'message',
    chatId,
    message: {
      id: body.idMessage,
      direction: 'incoming',
      text,
      timestamp: body.timestamp * 1000,
    },
  }
}

function parseOutgoingMessageStatus(body: Record<string, unknown>): NotificationEvent | null {
  const status = getMessageStatus(body.status)

  if (typeof body.idMessage !== 'string' || status === null) {
    return null
  }

  return { type: 'status', idMessage: body.idMessage, status }
}

function getMessageStatus(status: unknown): MessageStatus | null {
  switch (status) {
    case 'sent':
    case 'delivered':
    case 'read':
      return status
    case 'failed':
    case 'noAccount':
    case 'notInGroup':
    case 'suspended':
    case 'yellowCard':
      return 'failed'
    default:
      return null
  }
}

function getChatId(senderData: unknown): string | null {
  if (!isRecord(senderData) || typeof senderData.chatId !== 'string') {
    return null
  }

  return senderData.chatId
}

function getMessageText(messageData: unknown): string | null {
  if (!isRecord(messageData)) {
    return null
  }

  if (messageData.typeMessage === 'textMessage') {
    return getTextField(messageData.textMessageData, 'textMessage')
  }

  if (messageData.typeMessage === 'extendedTextMessage') {
    return getTextField(messageData.extendedTextMessageData, 'text')
  }

  return null
}

function getTextField(value: unknown, field: string): string | null {
  if (!isRecord(value) || typeof value[field] !== 'string') {
    return null
  }

  return value[field]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
