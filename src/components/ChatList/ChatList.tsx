import { formatPhone } from '../../lib/phone'
import type { Chat } from '../../types'
import styles from './ChatList.module.css'

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
      {chats.map((chat) => (
        <li key={chat.chatId}>
          <button
            className={styles.chat}
            type="button"
            aria-pressed={chat.chatId === selectedChatId}
            onClick={() => onSelect(chat.chatId)}
          >
            {formatPhone(chat.phoneNumber)}
          </button>
        </li>
      ))}
    </ul>
  )
}
