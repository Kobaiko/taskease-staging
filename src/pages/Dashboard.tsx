import React, { useState, useEffect } from 'react';
import { Plus, Layout, Sun, Moon, User } from 'lucide-react';
import { TaskCard } from '../components/TaskCard';
import { NewTaskModal } from '../components/NewTaskModal';
import { ProfilePopup } from '../components/ProfilePopup';
import { CreditDisplay } from '../components/CreditDisplay';
import { CookieConsent } from '../components/CookieConsent';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { fireConfetti } from '../lib/confetti';
import { useAuth } from '../contexts/AuthContext';
import { getUserTasks, createTask, updateTask, deleteTask } from '../services/taskService';
import { saveUserTheme, getUserTheme } from '../services/userService';
import { getUserCredits } from '../services/creditService';
import type { Task, SubTask } from '../types';

export function Dashboard() {
  // ... (keep existing state and other code until the render part)

  const handleUpdateSubTask = async (taskId: string, subTaskId: string, updates: Partial<SubTask>) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const updatedSubTasks = task.subTasks.map(st =>
      st.id === subTaskId ? { ...st, ...updates } : st
    );

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...task,
      subTasks: updatedSubTasks
    };
    setTasks(updatedTasks);

    await updateTask(taskId, {
      subTasks: updatedSubTasks
    });
  };

  const handleReorderSubTasks = async (taskId: string, reorderedSubTasks: SubTask[]) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const updatedTasks = [...tasks];
    updatedTasks[taskIndex] = {
      ...updatedTasks[taskIndex],
      subTasks: reorderedSubTasks
    };
    setTasks(updatedTasks);

    await updateTask(taskId, {
      subTasks: reorderedSubTasks
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-200'}`}>
      {/* ... (keep header code the same) */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <LoadingSpinner size={40} />
            <h3 className="text-xl font-medium text-gray-600 dark:text-gray-400 animate-pulse">
              Take your time...
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
                <span className="hidden sm:inline">New Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tasks.map((task) => (
              <div key={task.id}>
                <TaskCard
                  task={task}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                  onUpdateSubTask={handleUpdateSubTask}
                  onReorderSubTasks={handleReorderSubTasks}
                  isNewlyCreated={task.id === newTaskId}
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

      <CookieConsent />
    </div>
  );
}