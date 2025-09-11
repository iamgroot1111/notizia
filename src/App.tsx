import { useMemo, useState } from 'react'
import type { Client } from './shared/domain'
import styles from './App.module.css'

import AutoTextarea from './components/AutoTextarea'
import {
  addClientImmutable,
  removeClientById,
  updateClientImmutable,
  filterAndSortClients,
  validateClientInput,
  clientLabelForDelete,
} from './shared/clients'

type ReviewMode = 'create' | 'edit' | null

export default function App() {
  const [clients, setClients] = useState<Client[]>([])
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [query, setQuery] = useState('')

  // Edit-Zustand in der Liste
  const [editingId, setEditingId] = useState<number | null>(null)
  const [draftName, setDraftName] = useState('')
  const [draftNote, setDraftNote] = useState('')

  // Review-Dialog (Prüfen vor dem Speichern)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null)
  const [reviewName, setReviewName] = useState('')
  const [reviewNote, setReviewNote] = useState('')

  // --- Aktionen ---
  function startEdit(c: Client) {
    setEditingId(c.id)
    setDraftName(c.name)
    setDraftNote(c.note ?? '')
  }

  function cancelEdit() {
    setEditingId(null)
    setDraftName('')
    setDraftNote('')
  }

  // Review-Öffner: Anlegen
  function openReviewForCreate() {
    const check = validateClientInput(name, note)
    if (!check.ok) return
    setReviewMode('create')
    setReviewName(check.value.name)
    setReviewNote(check.value.note)
    setReviewOpen(true)
  }

  // Review-Öffner: Edit
  function openReviewForEdit() {
    if (editingId == null) return
    const check = validateClientInput(draftName, draftNote)
    if (!check.ok) return
    setReviewMode('edit')
    setReviewName(check.value.name)
    setReviewNote(check.value.note)
    setReviewOpen(true)
  }

  // Review bestätigen => wirklich speichern
  function confirmReview() {
    if (reviewMode === 'create') {
      setClients(prev => addClientImmutable(prev, reviewName, reviewNote))
      setName(''); setNote('')
    } else if (reviewMode === 'edit' && editingId != null) {
      setClients(prev => updateClientImmutable(prev, editingId, reviewName, reviewNote))
      cancelEdit()
    }
    closeReview()
  }

  function closeReview() {
    setReviewOpen(false)
    setReviewMode(null)
    setReviewName('')
    setReviewNote('')
  }

  // Löschen (mit Bestätigung)
  function removeClient(id: number) {
    const label = clientLabelForDelete(clients, id)
    const ok = window.confirm(`Klient „${label}“ wirklich löschen?`)
    if (!ok) return
    if (editingId === id) cancelEdit()
    setClients(prev => removeClientById(prev, id))
  }

  // Enter/Escape im Edit-Modus
  function onEditKeyDown(e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      openReviewForEdit()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      cancelEdit()
    }
  }

  // --- abgeleitet ---
  const filteredSorted = useMemo(
    () => filterAndSortClients(clients, query),
    [clients, query]
  )
  const count = filteredSorted.length

  const addCheck = validateClientInput(name, note)
  const canAdd   = addCheck.ok

  const saveCheck = validateClientInput(draftName, draftNote)
  const canSave   = saveCheck.ok

  const reviewCheck = validateClientInput(reviewName, reviewNote)

  // --- UI ---
  return (
    <main className={styles.main}>
      <h1>Notizia – Mini-CRUD (ohne DB)</h1>

      {/* Neu anlegen */}
      <section className={styles.form}>
        <label>
          Name:{' '}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Klientenname"
            className={addCheck.errors.name ? styles.invalid : undefined}
          />
        </label>
        {addCheck.errors.name && <small className={styles.hint}>{addCheck.errors.name}</small>}

        <label>
          Notiz:{' '}
          <AutoTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="optional (max. 200 Zeichen)"
            className={`${styles.textarea} ${addCheck.errors.note ? styles.invalid : ''}`}
          />
        </label>
        {addCheck.errors.note && <small className={styles.hint}>{addCheck.errors.note}</small>}

        <div className={styles.actions}>
          <button onClick={openReviewForCreate} disabled={!canAdd}>Prüfen & speichern</button>
          {!canAdd && <small className={styles.hint}>Bitte Eingaben prüfen</small>}
        </div>
      </section>

      {/* Suche */}
      <section className={styles.form}>
        <label>
          Suche:{' '}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name oder Notiz"
          />
        </label>
        <div>{count} Klient{count === 1 ? '' : 'en'}</div>
      </section>

      {/* Liste */}
      <ul className={styles.list}>
        {filteredSorted.map((c) => {
          const isEditing = c.id === editingId
          return (
            <li key={c.id} className={`${styles.item} ${isEditing ? styles.editing : ''}`}>
              <div className={styles.row}>
                <div style={{ flex: 1 }}>
                  <strong>#{c.id}</strong>{' '}
                  {!isEditing ? (
                    <>
                      {c.name}
                      {c.note ? (
                        <div className={styles.note}>
                          <div className={styles.noteLabel}>Notiz:</div>
                          <pre className={styles.notePre}>{c.note}</pre>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className={styles.editFields}>
                      <label>
                        Name:{' '}
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          className={saveCheck.errors.name ? styles.invalid : undefined}
                        />
                      </label>
                      {saveCheck.errors.name && <small className={styles.hint}>{saveCheck.errors.name}</small>}

                      <label>
                        Notiz:{' '}
                        <AutoTextarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          className={`${styles.textarea} ${saveCheck.errors.note ? styles.invalid : ''}`}
                        />
                      </label>
                      {saveCheck.errors.note && <small className={styles.hint}>{saveCheck.errors.note}</small>}
                    </div>
                  )}
                </div>

                <div className={styles.actions}>
                  {!isEditing ? (
                    <>
                      <button onClick={() => startEdit(c)}>Bearbeiten</button>
                      <button onClick={() => removeClient(c.id)}>Löschen</button>
                    </>
                  ) : (
                    <>
                      <button onClick={openReviewForEdit} disabled={!canSave}>Speichern</button>
                      <button onClick={cancelEdit} className={styles.btnSecondary}>Abbrechen</button>
                    </>
                  )}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {clients.length === 0 && <p className={styles.hint}>Noch keine Klienten angelegt.</p>}

      {/* Review-Dialog */}
      {reviewOpen && (
        <div className={styles.modalOverlay} onClick={closeReview}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {reviewMode === 'create' ? 'Eingaben prüfen & speichern' : 'Änderungen prüfen & speichern'}
            </div>
            <div className={styles.modalBody}>
              <label>
                Name:{' '}
                <input
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className={reviewCheck.errors.name ? styles.invalid : undefined}
                />
              </label>
              {reviewCheck.errors.name && <small className={styles.hint}>{reviewCheck.errors.name}</small>}

              <label>
                Notiz:{' '}
                <AutoTextarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className={`${styles.textarea} ${reviewCheck.errors.note ? styles.invalid : ''}`}
                />
              </label>
              {reviewCheck.errors.note && <small className={styles.hint}>{reviewCheck.errors.note}</small>}
            </div>
            <div className={styles.modalActions}>
              <button onClick={closeReview} className={styles.btnSecondary}>Zurück</button>
              <button onClick={confirmReview} disabled={!reviewCheck.ok}>Speichern</button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
