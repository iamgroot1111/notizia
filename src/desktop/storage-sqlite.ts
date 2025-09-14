import path from 'node:path'
import { app } from 'electron'
import { createRequire } from 'node:module'
import type BetterSqlite from 'better-sqlite3'

// CJS-Require in ESM (wichtig für native Module wie better-sqlite3)
const require = createRequire(import.meta.url)
const Database = require('better-sqlite3') as typeof BetterSqlite

import type { Client, Case, Session } from '../shared/domain'

let db: BetterSqlite.Database | null = null

function getDb() {
  if (!db) {
    const file = path.join(app.getPath('userData'), 'notizia.db')
    db = new Database(file)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    db.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id    INTEGER PRIMARY KEY AUTOINCREMENT,
        name  TEXT NOT NULL CHECK(length(name) >= 2),
        note  TEXT
      );

      CREATE TABLE IF NOT EXISTS cases (
        id                 INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id          INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
        problem_category   TEXT    NOT NULL,
        problem_text       TEXT    NOT NULL,
        started_at         TEXT    NOT NULL,
        status             TEXT    NOT NULL CHECK(status IN ('open','resolved','dropped')),
        resolved_at        TEXT,
        resolved_by_method TEXT,
        sessions_total     INTEGER,
        pc_self            INTEGER,
        pc_relationships   INTEGER,
        pc_world           INTEGER,
        symptom_change_pct INTEGER,
        outcome_notes      TEXT
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id          INTEGER NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
        started_at       TEXT    NOT NULL,
        duration_min     INTEGER,
        method           TEXT    NOT NULL,
        ease_hypnosis    INTEGER,
        sud_before       INTEGER,
        sud_after        INTEGER,
        emotional_release TEXT,
        insights          TEXT,
        notes             TEXT
      );
    `)
  }
  return db!
}

export const storage = {
  // ---------- Clients ----------
  listClients(): Client[] {
    // Alias: note -> notes (passt zu deinem domain.ts / UI)
    return getDb()
      .prepare(`SELECT id, name, note AS notes FROM clients ORDER BY id DESC`)
      .all() as Client[]
  },

  addClient(name: string, note: string | null) {
    getDb()
      .prepare(`INSERT INTO clients (name, note) VALUES (?, ?)`)
      .run(name.trim(), note ?? null)
  },

  updateClient(id: number, name: string, note: string | null) {
    getDb()
      .prepare(`UPDATE clients SET name=?, note=? WHERE id=?`)
      .run(name.trim(), note ?? null, id)
  },

  deleteClient(id: number) {
    getDb().prepare(`DELETE FROM clients WHERE id=?`).run(id)
  },

  // ---------- Cases ----------
  listCases(clientId: number): Case[] {
    return getDb()
      .prepare(`SELECT * FROM cases WHERE client_id=? ORDER BY started_at DESC`)
      .all(clientId) as Case[]
  },

  addCase(c: {
    client_id: number
    problem_category: string
    problem_text: string
    started_at: string
    status?: string
  }) {
    const status = c.status ?? 'open'
    getDb()
      .prepare(
        `INSERT INTO cases (client_id, problem_category, problem_text, started_at, status)
         VALUES (?,?,?,?,?)`
      )
      .run(c.client_id, c.problem_category, c.problem_text, c.started_at, status)
  },

  updateCaseOutcome(payload: {
    id: number
    status: 'open' | 'resolved' | 'dropped'
    resolved_at?: string | null
    resolved_by_method?: string | null
    sessions_total?: number | null
    pc_self?: number | null
    pc_relationships?: number | null
    pc_world?: number | null
    symptom_change_pct?: number | null
    outcome_notes?: string | null
  }) {
    const {
      id, status,
      resolved_at = null,
      resolved_by_method = null,
      sessions_total = null,
      pc_self = null, pc_relationships = null, pc_world = null,
      symptom_change_pct = null,
      outcome_notes = null,
    } = payload

    getDb()
      .prepare(
        `UPDATE cases
         SET status=?, resolved_at=?, resolved_by_method=?, sessions_total=?,
             pc_self=?, pc_relationships=?, pc_world=?, symptom_change_pct=?, outcome_notes=?
         WHERE id=?`
      )
      .run(
        status, resolved_at, resolved_by_method, sessions_total,
        pc_self, pc_relationships, pc_world, symptom_change_pct, outcome_notes,
        id
      )
  },

  // ---------- Sessions ----------
  listSessions(caseId: number): Session[] {
    return getDb()
      .prepare(`SELECT * FROM sessions WHERE case_id=? ORDER BY started_at DESC`)
      .all(caseId) as Session[]
  },

  addSession(s: Omit<Session, 'id'>) {
    getDb()
      .prepare(
        `INSERT INTO sessions
         (case_id, started_at, duration_min, method, ease_hypnosis, sud_before, sud_after, emotional_release, insights, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
      )
      .run(
        s.case_id,
        s.started_at,
        s.duration_min ?? null,
        s.method,
        s.ease_hypnosis ?? null,
        s.sud_before ?? null,
        s.sud_after ?? null,
        s.emotional_release ?? null,
        s.insights ?? null,
        s.notes ?? null
      )
  },

  deleteSession(id: number) {
    getDb().prepare(`DELETE FROM sessions WHERE id=?`).run(id)
  },
}
