import { GreenApiError, deleteNotification, receiveNotification } from '../api/greenApi'
import type { Credentials, Message, MessageStatus } from '../types'

type PollNotificationsOptions = {
  apiUrl: string
  credentials: Credentials
  onMessage: (chatId: string, message: Message) => void
  onStatus: (idMessage: string, status: MessageStatus) => void
  onReceiveSuccess: () => void
  onQuotaError: () => void
  onSessionEnd: () => void
  onWebhookError: () => void
  signal: AbortSignal
}

export async function pollNotifications({
  apiUrl,
  credentials,
  onMessage,
  onStatus,
  onReceiveSuccess,
  onQuotaError,
  onSessionEnd,
  onWebhookError,
  signal,
}: PollNotificationsOptions): Promise<void> {
  while (!signal.aborted) {
    try {
      const notification = await receiveNotification(apiUrl, credentials, signal)

      if (signal.aborted) {
        return
      }

      onReceiveSuccess()

      if (notification === null) {
        continue
      }

      if (notification.event?.type === 'message') {
        onMessage(notification.event.chatId, notification.event.message)
      }

      if (notification.event?.type === 'status') {
        onStatus(notification.event.idMessage, notification.event.status)
      }

      if (signal.aborted) {
        return
      }

      await deleteNotification(apiUrl, credentials, notification.receiptId, signal)
    } catch (error) {
      if (signal.aborted) {
        return
      }

      if (error instanceof GreenApiError && error.type === 'webhook') {
        onWebhookError()
      }

      if (error instanceof GreenApiError && error.type === 'quota') {
        onQuotaError()
      }

      if (error instanceof GreenApiError && error.type === 'http' && (error.status === 401 || error.status === 403)) {
        onSessionEnd()
        return
      }

      await waitForRetry(signal)
    }
  }
}

function waitForRetry(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const handleAbort = () => {
      window.clearTimeout(timeoutId)
      resolve()
    }
    const timeoutId = window.setTimeout(() => {
      signal.removeEventListener('abort', handleAbort)
      resolve()
    }, 5000)

    signal.addEventListener('abort', handleAbort, { once: true })
  })
}
