import { contextBridge, ipcRenderer } from 'electron'
import type { Client } from '../src/shared/domain'

contextBridge.exposeInMainWorld('api', {
  listClients: () => ipcRenderer.invoke('clients:list') as Promise<Client[]>,
  addClient: (name: string, note: string | null) =>
    ipcRenderer.invoke('clients:add', { name, note }) as Promise<void>,
  updateClient: (id: number, name: string, note: string | null) =>
    ipcRenderer.invoke('clients:update', { id, name, note }) as Promise<void>,
  deleteClient: (id: number) =>
    ipcRenderer.invoke('clients:delete', id) as Promise<void>,
})

declare global {
  interface Window {
    api: {
      listClients(): Promise<Client[]>
      addClient(name: string, note: string | null): Promise<void>
      updateClient(id: number, name: string, note: string | null): Promise<void>
      deleteClient(id: number): Promise<void>
    }
  }
}
