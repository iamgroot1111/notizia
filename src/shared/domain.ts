export type Client = {
    id: number
    name: string
    note?: string | null
}

export type Session = {
    id: number
    client_id: number
    startet_at: string
    duration_min?: number | null
    notes: string | null
}