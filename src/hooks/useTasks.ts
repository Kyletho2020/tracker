import { useState, useEffect } from 'react';
import type { Task } from '../types';
import { dbHelpers } from '../lib/supabase';

export function useTasks(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      try {
        const data = await dbHelpers.getTasks(userId);
        setTasks(data || []);
      } catch (err) {
        console.error('Failed to load tasks:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const addTask = async (task: Omit<Task, 'id' | 'created_at'>) => {
    if (!userId) return;
    const newTask = await dbHelpers.createTask({ ...task, user_id: userId });
    setTasks((prev) => [...prev, newTask]);
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const updated = await dbHelpers.updateTask(id, updates);
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id: string) => {
    await dbHelpers.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return { tasks, loading, addTask, updateTask, deleteTask };
}
