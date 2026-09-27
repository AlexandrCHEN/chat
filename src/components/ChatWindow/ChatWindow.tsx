import { formatPhone } from '../../lib/phone'
import type { Chat } from '../../types'
import styles from './ChatWindow.module.css'

type ChatWindowProps = {
  chat: Chat | null
}

export function ChatWindow({ chat }: ChatWindowProps) {
  if (!chat) {
    return <p className={styles.placeholder}>Выберите чат</p>
  }

  return (
    <>
      <header className={styles.header}>{formatPhone(chat.phoneNumber)}</header>
      <div className={styles.messages} aria-label="Сообщения" />
    </>
  )
}
