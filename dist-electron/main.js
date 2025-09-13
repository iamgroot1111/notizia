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
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) >= 2),
        note TEXT
      );
    `);
  }
  return db;
}
const storage = {
  listClients() {
    return getDb().prepare("SELECT id, name, note FROM clients ORDER BY id DESC").all();
  },
  addClient(name, note) {
    getDb().prepare("INSERT INTO clients (name, note) VALUES (?, ?)").run(name.trim(), note ?? null);
  },
  updateClient(id, name, note) {
    getDb().prepare("UPDATE clients SET name=?, note=? WHERE id=?").run(name.trim(), note ?? null, id);
  },
  deleteClient(id) {
    getDb().prepare("DELETE FROM clients WHERE id=?").run(id);
  }
};
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
    webPreferences: { contextIsolation: true, preload: preloadPath }
  });
  const devUrl = process.env.VITE_DEV_SERVER_URL;
  if (devUrl) {
    await win.loadURL(devUrl);
  } else {
    await win.loadFile(indexHtmlPath);
  }
}
function registerIpc() {
  ipcMain.handle("clients:list", async () => storage.listClients());
  ipcMain.handle(
    "clients:add",
    async (_e, p) => storage.addClient(p.name, p.note ?? null)
  );
  ipcMain.handle(
    "clients:update",
    async (_e, p) => storage.updateClient(p.id, p.name, p.note ?? null)
  );
  ipcMain.handle("clients:delete", async (_e, id) => storage.deleteClient(id));
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
