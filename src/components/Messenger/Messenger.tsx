import styles from './Messenger.module.css'

type MessengerProps = {
  onLogout: () => void
}

export function Messenger({ onLogout }: MessengerProps) {
  return (
    <main className={styles.messenger}>
      <aside className={styles.sidebar}>
        <header className={styles.sidebarHeader}>
          <strong>MAX Chat</strong>
          <button className={styles.logout} type="button" onClick={onLogout}>
            Выйти
          </button>
        </header>
        <div className={styles.sidebarContent}>
          <p className={styles.placeholder}>Нет чатов</p>
        </div>
      </aside>
      <section className={styles.chatArea} aria-label="Область чата">
        <p className={styles.placeholder}>Выберите чат</p>
      </section>
    </main>
  )
}
