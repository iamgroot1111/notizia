import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import { storage } from '../src/desktop/storage-sqlite'

// @vite-ignore: Pfade werden zur Laufzeit aufgelöst
const preloadPath   = fileURLToPath(/* @vite-ignore */ new URL('./preload.mjs', import.meta.url))
const indexHtmlPath = fileURLToPath(/* @vite-ignore */ new URL('../dist/index.html', import.meta.url))

async function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: { contextIsolation: true, preload: preloadPath },
  })

  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    await win.loadURL(devUrl)
    // bei Bedarf: win.webContents.openDevTools({ mode: 'detach' })
  } else {
    await win.loadFile(indexHtmlPath)
  }
}

function registerIpc() {
  ipcMain.handle('clients:list', async () => storage.listClients())
  ipcMain.handle('clients:add', async (_e, p: { name: string; note: string | null }) =>
    storage.addClient(p.name, p.note ?? null)
  )
  ipcMain.handle('clients:update', async (_e, p: { id: number; name: string; note: string | null }) =>
    storage.updateClient(p.id, p.name, p.note ?? null)
  )
  ipcMain.handle('clients:delete', async (_e, id: number) => storage.deleteClient(id))
}

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
