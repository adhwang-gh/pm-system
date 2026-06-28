import { createClient, type Client } from '@libsql/client'

let _client: Client | null = null

export function getTurso(): Client {
  if (_client) return _client
  _client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  })
  return _client
}

// Convert libsql Row objects to plain JS objects for safe JSON serialization
export function toRows(rows: ArrayLike<Record<string, unknown>>): Record<string, unknown>[] {
  return Array.from(rows).map(row => Object.fromEntries(Object.entries(row)))
}
