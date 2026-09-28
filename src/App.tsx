import { useCallback, useState } from 'react'
import { GreenApiError, getStateInstance } from './api/greenApi'
import { LoginForm } from './components/LoginForm/LoginForm'
import { Messenger } from './components/Messenger/Messenger'
import { clearCredentials, loadCredentials, saveCredentials } from './lib/credentialsStorage'
import type { Credentials } from './types'

const configurationError =
  'Не задан адрес GREEN-API. Укажите VITE_GREEN_API_URL в файле .env и перезапустите приложение.'

function App() {
  const apiUrl = import.meta.env.VITE_GREEN_API_URL?.trim().replace(/\/+$/, '')
  const isLidMode = import.meta.env.VITE_LID_MODE !== 'false'
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())
  const [sessionEndMessage, setSessionEndMessage] = useState<string | null>(null)

  async function handleLogin(nextCredentials: Credentials): Promise<string | null> {
    if (!apiUrl) {
      return configurationError
    }

    try {
      const stateInstance = await getStateInstance(apiUrl, nextCredentials)

      if (stateInstance === 'authorized') {
        saveCredentials(nextCredentials)
        setSessionEndMessage(null)
        setCredentials(nextCredentials)
        return null
      }

      return getStateMessage(stateInstance)
    } catch (error) {
      return getRequestErrorMessage(error)
    }
  }

  function handleLogout() {
    clearCredentials()
    setSessionEndMessage(null)
    setCredentials(null)
  }

  const handleSessionEnd = useCallback(() => {
    clearCredentials()
    setCredentials(null)
    setSessionEndMessage('Сеанс завершен: GREEN-API отклонил ID инстанса или API-токен. Войдите снова.')
  }, [])

  if (!apiUrl) {
    return (
      <main className="configurationError">
        <p>{configurationError}</p>
      </main>
    )
  }

  if (!credentials) {
    return <LoginForm onSubmit={handleLogin} initialError={sessionEndMessage} />
  }

  return (
    <Messenger
      apiUrl={apiUrl}
      credentials={credentials}
      isLidMode={isLidMode}
      onLogout={handleLogout}
      onSessionEnd={handleSessionEnd}
    />
  )
}

function getStateMessage(stateInstance: string): string {
  switch (stateInstance) {
    case 'notAuthorized':
      return 'Инстанс не авторизован: отсканируйте QR-код в личном кабинете GREEN-API'
    case 'starting':
      return 'Инстанс запускается, повторите попытку через минуту'
    case 'sleepMode':
      return 'Инстанс в спящем режиме: телефон не в сети'
    case 'blocked':
    case 'yellowCard':
    case 'suspended':
      return `Инстанс недоступен (состояние: ${stateInstance}). Проверьте его в личном кабинете GREEN-API`
    default:
      return `Неожиданное состояние инстанса: ${stateInstance}`
  }
}

function getRequestErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError) {
    if (error.type === 'quota') {
      return error.message
    }

    if (error.type === 'http') {
      if (error.status === 401 || error.status === 403) {
        return 'Не удалось проверить подключение. Проверьте ID инстанса и API-токен.'
      }

      return 'Сервис GREEN-API временно недоступен. Попробуйте позже.'
    }

    if (error.type === 'network') {
      return 'Не удалось подключиться к сервису. Проверьте интернет-соединение и попробуйте снова.'
    }

    return 'Произошла ошибка при проверке подключения. Попробуйте снова.'
  }

  return 'Не удалось проверить подключение. Попробуйте снова.'
}

export default App
