import React, { useState, useCallback } from 'react';
import { CheckCircle, Clock, Trash2, Plus } from 'lucide-react';
import type { Task, SubTask } from '../types';
import { ConfirmDialog } from './ConfirmDialog';
import { fireConfetti } from '../lib/confetti';

interface TaskCardProps {
  task: Task;
  onToggleSubTask: (taskId: string, subTaskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubTask: (taskId: string, subTask: SubTask) => void;
  onUpdateSubTask: (taskId: string, subTaskId: string, updates: Partial<SubTask>) => void;
  onReorderSubTasks: (taskId: string, reorderedSubTasks: SubTask[]) => void;
  isNewlyCreated?: boolean;
}

export function TaskCard({ 
  task, 
  onToggleSubTask, 
  onDeleteTask, 
  onAddSubTask,
  onUpdateSubTask,
  onReorderSubTasks,
  isNewlyCreated = false 
}: TaskCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddSubTask, setShowAddSubTask] = useState(false);
  const [newSubTask, setNewSubTask] = useState({ title: '', estimatedTime: '' });
  const [showAnimation, setShowAnimation] = useState(isNewlyCreated);
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingTime, setEditingTime] = useState('');

  useEffect(() => {
    if (showAnimation) {
      const timer = setTimeout(() => setShowAnimation(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAnimation]);

  const completedSubTasks = task.subTasks.filter(st => st.completed).length;
  const progress = (completedSubTasks / task.subTasks.length) * 100;
  const totalEstimatedTime = task.subTasks.reduce((acc, st) => acc + st.estimatedTime, 0);
  const remainingTime = task.subTasks
    .filter(st => !st.completed)
    .reduce((acc, st) => acc + st.estimatedTime, 0);

  const handleAddSubTask = () => {
    if (newSubTask.title && newSubTask.estimatedTime) {
      const subTask: SubTask = {
        id: crypto.randomUUID(),
        title: newSubTask.title,
        estimatedTime: parseInt(newSubTask.estimatedTime),
        completed: false,
      };
      onAddSubTask(task.id, subTask);
      setNewSubTask({ title: '', estimatedTime: '' });
      setShowAddSubTask(false);
    }
  };

  const handleToggleSubTask = useCallback((subTaskId: string) => {
    const isLastSubTask = task.subTasks.filter(st => !st.completed).length === 1;
    const toggledSubTask = task.subTasks.find(st => st.id === subTaskId);
    
    if (isLastSubTask && !toggledSubTask?.completed) {
      requestAnimationFrame(() => {
        fireConfetti();
      });
    }

    onToggleSubTask(task.id, subTaskId);
  }, [task.id, task.subTasks, onToggleSubTask]);

  const handleDeleteConfirm = useCallback(() => {
    onDeleteTask(task.id);
    setShowDeleteConfirm(false);
  }, [task.id, onDeleteTask]);

  const handleUpdateSubTaskTitle = (subTaskId: string, newTitle: string) => {
    if (newTitle.trim()) {
      onUpdateSubTask(task.id, subTaskId, { title: newTitle.trim() });
    }
    setEditingSubTaskId(null);
  };

  const handleUpdateSubTaskTime = (subTaskId: string, timeStr: string) => {
    const time = parseInt(timeStr);
    if (!isNaN(time) && time > 0) {
      onUpdateSubTask(task.id, subTaskId, { estimatedTime: time });
    }
    setEditingSubTaskId(null);
    setEditingTime('');
  };

  const startEditing = (subTask: SubTask) => {
    setEditingSubTaskId(subTask.id);
    setEditingTime(subTask.estimatedTime.toString());
  };

  return (
    <div className={`card-container bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 relative ${
      showAnimation ? 'before:absolute before:inset-0 before:rounded-xl before:p-[2px] before:bg-gradient-to-r before:from-blue-500 before:via-purple-500 before:to-pink-500 before:animate-gradient-x before:content-[""] after:absolute after:inset-[2px] after:rounded-[10px] after:bg-white dark:after:bg-gray-800 after:content-[""]' : ''
    }`}>
      <div className="relative z-10">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{task.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">{task.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-12 h-12">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {Math.round(progress)}%
                  </span>
                </div>
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="2"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="24"
                    cy="24"
                  />
                  <circle
                    className="text-blue-600 dark:text-blue-400"
                    strokeWidth="2"
                    strokeDasharray={126}
                    strokeDashoffset={126 - (progress / 100) * 126}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="20"
                    cx="24"
                    cy="24"
                  />
                </svg>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {task.subTasks.map((subTask) => (
              <div
                key={subTask.id}
                className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggleSubTask(subTask.id)}
                    className={`rounded-full p-1 transition-colors duration-200 ${
                      subTask.completed
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10'
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    <CheckCircle size={20} />
                  </button>
                  {editingSubTaskId === subTask.id ? (
                    <div className="flex gap-2 flex-1">
                      <input
                        type="text"
                        defaultValue={subTask.title}
                        onBlur={(e) => handleUpdateSubTaskTitle(subTask.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateSubTaskTitle(subTask.id, e.currentTarget.value);
                          }
                        }}
                        className="flex-1 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-sm"
                        autoFocus
                      />
                      <input
                        type="number"
                        value={editingTime}
                        onChange={(e) => setEditingTime(e.target.value)}
                        onBlur={() => handleUpdateSubTaskTime(subTask.id, editingTime)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUpdateSubTaskTime(subTask.id, editingTime);
                          }
                        }}
                        className="w-20 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
                        min="1"
                      />
                    </div>
                  ) : (
                    <>
                      <span
                        onClick={() => startEditing(subTask)}
                        className={`text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 ${
                          subTask.completed
                            ? 'text-gray-400 dark:text-gray-500 line-through'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {subTask.title}
                      </span>
                    </>
                  )}
                </div>
                {!editingSubTaskId && (
                  <div 
                    className="flex items-center text-gray-400 dark:text-gray-500 text-sm cursor-pointer"
                    onClick={() => startEditing(subTask)}
                  >
                    <Clock size={14} className="mr-1" />
                    <span>{subTask.estimatedTime}m</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {showAddSubTask ? (
            <div className="flex items-center gap-2 mb-4">
              <input
                type="text"
                value={newSubTask.title}
                onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                className="flex-1 h-9 px-3 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="Subtask title"
              />
              <input
                type="number"
                value={newSubTask.estimatedTime}
                onChange={(e) => setNewSubTask({ ...newSubTask, estimatedTime: e.target.value })}
                className="w-20 h-9 px-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                placeholder="Min"
                min="1"
              />
              <button
                onClick={handleAddSubTask}
                className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex-shrink-0"
              >
                <Plus size={20} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAddSubTask(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 mb-4"
            >
              <Plus size={16} className="flex-shrink-0" />
              Add Subtask
            </button>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {remainingTime}m remaining
            </div>
            <div>Total: {totalEstimatedTime}m</div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message="Are you sure you want to delete this task?"
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}