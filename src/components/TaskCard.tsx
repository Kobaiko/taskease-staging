import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Trash2, Plus, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Task, SubTask } from '../types';

interface TaskCardProps {
  task: Task;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (taskId: string, subTask: SubTask) => void;
}

export function TaskCard({ task, onToggleSubTask, onDeleteTask, onAddSubTask }: TaskCardProps) {
  const [isAddingSubTask, setIsAddingSubTask] = useState(false);
  const [newSubTaskTitle, setNewSubTaskTitle] = useState('');
  const [newSubTaskTime, setNewSubTaskTime] = useState(30);
  const [prevCompletedCount, setPrevCompletedCount] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const completedCount = task.subTasks.filter(st => st.completed).length;
  const progress = (completedCount / task.subTasks.length) * 100;
  const totalEstimatedTime = task.subTasks.reduce((acc, st) => acc + st.estimatedTime, 0);
  const remainingTime = task.subTasks
    .filter(st => !st.completed)
    .reduce((acc, st) => acc + st.estimatedTime, 0);

  useEffect(() => {
    if (completedCount === task.subTasks.length && 
        completedCount > prevCompletedCount && 
        task.subTasks.length > 0) {
      const duration = 2000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval: NodeJS.Timer = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);

        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
        });
      }, 250);

      return () => clearInterval(interval);
    }
    setPrevCompletedCount(completedCount);
  }, [completedCount, task.subTasks.length, prevCompletedCount]);

  const handleAddSubTask = () => {
    if (!newSubTaskTitle) return;

    onAddSubTask(task.id, {
      id: `${task.id}-${Date.now()}`,
      title: newSubTaskTitle,
      estimatedTime: newSubTaskTime,
      completed: false,
    });

    setNewSubTaskTitle('');
    setNewSubTaskTime(30);
    setIsAddingSubTask(false);
  };

  const handleConfirmDelete = (confirm: boolean) => {
    if (confirm) {
      onDeleteTask(task.id);
    }
    setShowDeleteConfirm(false);
  };

  if (showDeleteConfirm) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Delete Task?</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete "{task.title}"? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => handleConfirmDelete(false)}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={() => handleConfirmDelete(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 mr-4">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{task.title}</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">{task.description}</p>
        </div>
        <div className="flex items-start gap-4">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
            aria-label="Delete task"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                className="text-gray-200 dark:text-gray-700"
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#3b82f6"
                strokeWidth="8"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 28}`}
                strokeDashoffset={`${2 * Math.PI * 28 * (1 - progress / 100)}`}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sm font-semibold text-gray-800 dark:text-white">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>{Math.round(remainingTime)} mins left</span>
        </div>
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>{completedCount}/{task.subTasks.length} completed</span>
        </div>
      </div>

      <div className="space-y-2">
        {task.subTasks.map(subTask => (
          <div
            key={subTask.id}
            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
              subTask.completed
                ? 'bg-blue-50 dark:bg-blue-900/20'
                : 'bg-gray-50 dark:bg-gray-700/50'
            }`}
          >
            <button
              onClick={() => onToggleSubTask(task.id, subTask.id)}
              className={`flex-shrink-0 w-5 h-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors ${
                subTask.completed
                  ? 'border-blue-500 bg-blue-500'
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              {subTask.completed && (
                <CheckCircle2 className="w-4 h-4 text-white" />
              )}
            </button>
            <div className="flex-1 flex items-center justify-between min-w-0">
              <span className={`${
                subTask.completed
                  ? 'text-gray-500 dark:text-gray-400 line-through'
                  : 'text-gray-700 dark:text-gray-200'
              }`}>
                {subTask.title}
              </span>
              <span className="ml-2 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">
                {subTask.estimatedTime} mins
              </span>
            </div>
          </div>
        ))}

        {isAddingSubTask ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              type="text"
              value={newSubTaskTitle}
              onChange={(e) => setNewSubTaskTitle(e.target.value)}
              placeholder="Subtask title"
              className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-sm"
            />
            <input
              type="number"
              value={newSubTaskTime}
              onChange={(e) => setNewSubTaskTime(parseInt(e.target.value) || 0)}
              placeholder="Minutes"
              className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white text-sm"
            />
            <button
              onClick={handleAddSubTask}
              disabled={!newSubTaskTitle}
              className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400 disabled:opacity-50"
            >
              <Plus className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsAddingSubTask(false)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingSubTask(true)}
            className="inline-flex items-center gap-2 mt-2 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subtask</span>
          </button>
        )}
      </div>
    </div>
  );
}