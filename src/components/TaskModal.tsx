import React, { useState } from 'react';
import { X, Loader2, Trash2, Plus } from 'lucide-react';
import type { SubTask } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (title: string, description: string, subTasks: SubTask[]) => void;
}

export function TaskModal({ isOpen, onClose, onSave }: TaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasGeneratedSubtasks, setHasGeneratedSubtasks] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubTasks([]);
    setShowCancelConfirm(false);
    setHasGeneratedSubtasks(false);
  };

  const handleClose = () => {
    if (title || description || subTasks.length > 0) {
      setShowCancelConfirm(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = (confirm: boolean) => {
    setShowCancelConfirm(false);
    if (confirm) {
      resetForm();
      onClose();
    }
  };

  const generateSubTasks = async () => {
    if (!title || !description) return;
    
    setIsGenerating(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer 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'
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: `Break down this task into subtasks with time estimates. Important: If any subtask would take more than 60 minutes, break it down into smaller subtasks. No single subtask should exceed 60 minutes.

              Task: ${title}
              Description: ${description}
              
              Return only JSON in this format:
              {
                "subtasks": [
                  { "title": "subtask name", "estimatedTime": timeInMinutes }
                ]
              }
              
              Guidelines:
              - Each subtask must take 60 minutes or less
              - Break down complex tasks into smaller, manageable pieces
              - Ensure subtasks are specific and actionable
              - Maintain logical sequence in subtask order`
          }]
        })
      });

      const data = await response.json();
      const parsedContent = JSON.parse(data.choices[0].message.content);
      
      setSubTasks(parsedContent.subtasks.map((st: any, index: number) => ({
        id: `new-${index}`,
        title: st.title,
        estimatedTime: st.estimatedTime,
        completed: false
      })));
      setHasGeneratedSubtasks(true);
    } catch (error) {
      console.error('Failed to generate subtasks:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubTask = () => {
    setSubTasks([
      ...subTasks,
      {
        id: `new-${subTasks.length}`,
        title: '',
        estimatedTime: 30,
        completed: false
      }
    ]);
  };

  const handleDeleteSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleUpdateSubTask = (id: string, field: 'title' | 'estimatedTime', value: string | number) => {
    setSubTasks(subTasks.map(st =>
      st.id === id ? { ...st, [field]: value } : st
    ));
  };

  const handleSave = () => {
    if (!title || !description || subTasks.length === 0) return;
    onSave(title, description, subTasks);
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  if (showCancelConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Discard Changes?
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Are you sure you want to close? Any unsaved changes will be lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => handleConfirmClose(false)}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              No, Keep Editing
            </button>
            <button
              onClick={() => handleConfirmClose(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, Discard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
            <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                placeholder="Enter task title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                rows={3}
                placeholder="Enter task description"
              />
            </div>

            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Subtasks</h3>
              <button
                onClick={generateSubTasks}
                disabled={isGenerating || !title || !description}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Generate Subtasks'
                )}
              </button>
            </div>

            <div className="space-y-3">
              {subTasks.map(subTask => (
                <div key={subTask.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    value={subTask.title}
                    onChange={(e) => handleUpdateSubTask(subTask.id, 'title', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="Subtask title"
                  />
                  <input
                    type="number"
                    value={subTask.estimatedTime}
                    onChange={(e) => handleUpdateSubTask(subTask.id, 'estimatedTime', parseInt(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-white"
                    placeholder="Minutes"
                  />
                  <button
                    onClick={() => handleDeleteSubTask(subTask.id)}
                    className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            {hasGeneratedSubtasks && (
              <button
                onClick={handleAddSubTask}
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-500 dark:hover:text-blue-400"
              >
                <Plus className="w-4 h-4" />
                Add Subtask
              </button>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title || !description || subTasks.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}