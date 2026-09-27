import { useState } from 'react'
import type { KeyboardEvent, SubmitEvent } from 'react'
import { GreenApiError, sendMessage } from '../../api/greenApi'
import type { Credentials, Message } from '../../types'
import styles from './MessageInput.module.css'

type MessageInputProps = {
  apiUrl: string
  credentials: Credentials
  chatId: string
  onMessageSent: (chatId: string, message: Message) => void
}

export function MessageInput({ apiUrl, credentials, chatId, onMessageSent }: MessageInputProps) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const message = text.trim()
  const isDisabled = message.length === 0 || isSending

  async function handleSend() {
    if (isDisabled) {
      return
    }

    setError(null)
    setIsSending(true)

    try {
      const idMessage = await sendMessage(apiUrl, credentials, chatId, message)

      onMessageSent(chatId, {
        id: idMessage,
        direction: 'outgoing',
        text: message,
        timestamp: Date.now(),
      })
      setText('')
    } catch (requestError) {
      setError(getRequestErrorMessage(requestError))
    } finally {
      setIsSending(false)
    }
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    void handleSend()
  }

  function handleChange(value: string) {
    setText(value)
    setError(null)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || isDisabled) {
      return
    }

    event.preventDefault()
    void handleSend()
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <textarea
        className={styles.input}
        value={text}
        onChange={(event) => handleChange(event.target.value)}
        onKeyDown={handleKeyDown}
        maxLength={20000}
        aria-label="Текст сообщения"
        disabled={isSending}
      />
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} type="submit" disabled={isDisabled}>
        Отправить
      </button>
    </form>
  )
}

function getRequestErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError && error.type === 'network') {
    return 'Не удалось подключиться к сервису. Проверьте интернет-соединение и попробуйте снова.'
  }

  return 'Не удалось отправить сообщение. Попробуйте снова.'
}
