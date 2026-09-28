import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { normalizeApiUrl } from '../../lib/apiUrlStorage'
import styles from './ApiUrlDialog.module.css'

type ApiUrlDialogProps = {
  apiUrl: string | null
  hasDefaultApiUrl: boolean
  hasSavedApiUrl: boolean
  onSave: (apiUrl: string) => void
  onReset: () => void
  onClose: () => void
}

export function ApiUrlDialog({
  apiUrl,
  hasDefaultApiUrl,
  hasSavedApiUrl,
  onSave,
  onReset,
  onClose,
}: ApiUrlDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [value, setValue] = useState(apiUrl ?? '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const dialog = dialogRef.current

    if (dialog !== null && !dialog.open) {
      dialog.showModal()
    }

    return () => {
      if (dialog?.open) {
        dialog.close()
      }
    }
  }, [])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedApiUrl = normalizeApiUrl(value)

    if (normalizedApiUrl === null) {
      setError('Укажите адрес вида https://1234.api.green-api.com из личного кабинета GREEN-API.')
      return
    }

    onSave(normalizedApiUrl)
    onClose()
  }

  function handleReset() {
    onReset()
    onClose()
  }

  return (
    <dialog className={styles.dialog} ref={dialogRef} onCancel={onClose} aria-labelledby="api-url-dialog-title">
      <form className={styles.form} onSubmit={handleSubmit}>
        <h2 className={styles.title} id="api-url-dialog-title">Сервер GREEN-API</h2>
        <label className={styles.field}>
          <span>Адрес сервера</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            inputMode="url"
            autoComplete="url"
            autoFocus
          />
        </label>
        <p className={styles.hint}>Скопируйте apiUrl из личного кабинета GREEN-API</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <div className={styles.actions}>
          <button className={styles.submit} type="submit">Сохранить</button>
          <button className={styles.cancel} type="button" onClick={onClose}>Отмена</button>
        </div>
        {hasSavedApiUrl && hasDefaultApiUrl && (
          <button className={styles.reset} type="button" onClick={handleReset}>
            Сбросить к значению по умолчанию
          </button>
        )}
      </form>
    </dialog>
  )
}
