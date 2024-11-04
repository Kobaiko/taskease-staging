import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Layout, Sun, Moon, User } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProfilePopup } from '../components/ProfilePopup';
import { CreditDisplay } from '../components/CreditDisplay';
import { fireConfetti } from '../lib/confetti';
import { useAuth } from '../contexts/AuthContext';
import { getUserTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { saveUserTheme, getUserTheme } from '../services/userService';
import { getUserCredits } from '../services/creditService';
import type { Task, SubTask } from '../types';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadUserTheme();
      loadUserCredits();
    }
  }, [currentUser]);

  const loadUserCredits = async () => {
    if (!currentUser) return;
    const userCredits = await getUserCredits(currentUser.uid);
    setCredits(userCredits);
  };

  const loadUserTheme = async () => {
    if (!currentUser) return;
    const theme = await getUserTheme(currentUser.uid);
    if (theme) {
      setIsDark(theme === 'dark');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  };

  const loadTasks = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userTasks = await getUserTasks(currentUser.uid);
      const sortedTasks = userTasks.sort((a, b) => {
        const dateA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt.seconds * 1000);
        const dateB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt.seconds * 1000);
        return dateB.getTime() - dateA.getTime();
      });
      setTasks(sortedTasks);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    const newTask: Task = {
      id: crypto.randomUUID(), // Temporary ID for optimistic update
      title,
      description,
      subTasks,
      createdAt: new Date(),
      completed: false,
      userId: currentUser.uid
    };

    // Optimistic update
    setTasks(prevTasks => [newTask, ...prevTasks]);

    try {
      // Actual API call
      const taskId = await createTask(currentUser.uid, newTask);
      // Update the temporary ID with the real one
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === newTask.id ? { ...task, id: taskId } : task
      ));
      await loadUserCredits();
    } catch (error) {
      // Rollback on error
      setTasks(prevTasks => prevTasks.filter(task => task.id !== newTask.id));
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    // Find the task and update it locally first
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    
    const allCompleted = updatedSubTasks.every(st => st.completed);
    if (allCompleted && !task.completed) {
      fireConfetti();
    }

    // Optimistic update
    const updatedTask = {
      ...task,
      subTasks: updatedSubTasks,
      completed: allCompleted
    };

    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? updatedTask : t
    ));

    try {
      // Sync with backend
      await updateTask(taskId, {
        subTasks: updatedSubTasks,
        completed: allCompleted
      });
    } catch (error) {
      // Rollback on error
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? task : t
      ));
      console.error('Failed to update task:', error);
    }
  }, [tasks]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    // Store the task before removal for potential rollback
    const taskToDelete = tasks.find(t => t.id === taskId);
    if (!taskToDelete) return;

    // Optimistic update
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));

    try {
      await deleteTask(taskId);
    } catch (error) {
      // Rollback on error
      setTasks(prevTasks => [...prevTasks, taskToDelete]);
      console.error('Failed to delete task:', error);
    }
  }, [tasks]);

  const handleAddSubTask = useCallback(async (taskId: string, newSubTask: SubTask) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const updatedSubTasks = [...task.subTasks, newSubTask];

    // Optimistic update
    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? { ...t, subTasks: updatedSubTasks, completed: false } : t
    ));

    try {
      await updateTask(taskId, {
        subTasks: updatedSubTasks,
        completed: false
      });
    } catch (error) {
      // Rollback on error
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? task : t
      ));
      console.error('Failed to add subtask:', error);
    }
  }, [tasks]);

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark');
    if (currentUser) {
      await saveUserTheme(currentUser.uid, newTheme);
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-200 ${isDark ? 'dark bg-gray-900' : 'bg-gray-200'}`}>
      <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 sm:gap-4">
              <Layout className="h-8 w-8 text-blue-600 dark:text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">TaskEase</h1>
              <CreditDisplay credits={credits} />
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button
                onClick={() => setIsProfileOpen(true)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="User profile"
              >
                <User size={20} />
              </button>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 h-9 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <h3 className="text-2xl font-medium text-gray-600 dark:text-gray-400">
              Loading...
            </h3>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <Layout className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Get started by creating a new task
            </p>
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 h-9 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min [grid-auto-flow:dense]">
            {tasks.map((task, index) => (
              <div 
                key={task.id}
                className={`md:[grid-column:${(index % 3) + 1}] md:[grid-row:${Math.floor(index / 3) + 1}]`}
              >
                <TaskCard
                  task={task}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateTask}
        credits={credits}
        onCreditsUpdate={loadUserCredits}
      />

      <ProfilePopup
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}