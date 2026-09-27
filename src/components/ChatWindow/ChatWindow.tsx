import { useEffect, useRef } from 'react'
import { formatPhone } from '../../lib/phone'
import type { Chat, Credentials, Message, MessageStatus } from '../../types'
import { MessageInput } from '../MessageInput/MessageInput'
import styles from './ChatWindow.module.css'

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

const statusContent: Record<MessageStatus, { icon: string; label: string; className: string }> = {
  sent: { icon: '✓', label: 'Отправлено', className: styles.status },
  delivered: { icon: '✓✓', label: 'Доставлено', className: styles.status },
  read: { icon: '✓✓', label: 'Прочитано', className: `${styles.status} ${styles.statusRead}` },
  failed: { icon: '!', label: 'Не доставлено', className: `${styles.status} ${styles.statusFailed}` },
}

type ChatWindowProps = {
  chat: Chat | null
  apiUrl: string
  credentials: Credentials
  onMessageSent: (chatId: string, message: Message) => void
}

export function ChatWindow({ chat, apiUrl, credentials, onMessageSent }: ChatWindowProps) {
  const lastMessageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    lastMessageRef.current?.scrollIntoView({ block: 'end' })
  }, [chat?.chatId, chat?.messages.length])

  if (!chat) {
    return <p className={styles.placeholder}>Выберите чат</p>
  }

  return (
    <>
      <header className={styles.header}>{formatPhone(chat.phoneNumber)}</header>
      <div className={styles.messages} aria-label="Сообщения">
        {chat.messages.length === 0 ? (
          <p className={styles.placeholder}>Сообщений пока нет</p>
        ) : (
          <>
            {chat.messages.map((message) => (
              <div
                className={message.direction === 'outgoing' ? styles.outgoingMessage : styles.incomingMessage}
                key={message.id}
              >
                <p className={styles.text}>{message.text}</p>
                <span className={styles.meta}>
                  <time dateTime={new Date(message.timestamp).toISOString()}>{timeFormatter.format(message.timestamp)}</time>
                  {message.direction === 'outgoing' && (
                    <span
                      className={statusContent[message.status].className}
                      aria-label={statusContent[message.status].label}
                      title={statusContent[message.status].label}
                    >
                      {statusContent[message.status].icon}
                    </span>
                  )}
                </span>
              </div>
            ))}
            <div ref={lastMessageRef} />
          </>
        )}
      </div>
      <MessageInput
        apiUrl={apiUrl}
        credentials={credentials}
        chatId={chat.chatId}
        onMessageSent={onMessageSent}
      />
    </>
  )
}
