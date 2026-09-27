export type Session = { session_id: string; method?: string; created_at?: string };
export function sessionsToSignOut(sessions: Session[], currentSessionId: string): Session[] {
  return sessions.filter((session) => session.session_id !== currentSessionId);
}
