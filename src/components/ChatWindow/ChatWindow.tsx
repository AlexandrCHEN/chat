import { formatPhone } from '../../lib/phone'
import type { Chat, Credentials, Message } from '../../types'
import { MessageInput } from '../MessageInput/MessageInput'
import styles from './ChatWindow.module.css'

type ChatWindowProps = {
  chat: Chat | null
  apiUrl: string
  credentials: Credentials
  onMessageSent: (chatId: string, message: Message) => void
}

export function ChatWindow({ chat, apiUrl, credentials, onMessageSent }: ChatWindowProps) {
  if (!chat) {
    return <p className={styles.placeholder}>Выберите чат</p>
  }

  return (
    <>
      <header className={styles.header}>{formatPhone(chat.phoneNumber)}</header>
      <div className={styles.messages} aria-label="Сообщения">
        {chat.messages.map((message) => (
          <p
            className={message.direction === 'outgoing' ? styles.outgoingMessage : styles.incomingMessage}
            key={message.id}
          >
            {message.text}
          </p>
        ))}
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
