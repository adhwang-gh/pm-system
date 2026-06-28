export interface Page {
  id: string
  title: string
  content: string
  parent_id: string | null
  icon: string
  is_database: number
  created_at: string
  updated_at: string
}

export interface DbColumn {
  id: string
  page_id: string
  name: string
  type: 'text' | 'number' | 'select' | 'date' | 'checkbox'
  options: string[]
  position: number
}

export interface DbRow {
  id: string
  page_id: string
  data: Record<string, string | number | boolean>
  position: number
  created_at: string
}

export type ViewType = 'table' | 'kanban' | 'list'
