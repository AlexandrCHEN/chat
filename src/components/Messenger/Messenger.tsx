import styles from './Messenger.module.css'

export function Messenger() {
  return (
    <main className={styles.messenger}>
      <aside className={styles.sidebar}>
        <p className={styles.placeholder}>Нет чатов</p>
      </aside>
      <section className={styles.chatArea} aria-label="Область чата">
        <p className={styles.placeholder}>Выберите чат</p>
      </section>
    </main>
  )
}
