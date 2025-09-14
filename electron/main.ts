// electron/main.ts
import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { storage } from '../src/desktop/storage-sqlite'
import type { Case, Session } from '../src/shared/domain'

// kleine Crash-Logs, helfen beim Debuggen
process.on('uncaughtException', (err) => console.error('[MAIN uncaught]', err))
process.on('unhandledRejection', (err) => console.error('[MAIN unhandled]', err))

// Pfade werden zur Laufzeit aufgelöst (in dist-electron/)
const preloadPath   = fileURLToPath(/* @vite-ignore */ new URL('./preload.mjs', import.meta.url))
const indexHtmlPath = fileURLToPath(/* @vite-ignore */ new URL('../dist/index.html', import.meta.url))

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      preload: preloadPath,
    },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    await win.loadURL(devUrl)
    // win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(indexHtmlPath)
  }
}

function registerIpc() {
  // ---------- Clients ----------
  ipcMain.handle('clients:list', () =>
    storage.listClients()
  )
  ipcMain.handle('clients:add', (_e, p: { name: string; note: string | null }) =>
    storage.addClient(p.name, p.note ?? null)
  )
  ipcMain.handle('clients:update', (_e, p: { id: number; name: string; note: string | null }) =>
    storage.updateClient(p.id, p.name, p.note ?? null)
  )
  ipcMain.handle('clients:delete', (_e, id: number) =>
    storage.deleteClient(id)
  )

  // ---------- Cases ----------
  ipcMain.handle('cases:list', (_e, clientId: number) =>
    storage.listCases(clientId)
  )
  ipcMain.handle(
    'cases:add',
    (_e, c: Pick<Case, 'client_id' | 'problem_category' | 'problem_text' | 'started_at'> & { status?: Case['status'] }) =>
      storage.addCase(c)
  )
  ipcMain.handle(
    'cases:updateOutcome',
    (_e, payload: {
      id: number
      status: Case['status']
      resolved_at?: string | null
      resolved_by_method?: Case['resolved_by_method']
      sessions_total?: number | null
      pc_self?: number | null
      pc_relationships?: number | null
      pc_world?: number | null
      symptom_change_pct?: number | null
      outcome_notes?: string | null
    }) => storage.updateCaseOutcome(payload)
  )

  // ---------- Sessions ----------
  ipcMain.handle('sessions:list', (_e, caseId: number) =>
    storage.listSessions(caseId)
  )
  ipcMain.handle('sessions:add', (_e, s: Omit<Session, 'id'>) =>
    storage.addSession(s)
  )
  ipcMain.handle('sessions:delete', (_e, id: number) =>
    storage.deleteSession(id)
  )
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
