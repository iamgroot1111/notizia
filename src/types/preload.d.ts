import type { Client } from '../shared/domain'

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
export {}
