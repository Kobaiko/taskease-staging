import React, { useState, useEffect } from 'react';
import { Plus, Sun, Moon, User } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProfilePopup } from '../components/ProfilePopup';
import { CreditDisplay } from '../components/CreditDisplay';
import { CookieConsent } from '../components/CookieConsent';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Logo } from '../components/Logo';
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
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', darkMode);
      return darkMode;
    }
    return false;
  });
  const [credits, setCredits] = useState(0);
  const [loading, setLoading] = useState(true);
  const [newTaskId, setNewTaskId] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadTasks();
      loadUserTheme();
      loadUserCredits();
    }
  }, [currentUser]);

  async function loadUserCredits() {
    if (!currentUser) return;
    const userCredits = await getUserCredits(currentUser.uid);
    setCredits(userCredits);
  }

  async function loadUserTheme() {
    if (!currentUser) return;
    const theme = await getUserTheme(currentUser.uid);
    if (theme) {
      setIsDark(theme === 'dark');
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }

  async function loadTasks() {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userTasks = await getUserTasks(currentUser.uid);
      setTasks(userTasks);
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    const newTask: Omit<Task, 'id'> = {
      title,
      description,
      subTasks,
      createdAt: new Date(),
      completed: false,
      userId: currentUser.uid
    };

    const taskId = await createTask(currentUser.uid, newTask);
    setNewTaskId(taskId);
    setTimeout(() => setNewTaskId(null), 2000);
    await loadTasks();
    await loadUserCredits();
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    if (currentUser) {
      await saveUserTheme(currentUser.uid, newTheme ? 'dark' : 'light');
    }
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <header className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2 sm:gap-4">
                <Logo size="md" />
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
            <div className="flex flex-col items-center justify-center h-64 space-y-4">
              <LoadingSpinner size={40} />
              <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 animate-pulse">
                Loading tasks...
              </h3>
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">No tasks</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating a new task
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Task
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleSubTask={(taskId, subTaskId) => {
                    const updatedTasks = tasks.map(t => {
                      if (t.id === taskId) {
                        const updatedSubTasks = t.subTasks.map(st =>
                          st.id === subTaskId ? { ...st, completed: !st.completed } : st
                        );
                        const allCompleted = updatedSubTasks.every(st => st.completed);
                        if (allCompleted && !t.completed) {
                          fireConfetti();
                        }
                        return {
                          ...t,
                          subTasks: updatedSubTasks,
                          completed: allCompleted
                        };
                      }
                      return t;
                    });
                    setTasks(updatedTasks);
                    const updatedTask = updatedTasks.find(t => t.id === taskId);
                    if (updatedTask) {
                      updateTask(taskId, {
                        subTasks: updatedTask.subTasks,
                        completed: updatedTask.completed
                      });
                    }
                  }}
                  onDeleteTask={async (taskId) => {
                    await deleteTask(taskId);
                    setTasks(tasks.filter(t => t.id !== taskId));
                  }}
                  isNewlyCreated={task.id === newTaskId}
                />
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

        <CookieConsent />
      </div>
    </div>
  );
}