import { app, BrowserWindow, ipcMain } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createRequire } from "node:module";
const require2 = createRequire(import.meta.url);
const Database = require2("better-sqlite3");
let db = null;
function getDb() {
  if (!db) {
    const file = path.join(app.getPath("userData"), "notizia.db");
    db = new Database(file);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
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
    `);
  }
  return db;
}
const storage = {
  // ---------- Clients ----------
  listClients() {
    return getDb().prepare(`SELECT id, name, note AS notes FROM clients ORDER BY id DESC`).all();
  },
  addClient(name, note) {
    getDb().prepare(`INSERT INTO clients (name, note) VALUES (?, ?)`).run(name.trim(), note ?? null);
  },
  updateClient(id, name, note) {
    getDb().prepare(`UPDATE clients SET name=?, note=? WHERE id=?`).run(name.trim(), note ?? null, id);
  },
  deleteClient(id) {
    getDb().prepare(`DELETE FROM clients WHERE id=?`).run(id);
  },
  // ---------- Cases ----------
  listCases(clientId) {
    return getDb().prepare(`SELECT * FROM cases WHERE client_id=? ORDER BY started_at DESC`).all(clientId);
  },
  addCase(c) {
    const status = c.status ?? "open";
    getDb().prepare(
      `INSERT INTO cases (client_id, problem_category, problem_text, started_at, status)
         VALUES (?,?,?,?,?)`
    ).run(c.client_id, c.problem_category, c.problem_text, c.started_at, status);
  },
  updateCaseOutcome(payload) {
    const {
      id,
      status,
      resolved_at = null,
      resolved_by_method = null,
      sessions_total = null,
      pc_self = null,
      pc_relationships = null,
      pc_world = null,
      symptom_change_pct = null,
      outcome_notes = null
    } = payload;
    getDb().prepare(
      `UPDATE cases
         SET status=?, resolved_at=?, resolved_by_method=?, sessions_total=?,
             pc_self=?, pc_relationships=?, pc_world=?, symptom_change_pct=?, outcome_notes=?
         WHERE id=?`
    ).run(
      status,
      resolved_at,
      resolved_by_method,
      sessions_total,
      pc_self,
      pc_relationships,
      pc_world,
      symptom_change_pct,
      outcome_notes,
      id
    );
  },
  // ---------- Sessions ----------
  listSessions(caseId) {
    return getDb().prepare(`SELECT * FROM sessions WHERE case_id=? ORDER BY started_at DESC`).all(caseId);
  },
  addSession(s) {
    getDb().prepare(
      `INSERT INTO sessions
         (case_id, started_at, duration_min, method, ease_hypnosis, sud_before, sud_after, emotional_release, insights, notes)
         VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).run(
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
    );
  },
  deleteSession(id) {
    getDb().prepare(`DELETE FROM sessions WHERE id=?`).run(id);
  }
};
process.on("uncaughtException", (err) => console.error("[MAIN uncaught]", err));
process.on("unhandledRejection", (err) => console.error("[MAIN unhandled]", err));
const preloadPath = fileURLToPath(
  /* @vite-ignore */
  new URL("./preload.mjs", import.meta.url)
);
const indexHtmlPath = fileURLToPath(
  /* @vite-ignore */
  new URL("../dist/index.html", import.meta.url)
);
async function createWindow() {
  const win = new BrowserWindow({
    width: 1e3,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath
    }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await win.loadURL(devUrl);
  } else {
    await win.loadFile(indexHtmlPath);
  }
}
function registerIpc() {
  ipcMain.handle(
    "clients:list",
    () => storage.listClients()
  );
  ipcMain.handle(
    "clients:add",
    (_e, p) => storage.addClient(p.name, p.note ?? null)
  );
  ipcMain.handle(
    "clients:update",
    (_e, p) => storage.updateClient(p.id, p.name, p.note ?? null)
  );
  ipcMain.handle(
    "clients:delete",
    (_e, id) => storage.deleteClient(id)
  );
  ipcMain.handle(
    "cases:list",
    (_e, clientId) => storage.listCases(clientId)
  );
  ipcMain.handle(
    "cases:add",
    (_e, c) => storage.addCase(c)
  );
  ipcMain.handle(
    "cases:updateOutcome",
    (_e, payload) => storage.updateCaseOutcome(payload)
  );
  ipcMain.handle(
    "sessions:list",
    (_e, caseId) => storage.listSessions(caseId)
  );
  ipcMain.handle(
    "sessions:add",
    (_e, s) => storage.addSession(s)
  );
  ipcMain.handle(
    "sessions:delete",
    (_e, id) => storage.deleteSession(id)
  );
}
app.whenReady().then(() => {
  registerIpc();
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
