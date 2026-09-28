import { useEffect, useState } from 'react'
import { GreenApiError, checkWhatsapp } from '../../api/greenApi'
import { ChatList } from '../ChatList/ChatList'
import { ChatWindow } from '../ChatWindow/ChatWindow'
import { NewChatForm } from '../NewChatForm/NewChatForm'
import { pollNotifications } from '../../lib/notificationPolling'
import { fromChatId, toChatId } from '../../lib/phone'
import type { Credentials, Chat, Message } from '../../types'
import styles from './Messenger.module.css'

type MessengerProps = {
  apiUrl: string
  credentials: Credentials
  isLidMode: boolean
  onLogout: () => void
  onSessionEnd: () => void
}

export function Messenger({ apiUrl, credentials, isLidMode, onLogout, onSessionEnd }: MessengerProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [notificationError, setNotificationError] = useState<'webhook' | 'quota' | null>(null)
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

          if (!chat) {
            if (isLidMode) {
              return currentChats
            }

            const phoneNumber = fromChatId(chatId)
            return phoneNumber ? [...currentChats, { chatId, phoneNumber, messages: [message] }] : currentChats
          }

          if (chat.messages.some((currentMessage) => currentMessage.id === message.id)) {
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
      onReceiveSuccess: () => setNotificationError(null),
      onQuotaError: () => setNotificationError('quota'),
      onSessionEnd,
      onWebhookError: () => setNotificationError('webhook'),
    })

    return () => controller.abort()
  }, [apiUrl, credentials, isLidMode, onSessionEnd])

  async function handleCreateChat(phoneNumber: string): Promise<string | null> {
    const existingChat = chats.find((chat) => chat.phoneNumber === phoneNumber)

    if (existingChat) {
      setSelectedChatId(existingChat.chatId)
      return null
    }

    try {
      const response = await checkWhatsapp(apiUrl, credentials, toChatId(phoneNumber))

      if (!response.existsWhatsapp) {
        return 'У этого номера нет WhatsApp'
      }

      if (response.chatId === null) {
        return 'Не удалось создать чат. Попробуйте снова.'
      }

      const phoneChatId =
        response.phoneNumber !== null && fromChatId(response.phoneNumber) !== null
          ? response.phoneNumber
          : toChatId(phoneNumber)
      const chatId = isLidMode ? response.chatId : phoneChatId
      const chat: Chat = { chatId, phoneNumber, messages: [] }

      setChats((currentChats) => {
        const existingChat = currentChats.find(
          (currentChat) => currentChat.phoneNumber === phoneNumber || currentChat.chatId === chatId,
        )

        if (existingChat) {
          setSelectedChatId(existingChat.chatId)
          return currentChats
        }

        setSelectedChatId(chatId)
        return [...currentChats, chat]
      })
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

  function handleBack() {
    setSelectedChatId(null)
  }

  return (
    <main className={`${styles.messenger} ${selectedChat ? styles.chatSelected : ''}`}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <strong>Chat</strong>
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
        {notificationError && (
          <p className={styles.webhookError} role="alert">
            {notificationError === 'webhook'
              ? 'Получение сообщений недоступно: очистите адрес webhook в настройках инстанса GREEN-API'
              : 'Исчерпан месячный лимит тарифа GREEN-API: новые сообщения могут не приходить. Сменить тариф можно в личном кабинете GREEN-API.'}
          </p>
        )}
        <ChatWindow
          key={selectedChat?.chatId}
          chat={selectedChat}
          apiUrl={apiUrl}
          credentials={credentials}
          onBack={handleBack}
          onMessageSent={handleMessageSent}
        />
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
