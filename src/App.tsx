import { useState } from 'react'
import { GreenApiError, getStateInstance } from './api/greenApi'
import { LoginForm } from './components/LoginForm/LoginForm'
import { Messenger } from './components/Messenger/Messenger'
import { clearCredentials, loadCredentials, saveCredentials } from './lib/credentialsStorage'
import type { Credentials } from './types'

const configurationError =
  'Не задан адрес GREEN-API. Укажите VITE_GREEN_API_URL в файле .env и перезапустите приложение.'

function App() {
  const apiUrl = import.meta.env.VITE_GREEN_API_URL?.trim().replace(/\/+$/, '')
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials())

  async function handleLogin(nextCredentials: Credentials): Promise<string | null> {
    if (!apiUrl) {
      return configurationError
    }

    try {
      const stateInstance = await getStateInstance(apiUrl, nextCredentials)

      if (stateInstance === 'authorized') {
        saveCredentials(nextCredentials)
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
    setCredentials(null)
  }

  if (!apiUrl) {
    return (
      <main className="configurationError">
        <p>{configurationError}</p>
      </main>
    )
  }

  if (!credentials) {
    return <LoginForm onSubmit={handleLogin} />
  }

  return <Messenger apiUrl={apiUrl} credentials={credentials} onLogout={handleLogout} />
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
    if (error.type === 'http' && error.status !== undefined) {
      return 'Не удалось проверить подключение. Проверьте ID инстанса и API-токен.'
    }

    if (error.type === 'network') {
      return 'Не удалось подключиться к сервису. Проверьте интернет-соединение и попробуйте снова.'
    }

    return 'Произошла ошибка при проверке подключения. Попробуйте снова.'
  }

  return 'Не удалось проверить подключение. Попробуйте снова.'
}

export default App
