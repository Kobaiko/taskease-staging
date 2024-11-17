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
import { getUserTasks, createTask, updateTask, deleteTask, updateSubtaskStatus } from '../services/taskService';
import { saveUserTheme, getUserTheme } from '../services/userService';
import { getUserCredits } from '../services/creditService';
import type { Task, SubTask } from '../types';

export function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return false;
  });
  const { currentUser } = useAuth();

  useEffect(() => {
    if (currentUser?.uid) {
      loadUserData();
      loadUserTheme();
    }
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const loadUserData = async () => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const [userTasks, userCredits] = await Promise.all([
        getUserTasks(currentUser.uid),
        getUserCredits(currentUser.uid)
      ]);
      
      // Sort tasks by creation date, newest first
      const sortedTasks = userTasks.sort((a, b) => {
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
      
      setTasks(sortedTasks);
      setCredits(userCredits);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTheme = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const theme = await getUserTheme(currentUser.uid);
      if (theme) {
        setIsDark(theme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    if (currentUser?.uid) {
      await saveUserTheme(currentUser.uid, newTheme ? 'dark' : 'light');
    }
  };

  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    try {
      const newTask: Omit<Task, 'id'> = {
        userId: currentUser.uid,
        title,
        description,
        subTasks,
        createdAt: new Date(),
        completed: false
      };

      const taskId = await createTask(currentUser.uid, newTask);
      const createdTask = { ...newTask, id: taskId };
      
      // Add new task at the beginning of the list
      setTasks(prev => [createdTask, ...prev]);
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedSubTasks = task.subTasks.map(st =>
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );

    const wasCompleted = task.completed;
    const isNowCompleted = updatedSubTasks.every(st => st.completed);

    try {
      // First update the UI optimistically
      setTasks(prev =>
        prev.map(t =>
          t.id === taskId
            ? { ...t, subTasks: updatedSubTasks, completed: isNowCompleted }
            : t
        )
      );

      // Then update the database
      await updateSubtaskStatus(taskId, subTaskId, !task.subTasks.find(st => st.id === subTaskId)?.completed);

      // If this completes the task, trigger confetti
      if (!wasCompleted && isNowCompleted) {
        fireConfetti();
      }
    } catch (error) {
      console.error('Error updating subtask:', error);
      // Revert the optimistic update on error
      setTasks(prev =>
        prev.map(t => t.id === taskId ? task : t)
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      setTasks(prev => prev.filter(task => task.id !== taskId));
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleAddSubTask = async (taskId: string, subTask: SubTask) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      subTasks: [...task.subTasks, subTask]
    };

    try {
      await updateTask(taskId, updatedTask);
      setTasks(prev =>
        prev.map(t => t.id === taskId ? updatedTask : t)
      );
    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };

  // Sort tasks by creation date, newest first
  const sortedTasks = [...tasks].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

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
                className="flex items-center gap-2 h-9 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
              >
                <Plus className="h-5 w-5" />
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {loading ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
            </div>
          ) : sortedTasks.length === 0 ? (
            <div className="text-center py-12">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                No tasks yet
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first task to get started
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
              >
                <Plus className="h-5 w-5" />
                New Task
              </button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {sortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                  isNewlyCreated={task === sortedTasks[0]}
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