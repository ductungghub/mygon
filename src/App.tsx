import { useEffect, useState } from 'react';

import { generateClient } from 'aws-amplify/api';

import { createTodo } from './graphql/mutations';
import { listTodos } from './graphql/queries';
import { type CreateTodoInput, type Todo } from './API';
import './App.css';
import { deleteTodo } from './graphql/mutations';

const initialState: CreateTodoInput = { name: '' };
const client = generateClient();

const App = () => {
  const [formState, setFormState] = useState<CreateTodoInput>(initialState);
  const [todos, setTodos] = useState<Todo[] | CreateTodoInput[]>([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  async function fetchTodos() {
    try {
      const todoData = await client.graphql({
        query: listTodos,
      });

      const todos = todoData.data.listTodos.items;
      setTodos(todos);
    } catch (err) {
      console.log('error fetching todos');
    }
  }

  async function addTodo() {
    try {
      if (!formState.name) return;

      // Fetch the maximum current sort value
      const todoCountData = await client.graphql({
        query: listTodos,
      });

      const currentMaxSort = Math.max(
        ...todoCountData.data.listTodos.items.map((todo) => todo.sort || 1)
      );

      // Create the new todo with an incremented sort value
      const newTodo = {
        ...formState,
        sort: currentMaxSort + 1,
      };

      // Update the local state
      setTodos([...todos, newTodo]);
      setFormState(initialState);

      // Create the todo on the server
      await client.graphql({
        query: createTodo,
        variables: {
          input: newTodo,
        },
      });

      // Refetch todos after adding a new todo
      fetchTodos();
    } catch (err) {
      console.log('error creating todo:', err);
    }
  }

  async function deleteTodoItem(id: any) {
    try {
      // Delete the todo on the server
      await client.graphql({
        query: deleteTodo,
        variables: {
          input: { id },
        },
      });

      // Update the local state by removing the deleted todo
      const updatedTodos = todos.filter((todo) => todo.id !== id);
      setTodos(updatedTodos);
    } catch (err) {
      console.log('error deleting todo:', err);
    }
  }

  return (
    <div className="container">
      <h2>Trời ơi em đang làm gì vậy?</h2>
      <input
        onChange={(event) =>
          setFormState({ ...formState, name: event.target.value })
        }
        style={{ color: 'black' }}
        className="input"
        value={formState.name}
        placeholder="Em đang ..."
      />

      <button className="button" onClick={addTodo}>
        Em trả lời tôi
      </button>
      {todos
        .slice() // Create a copy of the array to avoid mutating the original
        .sort((a: any, b: any) => b.sort - a.sort) // Sort the todos in descending order based on the sort value
        .map((todo, index) => (
          <div key={todo.id ? todo.id : index} className="todo">
            <span>Tin nhắn thứ {todo.sort} của em: </span>
            <span className="todoName">{todo.name}</span>
            <button
              style={{ marginLeft: '2rem', padding: '0.5rem' }}
              onClick={() => deleteTodoItem(todo.id)}
            >
              Em muốn xóa tin nhắn này
            </button>
          </div>
        ))}
      <div className="image-container" style={{ textAlign: 'center' }}>
        <img src="/em.jpg" style={{ width: '400px' }} alt="" />
      </div>
    </div>
  );
};

export default App;
