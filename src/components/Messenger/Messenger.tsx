import { useEffect, useState } from 'react'
import { GreenApiError, checkWhatsapp } from '../../api/greenApi'
import { ChatList } from '../ChatList/ChatList'
import { ChatWindow } from '../ChatWindow/ChatWindow'
import { NewChatForm } from '../NewChatForm/NewChatForm'
import { pollNotifications } from '../../lib/notificationPolling'
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
  const [hasWebhookError, setHasWebhookError] = useState(false)
  const selectedChat = chats.find((chat) => chat.chatId === selectedChatId) ?? null

  useEffect(() => {
    const controller = new AbortController()

    void pollNotifications({
      apiUrl,
      credentials,
      signal: controller.signal,
      onMessage: (chatId, message) => {
        setChats((currentChats) => {
          const chat = currentChats.find((currentChat) => currentChat.chatId === chatId)

          if (!chat || chat.messages.some((currentMessage) => currentMessage.id === message.id)) {
            return currentChats
          }

          return currentChats.map((currentChat) =>
            currentChat.chatId === chatId
              ? { ...currentChat, messages: [...currentChat.messages, message] }
              : currentChat,
          )
        })
      },
      onStatus: (idMessage, status) => {
        setChats((currentChats) => {
          const hasMessage = currentChats.some((chat) =>
            chat.messages.some((message) => message.direction === 'outgoing' && message.id === idMessage),
          )

          if (!hasMessage) {
            return currentChats
          }

          return currentChats.map((chat) => ({
            ...chat,
            messages: chat.messages.map((message) =>
              message.direction === 'outgoing' && message.id === idMessage ? { ...message, status } : message,
            ),
          }))
        })
      },
      onReceiveSuccess: () => setHasWebhookError(false),
      onWebhookError: () => setHasWebhookError(true),
    })

    return () => controller.abort()
  }, [apiUrl, credentials])

  async function handleCreateChat(phoneNumber: string): Promise<string | null> {
    const existingChat = chats.find((chat) => chat.phoneNumber === phoneNumber)

    if (existingChat) {
      setSelectedChatId(existingChat.chatId)
      return null
    }

    try {
      const { existsWhatsapp, chatId } = await checkWhatsapp(apiUrl, credentials, toChatId(phoneNumber))

      if (!existsWhatsapp) {
        return 'У этого номера нет WhatsApp'
      }

      if (chatId === null) {
        return 'Не удалось создать чат. Попробуйте снова.'
      }

      const chat: Chat = { chatId, phoneNumber, messages: [] }

      setChats((currentChats) => [...currentChats, chat])
      setSelectedChatId(chatId)
      return null
    } catch (error) {
      return getRequestErrorMessage(error)
    }
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
        {hasWebhookError && (
          <p className={styles.webhookError} role="alert">
            Получение сообщений недоступно: очистите адрес webhook в настройках инстанса GREEN-API
          </p>
        )}
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
