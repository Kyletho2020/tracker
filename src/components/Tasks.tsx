import React, { useState } from 'react';
import { Plus, Trash, Pencil } from 'lucide-react';
import { useTasks } from '../hooks/useTasks';
import type { Task } from '../types';

interface TasksProps {
  userId: string;
}

export function Tasks({ userId }: TasksProps) {
  const { tasks, addTask, updateTask, deleteTask } = useTasks(userId);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const handleAdd = async () => {
    if (!title.trim()) return;
    await addTask({
      title,
      description: '',
      completed: false,
      due_date: dueDate ? new Date(dueDate) : undefined,
    } as Omit<Task, 'id' | 'created_at'>);
    setTitle('');
    setDueDate('');
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDueDate(task.due_date ? task.due_date.toString().slice(0, 10) : '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await updateTask(editingId, {
      title: editTitle,
      due_date: editDueDate ? new Date(editDueDate) : undefined,
    });
    setEditingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h1>
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          />
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            onClick={handleAdd}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-4"
          >
            {editingId === task.id ? (
              <div className="flex-1 flex flex-col sm:flex-row gap-2">
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2"
                />
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2"
                />
                <button
                  onClick={saveEdit}
                  className="bg-indigo-600 text-white px-3 rounded-lg"
                >
                  Save
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => updateTask(task.id, { completed: !task.completed })}
                  className="form-checkbox h-5 w-5 text-indigo-600"
                />
                <div className="flex-1">
                  <p className={task.completed ? 'line-through text-gray-500' : 'text-gray-900'}>
                    {task.title}
                  </p>
                  {task.due_date && (
                    <p className="text-sm text-gray-500">
                      Due {new Date(task.due_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 ml-4">
              {editingId !== task.id && (
                <button
                  onClick={() => startEdit(task)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => deleteTask(task.id)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash className="w-4 h-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
