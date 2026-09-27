import { useState } from 'react'
import type { SubmitEvent } from 'react'
import type { Credentials } from '../../types'
import styles from './LoginForm.module.css'

type LoginFormProps = {
  onSubmit: (credentials: Credentials) => Promise<string | null>
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = idInstance.length === 0 || apiTokenInstance.trim().length === 0 || isSubmitting

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const message = await onSubmit({
        idInstance,
        apiTokenInstance: apiTokenInstance.trim(),
      })

      setError(message)
    } catch {
      setError('Не удалось проверить инстанс.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className={styles.page}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Вход в Chat</h1>
        <label className={styles.field}>
          <span>idInstance</span>
          <input
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            autoComplete="off"
            disabled={isSubmitting}
          />
        </label>
        <label className={styles.field}>
          <span>apiTokenInstance</span>
          <input
            type="password"
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
            autoComplete="off"
            disabled={isSubmitting}
          />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.submit} type="submit" disabled={isDisabled}>
          {isSubmitting ? 'Проверяем…' : 'Войти'}
        </button>
      </form>
    </main>
  )
}
