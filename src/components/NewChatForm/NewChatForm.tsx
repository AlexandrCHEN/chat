import { useState } from 'react'
import type { SubmitEvent } from 'react'
import { filterPhoneInput, parsePhone } from '../../lib/phone'
import styles from './NewChatForm.module.css'

type NewChatFormProps = {
  onSubmit: (phoneNumber: string) => Promise<string | null>
}

export function NewChatForm({ onSubmit }: NewChatFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isDisabled = phoneNumber.length === 0 || isSubmitting

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (isDisabled) {
      return
    }

    const result = parsePhone(phoneNumber)

    if (!result.valid) {
      setError(
        result.error === 'format'
          ? 'Введите номер в международном формате, например +7 999 123-45-67'
          : 'Проверьте номер телефона: такого номера не существует',
      )
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const message = await onSubmit(result.e164)

      if (message) {
        setError(message)
        return
      }

      setPhoneNumber('')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleChange(value: string) {
    setPhoneNumber(filterPhoneInput(value))
    setError(null)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <label className={styles.field}>
        <span className={styles.label}>Номер телефона</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(event) => handleChange(event.target.value)}
          inputMode="tel"
          placeholder="+79991234567"
          autoComplete="tel"
          disabled={isSubmitting}
        />
      </label>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} type="submit" disabled={isDisabled}>
        {isSubmitting ? 'Проверяем…' : 'Создать чат'}
      </button>
    </form>
  )
}
