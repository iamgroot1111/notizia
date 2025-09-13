import path from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'
import type BetterSqlite from 'better-sqlite3'

// ← Wichtig: CJS-Require in ESM, damit nichts gebündelt wird.
const require = createRequire(import.meta.url)
const Database = require('better-sqlite3') as typeof BetterSqlite

import type { Client } from '../shared/domain'

let db: BetterSqlite.Database | null = null

function getDb() {
  if (!db) {
    const file = path.join(app.getPath('userData'), 'notizia.db')
    db = new Database(file)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) >= 2),
        note TEXT
      );
    `)
  }
  return db!
}

export const storage = {
  listClients(): Client[] {
    return getDb().prepare('SELECT id, name, note FROM clients ORDER BY id DESC').all() as Client[]
  },
  addClient(name: string, note: string | null) {
    getDb().prepare('INSERT INTO clients (name, note) VALUES (?, ?)').run(name.trim(), note ?? null)
  },
  updateClient(id: number, name: string, note: string | null) {
    getDb().prepare('UPDATE clients SET name=?, note=? WHERE id=?').run(name.trim(), note ?? null, id)
  },
  deleteClient(id: number) {
    getDb().prepare('DELETE FROM clients WHERE id=?').run(id)
  },
}
