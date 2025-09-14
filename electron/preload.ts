// electron/preload.ts
import { contextBridge, ipcRenderer } from 'electron'
import type { Client, Case, Session } from '../src/shared/domain'

contextBridge.exposeInMainWorld('api', {
  // Clients
  listClients: () => ipcRenderer.invoke('clients:list') as Promise<Client[]>,
  addClient: (name: string, note: string | null) =>
    ipcRenderer.invoke('clients:add', { name, note }) as Promise<void>,
  updateClient: (id: number, name: string, note: string | null) =>
    ipcRenderer.invoke('clients:update', { id, name, note }) as Promise<void>,
  deleteClient: (id: number) =>
    ipcRenderer.invoke('clients:delete', id) as Promise<void>,

  // Cases
  listCases: (clientId: number) =>
    ipcRenderer.invoke('cases:list', clientId) as Promise<Case[]>,
  addCase: (c: {
    client_id: number
    problem_category: Case['problem_category']
    problem_text: string
    started_at: string
    status?: Case['status']
  }) => ipcRenderer.invoke('cases:add', c) as Promise<void>,
  updateCaseOutcome: (payload: {
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
  }) => ipcRenderer.invoke('cases:updateOutcome', payload) as Promise<void>,

  // Sessions
  listSessions: (caseId: number) =>
    ipcRenderer.invoke('sessions:list', caseId) as Promise<Session[]>,
  addSession: (s: Omit<Session, 'id'>) =>
    ipcRenderer.invoke('sessions:add', s) as Promise<void>,
  deleteSession: (id: number) =>
    ipcRenderer.invoke('sessions:delete', id) as Promise<void>,
})
