import React, { useState, useEffect } from 'react';
import { Plus, Sun, Moon, User } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProfilePopup } from '../components/ProfilePopup';
import { CreditDisplay } from '../components/CreditDisplay';
import { CookieConsent } from '../components/CookieConsent';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { Logo } from '../components/Logo';
import { PaymentModal } from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';
import { getUserTasks, createTask, updateTask, deleteTask, updateSubtaskStatus } from '../services/taskService';
import { saveUserTheme, getUserTheme } from '../services/userService';
import { getUserCredits } from '../services/creditService';
import type { Task, SubTask, UserCredits } from '../types';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      loadUserData();
      loadTheme();
    }
  }, [currentUser]);

  const loadUserData = async () => {
    try {
      const [userTasks, userCredits] = await Promise.all([
        getUserTasks(currentUser!.uid),
        getUserCredits(currentUser!.uid)
      ]);

      // Sort tasks by creation date, newest first
      const sortedTasks = userTasks.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );

      setTasks(sortedTasks);
      setCredits(userCredits.credits);
      
      // Show payment modal if credits are low
      if (userCredits.credits < 2 && userCredits.showUpgradeModal) {
        setIsPaymentModalOpen(true);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const loadTheme = async () => {
    if (currentUser) {
      const theme = await getUserTheme(currentUser.uid);
      const isDarkTheme = theme === 'dark' || 
        (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setIsDark(isDarkTheme);
      document.documentElement.classList.toggle('dark', isDarkTheme);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle('dark', newTheme);
    if (currentUser) {
      await saveUserTheme(currentUser.uid, newTheme ? 'dark' : 'light');
    }
  };

  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    try {
      const taskId = await createTask(currentUser.uid, {
        userId: currentUser.uid,
        title,
        description,
        subTasks,
        completed: false,
        createdAt: new Date()
      });

      const newTask: Task = {
        id: taskId,
        userId: currentUser.uid,
        title,
        description,
        subTasks,
        completed: false,
        createdAt: new Date()
      };

      setTasks(prevTasks => [newTask, ...prevTasks]);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Failed to create task');
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const subTask = task.subTasks.find(st => st.id === subTaskId);
      if (!subTask) return;

      await updateSubtaskStatus(taskId, subTaskId, !subTask.completed);

      setTasks(prevTasks => prevTasks.map(t => {
        if (t.id === taskId) {
          const updatedSubTasks = t.subTasks.map(st =>
            st.id === subTaskId ? { ...st, completed: !st.completed } : st
          );
          return {
            ...t,
            subTasks: updatedSubTasks,
            completed: updatedSubTasks.every(st => st.completed)
          };
        }
        return t;
      }));
    } catch (err) {
      console.error('Error toggling subtask:', err);
      setError('Failed to update subtask');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete task');
    }
  };

  const handleAddSubTask = async (taskId: string, subTask: SubTask) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updatedTask = {
        ...task,
        subTasks: [...task.subTasks, subTask]
      };

      await updateTask(taskId, updatedTask);

      setTasks(prevTasks => prevTasks.map(t =>
        t.id === taskId ? updatedTask : t
      ));
    } catch (err) {
      console.error('Error adding subtask:', err);
      setError('Failed to add subtask');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      <div className="flex flex-col">
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
              <div className="flex items-center space-x-4">
                <CreditDisplay 
                  credits={credits} 
                  onUpgradeClick={() => setIsPaymentModalOpen(true)}
                />
                {credits < 2 && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                  >
                    Upgrade
                  </button>
                )}
                <button
                  onClick={toggleTheme}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsProfileOpen(true)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg transition-colors duration-200"
                >
                  <User className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
                >
                  <Plus className="h-5 w-5" />
                  <span className="hidden sm:inline">New Task</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {tasks.map(task => (
              <div key={task.id} className="h-fit">
                <TaskCard
                  task={task}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                />
              </div>
            ))}
          </div>

          {tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No tasks yet. Click "New Task" to get started!
              </p>
            </div>
          )}
        </main>

        {isPaymentModalOpen && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onChooseCredits={() => {
              setIsPaymentModalOpen(false);
              loadUserData();
            }}
            onChooseSubscription={async () => {
              setIsPaymentModalOpen(false);
              await loadUserData();
            }}
          />
        )}

        <NewTaskModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateTask}
          credits={credits}
          onCreditsUpdate={loadUserData}
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