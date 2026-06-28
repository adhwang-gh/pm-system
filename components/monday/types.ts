export interface MBoard { id: string; title: string; description: string; created_at: string }
export interface MGroup { id: string; board_id: string; title: string; color: string; position: number; collapsed: number }
export interface MColumn {
  id: string; board_id: string; title: string
  type: 'text' | 'person' | 'status' | 'timeline' | 'number' | 'date' | 'link'
  options: { values?: string[]; colors?: Record<string, string> } | string[]
  width: number; position: number
}
export interface MItem {
  id: string; board_id: string; group_id: string; title: string
  data: Record<string, string | number>
  position: number; created_at: string
}
