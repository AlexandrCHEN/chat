import { Messenger } from './components/Messenger/Messenger'

const configurationError =
  'Не задан адрес GREEN-API. Укажите VITE_GREEN_API_URL в файле .env и перезапустите приложение.'

function App() {
  const apiUrl = import.meta.env.VITE_GREEN_API_URL?.trim().replace(/\/+$/, '')

  if (!apiUrl) {
    return (
      <main className="configurationError">
        <p>{configurationError}</p>
      </main>
    )
  }

  return <Messenger />
}

export default App
