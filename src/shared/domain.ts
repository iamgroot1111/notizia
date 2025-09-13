// Optional: Wiederverwendbare „Enums“ als Typen
export type ProblemCategory =
  | "overweight"
  | "social_anxiety"
  | "panic"
  | "depression"
  | "sleep"
  | "pain"
  | "self_worth"
  | "relationship"
  | "other";

export type Method =
  | "aufloesende_hypnose"
  | "klassische_hypnose"
  | "coaching"
  | "other";

export type CaseStatus = "open" | "resolved" | "dropped";

export type Client = {
  id: number;
  name: string;
  birthdate?: string | null;
  notes?: string | null;
};

export type Case = {
  id: number;
  client_id: number;
  problem_category: ProblemCategory;
  problem_text: string;
  started_at: string; // ISO-8601
  baseline_sud?: number | null; // 0..10
  prior_therapies?: string | null;
  prior_therapies_months?: number | null;
  status: CaseStatus;
  resolved_at?: string | null;
  resolved_by_method?: Method | null;
  sessions_total?: number | null;
  pc_self?: number | null; // -2..+2
  pc_relationships?: number | null; // -2..+2
  pc_world?: number | null; // -2..+2
  symptom_change_pct?: number | null; // 0..100
  outcome_notes?: string | null;
};

export type Session = {
  id: number;
  case_id: number; // ← statt client_id
  started_at: string; // ← Tippfehler behoben
  duration_min?: number | null;
  method: Method;
  ease_hypnosis?: number | null; // 1..5
  sud_before?: number | null; // 0..10
  sud_after?: number | null; // 0..10
  emotional_release?: string | null;
  insights?: string | null;
  notes?: string | null; // ← optional
};
