export type TodoNote = {
  clientId?: string
  id?: string
  name: string
  description: string
  completed?: boolean
}
export type TodoNoteState = {
  notes: TodoNote[]
  form: TodoNote
  loading: boolean
  error: boolean
}
export type TodoNoteAction = {
  type:
    | 'SET_NOTES'
    | 'ERROR'
    | 'ADD_NOTE'
    | 'RESET_FORM'
    | 'SET_INPUT'
    | 'DELETE_NOTE'
    | 'UPDATE_NOTE'
  notes?: TodoNote[]
  name?: keyof TodoNote
  value?: any
  note?: TodoNote
  id?: string
}
