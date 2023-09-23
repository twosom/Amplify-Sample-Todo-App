import React, { useEffect } from 'react'
import 'antd/dist/reset.css'
import { Button, Input, List } from 'antd'
import { TodoNote } from './types'
import useTodoReducer from './hooks/useTodoReducer'

const styles = {
  container: { padding: 20 },
  input: { marginBottom: 10 },
  item: { textAlign: 'left' },
  delete: { color: '#ff1d1d' },
  update: { color: '#1d77ff' },
}

const App = () => {
  const {
    state,
    fetchNotes,
    onChange,
    deleteNote,
    createNote,
    updateNote,
    subscriptionsSupplier,
  } = useTodoReducer()

  useEffect(() => {
    ;(async () => {
      await fetchNotes()
    })()
    const subscriptions = subscriptionsSupplier.get()
    return () => {
      subscriptions.forEach((subscription) => subscription.unsubscribe())
    }
  }, [])

  const renderItem = (item: TodoNote) => {
    return (
      <List.Item
        // @ts-ignore
        style={styles.item}
        actions={[
          <p style={styles.delete} onClick={() => deleteNote(item.id!)}>
            Delete
          </p>,
          <p style={styles.update} onClick={() => updateNote(item.id!)}>
            {item.completed ? 'completed' : 'mark completed'}
          </p>,
        ]}
      >
        <List.Item.Meta title={item.name} description={item.description} />
      </List.Item>
    )
  }

  return (
    <div style={styles.container}>
      <Input
        onChange={onChange}
        value={state.form.name}
        placeholder="Note Name"
        name="name"
        style={styles.input}
      />
      <Input
        onChange={onChange}
        value={state.form.description}
        placeholder="Note description"
        name="description"
        style={styles.input}
      />
      <Button onClick={createNote} type="primary">
        Create Note
      </Button>
      <List
        loading={state.loading}
        dataSource={state.notes}
        renderItem={renderItem}
      />
    </div>
  )
}

export default App
