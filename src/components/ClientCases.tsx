import type React from 'react'
import { useCallback, useEffect, useState } from 'react'
import type { Case, Session } from '../shared/domain'
import styles from '../App.module.css'

const PROBLEMS: Case['problem_category'][] = [
  'overweight','social_anxiety','panic','depression','sleep','pain','self_worth','relationship','other'
]
const METHODS: Session['method'][] = ['aufloesende_hypnose','klassische_hypnose','coaching','other']

type Props = { clientId: number }

export default function ClientCases({ clientId }: Props) {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)

  // Neues Case (Form)
  const [pcat, setPcat] = useState<Case['problem_category']>('other')
  const [ptext, setPtext] = useState('')

  // UI: aufgeklappte Case-ID
  const [openCaseId, setOpenCaseId] = useState<number | null>(null)

  // Sessions pro Case
  const [sessionsByCase, setSessionsByCase] = useState<Record<number, Session[]>>({})

  // ---------- Daten laden ----------
  const refreshCases = useCallback(async () => {
    setLoading(true)
    const list = await window.api.listCases(clientId)
    setCases(list)
    setLoading(false)
  }, [clientId])

  useEffect(() => { refreshCases() }, [refreshCases])

  // ---------- Case anlegen ----------
  async function addCase() {
    if (!ptext.trim()) return
    await window.api.addCase({
      client_id: clientId,
      problem_category: pcat,
      problem_text: ptext.trim(),
      started_at: new Date().toISOString(),
    })
    setPcat('other'); setPtext('')
    await refreshCases()
  }

  const onNewCaseKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter' && ptext.trim()) { e.preventDefault(); void addCase() }
  }

  // ---------- Sessions ----------
  async function toggleSessions(caseId: number) {
    if (openCaseId === caseId) { setOpenCaseId(null); return }
    setOpenCaseId(caseId)
    const list = await window.api.listSessions(caseId)
    setSessionsByCase(prev => ({ ...prev, [caseId]: list }))
  }

  // ein Satz Eingabefelder (für das aktuell aufgeklappte Case)
  const [sMethod, setSMethod] = useState<Session['method']>('aufloesende_hypnose')
  const [sBefore, setSBefore] = useState<number | ''>('')
  const [sAfter,  setSAfter]  = useState<number | ''>('')
  const [sDur,    setSDur]    = useState<number | ''>('')
  const [sEase,   setSEase]   = useState<number | ''>('')

  async function addSession(caseId: number) {
    await window.api.addSession({
      case_id: caseId,
      started_at: new Date().toISOString(),
      duration_min: sDur === '' ? null : Number(sDur),
      method: sMethod,
      ease_hypnosis: sEase === '' ? null : Number(sEase),
      sud_before: sBefore === '' ? null : Number(sBefore),
      sud_after:  sAfter === '' ? null : Number(sAfter),
      emotional_release: null,
      insights: null,
      notes: null,
    })
    setSDur(''); setSEase(''); setSBefore(''); setSAfter('')
    const list = await window.api.listSessions(caseId)
    setSessionsByCase(prev => ({ ...prev, [caseId]: list }))
  }

  const onNewSessionKeyDown: React.KeyboardEventHandler<HTMLInputElement | HTMLSelectElement> = (e) => {
    if (e.key === 'Enter' && openCaseId != null) { e.preventDefault(); void addSession(openCaseId) }
  }

  // ---------- UI ----------
  return (
    <div className={styles.caseBlock}>
      {/* Neuer Fall */}
      <div className={styles.card}>
        <div className={styles.header}>
          <strong>Neuer Fall</strong>
          <span className={styles.tag}>{pcat}</span>
        </div>
        <div className={styles.rowGrid}>
          <div className={styles.kv}>
            <div>Problem</div>
            <select value={pcat} onChange={e => setPcat(e.target.value as Case['problem_category'])}>
              {PROBLEMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className={styles.kv}>
            <div>Beschreibung</div>
            <input
              placeholder="Problem kurz beschreiben"
              value={ptext}
              onChange={e => setPtext(e.target.value)}
              onKeyDown={onNewCaseKeyDown}
            />
          </div>
        </div>
        <div className={styles.toolbar}>
          <button onClick={addCase} disabled={!ptext.trim()}>Fall anlegen</button>
          {loading && <span style={{opacity:.7}}>…laden</span>}
        </div>
      </div>

      {/* Fälle */}
      <div style={{ marginTop: 10 }}>
        <strong>Fälle</strong>
        <ul style={{ listStyle:'none', padding:0, display:'grid', gap:8 }}>
          {cases.map(cs => (
            <li key={cs.id} className={styles.card}>
              <div className={styles.header}>
                <div>
                  <div><strong>#{cs.id}</strong> · {cs.problem_category} · <em>{new Date(cs.started_at).toLocaleDateString()}</em></div>
                  <div style={{opacity:.85}}>{cs.problem_text}</div>
                  <div style={{opacity:.7}}>Status: {cs.status}</div>
                </div>
                <div className={styles.toolbar}>
                  <button onClick={() => toggleSessions(cs.id)}>
                    {openCaseId === cs.id ? 'Sitzungen schließen' : 'Sitzungen zeigen'}
                  </button>
                </div>
              </div>

              {openCaseId === cs.id && (
                <div style={{ marginTop: 8, display:'grid', gap:8 }}>
                  {/* Session-Form */}
                  <div className={styles.rowGrid}>
                    <div className={styles.kv}>
                      <div>Methode</div>
                      <select value={sMethod}
                              onChange={e => setSMethod(e.target.value as Session['method'])}
                              onKeyDown={onNewSessionKeyDown}>
                        {METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div className={styles.kv}>
                      <div>Dauer (min)</div>
                      <input type="number" min={0}
                             value={sDur}
                             onChange={e => setSDur(e.target.value === '' ? '' : Number(e.target.value))}
                             onKeyDown={onNewSessionKeyDown}/>
                    </div>
                    <div className={styles.kv}>
                      <div>SUD vor</div>
                      <input type="number" min={0} max={10}
                             value={sBefore}
                             onChange={e => setSBefore(e.target.value === '' ? '' : Number(e.target.value))}
                             onKeyDown={onNewSessionKeyDown}/>
                    </div>
                    <div className={styles.kv}>
                      <div>SUD nach</div>
                      <input type="number" min={0} max={10}
                             value={sAfter}
                             onChange={e => setSAfter(e.target.value === '' ? '' : Number(e.target.value))}
                             onKeyDown={onNewSessionKeyDown}/>
                    </div>
                    <div className={styles.kv}>
                      <div>Leichtigkeit (1–5)</div>
                      <input type="number" min={1} max={5}
                             value={sEase}
                             onChange={e => setSEase(e.target.value === '' ? '' : Number(e.target.value))}
                             onKeyDown={onNewSessionKeyDown}/>
                    </div>
                  </div>
                  <div className={styles.toolbar}>
                    <button onClick={() => addSession(cs.id)}>Sitzung hinzufügen</button>
                  </div>

                  {/* Session-Liste */}
                  <ul style={{ listStyle:'none', padding:0, display:'grid', gap:6 }}>
                    {(sessionsByCase[cs.id] ?? []).map(s => (
                      <li key={s.id} className={styles.card} style={{ padding:8 }}>
                        <div><strong>{new Date(s.started_at).toLocaleString()}</strong> · {s.method}</div>
                        <div style={{opacity:.8}}>
                          Dauer: {s.duration_min ?? '–'} min ·
                          SUD: {s.sud_before ?? '–'} → {s.sud_after ?? '–'} ·
                          Leichtigkeit: {s.ease_hypnosis ?? '–'}
                        </div>
                      </li>
                    ))}
                    {(!sessionsByCase[cs.id] || sessionsByCase[cs.id].length === 0) && (
                      <li style={{opacity:.7}}>Noch keine Sitzungen.</li>
                    )}
                  </ul>
                </div>
              )}
            </li>
          ))}
          {cases.length === 0 && <li style={{opacity:.7}}>Noch keine Fälle.</li>}
        </ul>
      </div>
    </div>
  )
}
