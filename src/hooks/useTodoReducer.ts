import { TodoNote, TodoNoteAction, TodoNoteState } from '../types'
import { useReducer } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { listNotes } from '../graphql/queries'
import { v4 as uuid } from 'uuid'
import {
  createNote as CreateNote,
  deleteNote as DeleteNote,
  updateNote as UpdateNote,
} from '../graphql/mutations'
import {
  onCreateNote,
  onDeleteNote,
  onUpdateNote,
} from '../graphql/subscriptions'
import { GraphQLSubscription } from '@aws-amplify/api'
import {
  OnCreateNoteSubscription,
  OnDeleteNoteSubscription,
  OnUpdateNoteSubscription,
} from '../API'

const CLIENT_ID: string = uuid()
const initialState: TodoNoteState = {
  notes: [],
  loading: true,
  error: false,
  form: {
    name: '',
    description: '',
  },
}

const reducer = (
  state: TodoNoteState,
  action: TodoNoteAction,
): TodoNoteState => {
  switch (action.type) {
    case 'SET_NOTES':
      return { ...state, notes: action.notes ?? [], loading: false }
    case 'ERROR':
      return { ...state, loading: false, error: true }
    case 'ADD_NOTE':
      return { ...state, notes: [action.note!, ...state.notes] }
    case 'RESET_FORM':
      return { ...state, form: initialState.form }
    case 'SET_INPUT':
      return { ...state, form: { ...state.form, [action.name!]: action.value } }
    case 'DELETE_NOTE':
      return {
        ...state,
        notes: state.notes.filter((note) => note.id !== action.id),
      }
    case 'UPDATE_NOTE':
      return {
        ...state,
        notes: state.notes.map((note) => {
          if (note.id !== action.note!.id) return note
          return action.note!
        }),
      }
    default:
      return state
  }
}

const useTodoReducer = () => {
  const [state, dispatch] = useReducer(reducer, initialState)
  const onChange = (e: any) => {
    dispatch({ type: 'SET_INPUT', name: e.target.name, value: e.target.value })
  }

  const subscriptionsSupplier = {
    get: () => {
      return [
        /**
         * 투두 생성 구독
         */
        API.graphql<GraphQLSubscription<OnCreateNoteSubscription>>(
          graphqlOperation(onCreateNote),
        ).subscribe({
          next(noteData) {
            const note = noteData.value.data!.onCreateNote! as TodoNote
            if (CLIENT_ID === note.clientId) return
            dispatch({ type: 'ADD_NOTE', note })
          },
          error: (error) => console.warn(error),
        }),

        /**
         * 투두 삭제 구독
         */
        API.graphql<GraphQLSubscription<OnDeleteNoteSubscription>>(
          graphqlOperation(onDeleteNote),
        ).subscribe({
          next(noteData) {
            const { id } = noteData.value.data!.onDeleteNote!
            dispatch({ type: 'DELETE_NOTE', id })
          },
          error: (error) => console.warn(error),
        }),

        /**
         * 투두 업데이트 구독
         */
        API.graphql<GraphQLSubscription<OnUpdateNoteSubscription>>(
          graphqlOperation(onUpdateNote),
        ).subscribe({
          next(noteData) {
            const note = noteData.value.data!.onUpdateNote! as TodoNote
            dispatch({ type: 'UPDATE_NOTE', note })
          },
        }),
      ]
    },
  }

  const fetchNotes = async () => {
    try {
      const notesData = await API.graphql({
        query: listNotes,
      })
      console.log(notesData)
      // @ts-ignore
      dispatch({ type: 'SET_NOTES', notes: notesData.data.listNotes.items })
    } catch (err) {
      console.log('error: ', err)
      dispatch({ type: 'ERROR', notes: [] })
    }
  }
  const createNote = async () => {
    const { form } = state
    if (!form.name || !form.description)
      return alert('please enter a name and description')
    const note = { ...form, clientId: CLIENT_ID, completed: false, id: uuid() }
    dispatch({ type: 'ADD_NOTE', note })
    dispatch({ type: 'RESET_FORM' })
    try {
      await API.graphql({
        authMode: 'API_KEY',
        query: CreateNote,
        variables: {
          input: note,
        },
      })
      console.log('successfully created note!')
    } catch (err) {
      console.log('error: ', err)
    }
  }
  const deleteNote = async (id: string) => {
    dispatch({ type: 'DELETE_NOTE', id })
    try {
      await API.graphql({
        query: DeleteNote,
        variables: {
          input: { id },
        },
      })
    } catch (err) {
      console.log(err)
    }
  }
  const updateNote = async (id: string) => {
    const index = state.notes.findIndex((note) => note.id === id)
    const notes = [...state.notes]
    const selectedNote = notes[index]
    selectedNote.completed = !selectedNote.completed
    dispatch({ type: 'SET_NOTES', notes })

    try {
      await API.graphql({
        query: UpdateNote,
        variables: {
          input: {
            id,
            completed: selectedNote.completed,
          },
        },
      })
      console.log('note successfully updated!')
    } catch (err) {
      console.log('error: ', err)
    }
  }

  return {
    state,
    fetchNotes,
    onChange,
    createNote,
    deleteNote,
    updateNote,
    subscriptionsSupplier,
    dispatch,
  }
}

export default useTodoReducer
