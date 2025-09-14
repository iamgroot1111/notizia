import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { Client } from "./shared/domain";
import styles from "./App.module.css";
import AutoTextarea from "./components/AutoTextarea";
import {
  filterAndSortClients,
  validateClientInput,
  clientLabelForDelete,
} from "./shared/clients";
import ClientCases from "./components/ClientCases";

type ReviewMode = "create" | "edit" | null;

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [query, setQuery] = useState("");

  // Edit-Zustand in der Liste
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftNote, setDraftNote] = useState("");

  // Review-Dialog (Prüfen vor dem Speichern)
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState<ReviewMode>(null);
  const [reviewName, setReviewName] = useState("");
  const [reviewNote, setReviewNote] = useState("");

  // ---- Daten laden ----
  useEffect(() => {
    window.api.listClients().then(setClients);
  }, []);
  async function refreshClients() {
    setClients(await window.api.listClients());
  }

  // ---- Aktionen ----
  function startEdit(c: Client) {
    setEditingId(c.id);
    setDraftName(c.name);
    setDraftNote(c.notes ?? "");
  }
  function cancelEdit() {
    setEditingId(null);
    setDraftName("");
    setDraftNote("");
  }

  // Review-Öffner: Anlegen
  function openReviewForCreate() {
    const check = validateClientInput(name, note);
    if (!check.ok) return;
    setReviewMode("create");
    setReviewName(check.value.name);
    setReviewNote(check.value.note);
    setReviewOpen(true);
  }

  // Review-Öffner: Edit
  function openReviewForEdit() {
    if (editingId == null) return;
    const check = validateClientInput(draftName, draftNote);
    if (!check.ok) return;
    setReviewMode("edit");
    setReviewName(check.value.name);
    setReviewNote(check.value.note);
    setReviewOpen(true);
  }

  async function confirmReview() {
    try {
      if (reviewMode === "create") {
        await window.api.addClient(reviewName, reviewNote);
        setName("");
        setNote("");
      } else if (reviewMode === "edit" && editingId != null) {
        await window.api.updateClient(editingId, reviewName, reviewNote);
        cancelEdit();
      }
      await refreshClients();
      closeReview();
    } catch (err) {
      alert("Speichern fehlgeschlagen: " + (err as Error).message);
    }
  }
  function closeReview() {
    setReviewOpen(false);
    setReviewMode(null);
    setReviewName("");
    setReviewNote("");
  }

  async function removeClient(id: number) {
    const label = clientLabelForDelete(clients, id);
    if (!window.confirm(`Klient „${label}“ wirklich löschen?`)) return;
    if (editingId === id) cancelEdit();
    try {
      await window.api.deleteClient(id);
      // Optimistic Update
      setClients((prev) => prev.filter((c) => c.id !== id));
      // optional: void refreshClients()
    } catch (e) {
      alert("Löschen fehlgeschlagen: " + (e as Error).message);
    }
  }

  // ---- Tastatur-Handler ----
  const onEditKeyDown: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      openReviewForEdit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
    }
  };

  // ---- abgeleitet (Reihenfolge wichtig!) ----
  const filteredSorted = useMemo(
    () => filterAndSortClients(clients, query),
    [clients, query]
  );
  const count = filteredSorted.length;

  const addCheck = validateClientInput(name, note);
  const canAdd = addCheck.ok;
  const nameHas = name.trim().length > 0;
  const nameInputClass = `${styles.input} ${styles.narrowLg} ${
    !addCheck.ok ? styles.inputInvalid : nameHas ? styles.inputOk : ""
  }`;

  const nameOptions = useMemo(
    () => Array.from(new Set(clients.map((c) => c.name))).sort(),
    [clients]
  );

  const saveCheck = validateClientInput(draftName, draftNote);
  const canSave = saveCheck.ok;
  const reviewCheck = validateClientInput(reviewName, reviewNote);

  // Enter im Neu-Form
  const onCreateKeyDown: React.KeyboardEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    if (e.key === "Enter" && canAdd) {
      e.preventDefault();
      openReviewForCreate();
    }
  };

  // ---- UI ----
  return (
    <main className={styles.container}>
      {/* Header */}
      <div className={styles.headerWrap}>
        <img src="/notizia_logo.png" alt="Notizia" className={styles.logo} />
        <h1 className={styles.title}>
          Heilerfolge einfach sichtbar machen
        </h1>
      </div>

      {/* Neuer Klient */}
      <section className={`${styles.card} ${styles.formGrid}`}>
        <label>
          Name:{" "}
          <input
            className={nameInputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onCreateKeyDown}
            placeholder="Klientenname"
            autoComplete="name"
            enterKeyHint="go"
          />
        </label>
        {addCheck.errors.name && (
          <small className={styles.hint}>{addCheck.errors.name}</small>
        )}

        <label>
          Notiz:{" "}
          <AutoTextarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={onCreateKeyDown}
            className={`${styles.textarea} ${styles.input} ${
              addCheck.errors.note ? styles.inputInvalid : ""
            }`}
            placeholder="optional (max. 200 Zeichen)"
            enterKeyHint="done"
          />
        </label>
        {addCheck.errors.note && (
          <small className={styles.hint}>{addCheck.errors.note}</small>
        )}

        <div className={styles.actions}>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={openReviewForCreate}
            disabled={!canAdd}
          >
            Prüfen & speichern
          </button>
          {!canAdd && (
            <small className={styles.hint}>Bitte Eingaben prüfen</small>
          )}
        </div>
      </section>

      {/* Suche */}
      <section className={styles.form}>
        <label>
          Suche:{" "}
          <input
            className={`${styles.input} ${styles.narrowMd}`}
            list="clientNames"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name oder Notiz"
          />
        </label>
        <datalist id="clientNames">
          {nameOptions.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
        <div>
          {count} Klient{count === 1 ? "" : "en"}
        </div>
      </section>

      {/* Liste */}
      <ul className={styles.list}>
        {filteredSorted.map((c) => {
          const isEditing = c.id === editingId;
          return (
            <li
              key={c.id}
              className={`${styles.item} ${isEditing ? styles.editing : ""}`}
            >
              <div className={styles.row}>
                {/* Linke Spalte */}
                <div style={{ flex: 1 }}>
                  <strong>#{c.id}</strong>{" "}
                  {!isEditing ? (
                    <>
                      {c.name}
                      {c.notes ? (
                        <div className={styles.note}>
                          <div className={styles.noteLabel}>Notiz:</div>
                          <pre className={styles.notePre}>{c.notes}</pre>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <div className={styles.editFields}>
                      <label>
                        Name:{" "}
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          className={
                            saveCheck.errors.name ? styles.invalid : undefined
                          }
                        />
                      </label>
                      {saveCheck.errors.name && (
                        <small className={styles.hint}>
                          {saveCheck.errors.name}
                        </small>
                      )}

                      <label>
                        Notiz:{" "}
                        <AutoTextarea
                          value={draftNote}
                          onChange={(e) => setDraftNote(e.target.value)}
                          onKeyDown={onEditKeyDown}
                          className={`${styles.textarea} ${
                            saveCheck.errors.note ? styles.invalid : ""
                          }`}
                        />
                      </label>
                      {saveCheck.errors.note && (
                        <small className={styles.hint}>
                          {saveCheck.errors.note}
                        </small>
                      )}
                    </div>
                  )}
                </div>

                {/* Rechte Spalte: Buttons */}
                <div className={styles.actions}>
                  {!isEditing ? (
                    <>
                      <button onClick={() => startEdit(c)}>Bearbeiten</button>
                      <button onClick={() => removeClient(c.id)}>
                        Löschen
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={openReviewForEdit} disabled={!canSave}>
                        Speichern
                      </button>
                      <button
                        onClick={cancelEdit}
                        className={styles.btnSecondary}
                      >
                        Abbrechen
                      </button>
                    </>
                  )}
                </div>
              </div>{" "}
              {/* Ende .row */}
              {/* ▼ Fälle & Sitzungen */}
              {!isEditing && (
                <div style={{ marginTop: 10 }}>
                  <ClientCases clientId={c.id} />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {clients.length === 0 && (
        <p className={styles.hint}>Noch keine Klienten angelegt.</p>
      )}

      {/* Review-Dialog */}
      {reviewOpen && (
        <div className={styles.modalOverlay} onClick={closeReview}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              {reviewMode === "create"
                ? "Eingaben prüfen & speichern"
                : "Änderungen prüfen & speichern"}
            </div>
            <div className={styles.modalBody}>
              <label>
                Name:{" "}
                <input
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  className={
                    reviewCheck.errors.name ? styles.invalid : undefined
                  }
                />
              </label>
              {reviewCheck.errors.name && (
                <small className={styles.hint}>{reviewCheck.errors.name}</small>
              )}

              <label>
                Notiz:{" "}
                <AutoTextarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  className={`${styles.textarea} ${
                    reviewCheck.errors.note ? styles.invalid : ""
                  }`}
                />
              </label>
              {reviewCheck.errors.note && (
                <small className={styles.hint}>{reviewCheck.errors.note}</small>
              )}
            </div>
            <div className={styles.modalActions}>
              <button onClick={closeReview} className={styles.btnSecondary}>
                Zurück
              </button>
              <button onClick={confirmReview} disabled={!reviewCheck.ok}>
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
