// src/shared/clients.ts
import type { Client } from './domain'

// --- kleine Helfer ---
export const normalize = (s: string) => s.trim()
export const sanitizeNote = (note: string) => {
  const n = note.trim()
  return n ? n : null
}

// --- Validierung für Eingaben (Name Pflicht >= 2; Notiz max 200) ---
export function validateClientInput(name: string, note: string) {
  const errors: { name?: string; note?: string } = {}
  const n = normalize(name)
  const nn = note.trim()

  if (!n) errors.name = 'Name ist erforderlich'
  else if (n.length < 2) errors.name = 'Mindestens 2 Zeichen'

  if (nn.length > 200) errors.note = 'Maximal 200 Zeichen erlaubt'

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: { name: n, note: nn }, // bereinigt (ohne Null-Konvertierung)
  }
}

// --- IDs & Erzeugen ---
export function computeNextId(list: Client[]): number {
  return list.length ? Math.max(...list.map(c => c.id)) + 1 : 1
}

export function makeClient(list: Client[], name: string, note: string): Client {
  return {
    id: computeNextId(list),
    name: normalize(name),
    note: sanitizeNote(note),
  }
}

// --- CRUD (unveränderlich) ---
export function addClientImmutable(list: Client[], name: string, note: string): Client[] {
  const c = makeClient(list, name, note)
  return [c, ...list]
}

export function updateClientImmutable(list: Client[], id: number, name: string, note: string): Client[] {
  const n = normalize(name)
  const nn = sanitizeNote(note)
  return list.map(c => (c.id === id ? { ...c, name: n, note: nn } : c))
}

export function removeClientById(list: Client[], id: number): Client[] {
  return list.filter(c => c.id !== id)
}

// --- Suche/Filter/Sort ---
export function normalizeQuery(query: string): string {
  return query.trim().toLowerCase()
}

export function matchesClient(c: Client, q: string): boolean {
  const name = c.name.toLowerCase()
  const note = (c.note ?? '').toLowerCase()
  return name.includes(q) || note.includes(q)
}

export function filterAndSortClients(list: Client[], query: string): Client[] {
  const q = normalizeQuery(query)
  const base = q ? list.filter(c => matchesClient(c, q)) : list
  return [...base].sort((a, b) => b.id - a.id)
}

// --- Finder/Label (UI-Helfer, aber plattformneutral) ---
export function findClientById(list: Client[], id: number): Client | undefined {
  return list.find(c => c.id === id)
}

export function clientLabelForDelete(list: Client[], id: number): string {
  const c = findClientById(list, id)
  return c ? `${c.name} (#${c.id})` : `#${id}`
}
