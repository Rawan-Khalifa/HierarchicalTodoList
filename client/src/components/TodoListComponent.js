import React, { useEffect, useState } from 'react';
import { getTodoLists } from '../services/api';

const TodoListComponent = () => {
  const [todoLists, setTodoLists] = useState([]);

  useEffect(() => {
    const fetchTodoLists = async () => {
      const lists = await getTodoLists();
      setTodoLists(lists);
    };

    fetchTodoLists();
  }, []);

  return (
    <div>
      <h1>Your Todo Lists</h1>
      <ul>
        {todoLists.map(list => (
          <li key={list.id}>{list.title}</li>
        ))}
      </ul>
    </div>
  );
};

export default TodoListComponent;