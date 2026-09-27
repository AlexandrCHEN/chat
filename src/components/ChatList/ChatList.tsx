import { formatPhone } from '../../lib/phone'
import type { Chat } from '../../types'
import styles from './ChatList.module.css'

const timeFormatter = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })

type ChatListProps = {
  chats: Chat[]
  selectedChatId: string | null
  onSelect: (chatId: string) => void
}

export function ChatList({ chats, selectedChatId, onSelect }: ChatListProps) {
  if (chats.length === 0) {
    return <p className={styles.placeholder}>Нет чатов</p>
  }

  return (
    <ul className={styles.list}>
      {chats.map((chat) => {
        const lastMessage = chat.messages[chat.messages.length - 1]

        return (
          <li key={chat.chatId}>
            <button
              className={styles.chat}
              type="button"
              aria-pressed={chat.chatId === selectedChatId}
              onClick={() => onSelect(chat.chatId)}
            >
              <span>{formatPhone(chat.phoneNumber)}</span>
              <span className={styles.preview}>
                <span className={styles.lastMessage}>{lastMessage?.text ?? 'Нет сообщений'}</span>
                {lastMessage && (
                  <time className={styles.time} dateTime={new Date(lastMessage.timestamp).toISOString()}>
                    {timeFormatter.format(lastMessage.timestamp)}
                  </time>
                )}
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
