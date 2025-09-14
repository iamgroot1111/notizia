// src/types/preload.d.ts
import type { Client, Case, Session } from '../shared/domain'

declare global {
  interface Window {
    api: {
      // Clients
      listClients(): Promise<Client[]>
      addClient(name: string, note: string | null): Promise<void>
      updateClient(id: number, name: string, note: string | null): Promise<void>
      deleteClient(id: number): Promise<void>

      // Cases
      listCases(clientId: number): Promise<Case[]>
      addCase(c: {
        client_id: number
        problem_category: Case['problem_category']
        problem_text: string
        started_at: string
        status?: Case['status']
      }): Promise<void>
      updateCaseOutcome(payload: {
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
      }): Promise<void>

      // Sessions
      listSessions(caseId: number): Promise<Session[]>
      addSession(s: Omit<Session, 'id'>): Promise<void>
      deleteSession(id: number): Promise<void>
    }
  }
}
export {}
