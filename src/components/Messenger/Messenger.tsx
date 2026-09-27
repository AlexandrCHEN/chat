import { useState } from 'react'
import { GreenApiError, checkWhatsapp } from '../../api/greenApi'
import { ChatList } from '../ChatList/ChatList'
import { ChatWindow } from '../ChatWindow/ChatWindow'
import { NewChatForm } from '../NewChatForm/NewChatForm'
import { toChatId } from '../../lib/phone'
import type { Credentials, Chat, Message } from '../../types'
import styles from './Messenger.module.css'

type MessengerProps = {
  apiUrl: string
  credentials: Credentials
  onLogout: () => void
}

export function Messenger({ apiUrl, credentials, onLogout }: MessengerProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const selectedChat = chats.find((chat) => chat.chatId === selectedChatId) ?? null

  async function handleCreateChat(phoneNumber: string): Promise<string | null> {
    const chatId = toChatId(phoneNumber)
    const existingChat = chats.find((chat) => chat.chatId === chatId)

    if (existingChat) {
      setSelectedChatId(existingChat.chatId)
      return null
    }

    try {
      const existsWhatsapp = await checkWhatsapp(apiUrl, credentials, chatId)

      if (!existsWhatsapp) {
        return 'У этого номера нет WhatsApp'
      }
    } catch (error) {
      return getRequestErrorMessage(error)
    }

    const chat: Chat = { chatId, phoneNumber, messages: [] }

    setChats((currentChats) => [...currentChats, chat])
    setSelectedChatId(chatId)
    return null
  }

  function handleMessageSent(chatId: string, message: Message) {
    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.chatId === chatId ? { ...chat, messages: [...chat.messages, message] } : chat,
      ),
    )
  }

  return (
    <main className={styles.messenger}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <strong>MAX Chat</strong>
          <button className={styles.logout} type="button" onClick={onLogout}>
            Выйти
          </button>
        </header>
        <NewChatForm onSubmit={handleCreateChat} />
        <div className={styles.sidebarContent}>
          <ChatList chats={chats} selectedChatId={selectedChatId} onSelect={setSelectedChatId} />
        </div>
      </aside>
      <section className={styles.chatArea} aria-label="Область чата">
        {selectedChat ? (
          <ChatWindow
            key={selectedChat.chatId}
            chat={selectedChat}
            apiUrl={apiUrl}
            credentials={credentials}
            onMessageSent={handleMessageSent}
          />
        ) : (
          <ChatWindow
            chat={null}
            apiUrl={apiUrl}
            credentials={credentials}
            onMessageSent={handleMessageSent}
          />
        )}
      </section>
    </main>
  )
}

function getRequestErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError) {
    return error.message
  }

  return 'Не удалось проверить номер телефона. Попробуйте снова.'
}
