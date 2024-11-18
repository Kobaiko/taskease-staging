import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { SubTask } from '../types';
import { generateSubtasks } from '../lib/api';
import { ConfirmDialog } from './ConfirmDialog';
import { CreditsExhaustedModal } from './CreditsExhaustedModal';
import { useAuth } from '../contexts/AuthContext';
import { deductCredit } from '../services/creditService';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, subTasks: SubTask[]) => void;
  credits: number;
  onCreditsUpdate: () => void;
}

export function NewTaskModal({ isOpen, onClose, onSubmit, credits, onCreditsUpdate }: NewTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  const [stateVersion, setStateVersion] = useState(0);
  const [newSubTask, setNewSubTask] = useState({ title: '', estimatedTime: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showCreditsExhausted, setShowCreditsExhausted] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  useEffect(() => {
    console.log('Current subTasks state:', subTasks);
  }, [subTasks]);

  useEffect(() => {
    console.log('SubTasks state updated with length:', subTasks.length);
    console.log('SubTasks contents:', subTasks);
  }, [subTasks]);

  // @ts-ignore
  const updateSubTasks = (newTasks: SubTask[]) => {
    console.log('Attempting to update subtasks:', newTasks);
    setStateVersion(prev => prev + 1);
    setSubTasks(newTasks);
  };

  const handleGenerateSubtasks = async () => {
    if (!title || !description || credits <= 0) return;
    
    try {
      setIsGenerating(true);
      setError('');
      
      await deductCredit(currentUser!.uid);
      onCreditsUpdate();
      
      const response = await generateSubtasks(title, description);
      
      if (response) {
        const newSubTasks = response.map((st: any) => ({
          id: Math.random().toString(36).substring(7),
          title: st.title,
          estimatedTime: st.estimatedTime,
          completed: false
        }));
        
        setSubTasks(newSubTasks);
        setShowAddManual(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to generate subtasks');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    const savedTasks = localStorage.getItem('tempSubTasks');
    if (savedTasks && subTasks.length === 0) {
      setSubTasks(JSON.parse(savedTasks));
    }
  }, [subTasks.length]);

  useEffect(() => {
    if (!isOpen) {
      localStorage.removeItem('tempSubTasks');
    }
  }, [isOpen]);

  const handleAddSubTask = () => {
    if (newSubTask.title && newSubTask.estimatedTime) {
      const subTask: SubTask = {
        id: generateId(),
        title: newSubTask.title.trim(),
        estimatedTime: validateEstimatedTime(newSubTask.estimatedTime),
        completed: false,
      };
      setSubTasks(prev => [...prev, subTask]);
      setNewSubTask({ title: '', estimatedTime: '' });
    }
  };

  const validateEstimatedTime = (value: string): number => {
    const time = Number(value);
    if (isNaN(time) || time < 1 || time > 60) {
      return 1;
    }
    return Math.min(Math.max(1, time), 60);
  };

  const handleDeleteSubTask = (id: string) => {
    setSubTasks(prev => prev.filter(st => st.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && subTasks.length > 0) {
      onSubmit(title, description, subTasks);
      resetAndClose();
    }
  };

  const handleClose = () => {
    if (title || description || subTasks.length > 0) {
      setShowConfirm(true);
    } else {
      resetAndClose();
    }
  };

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setSubTasks([]);
    setShowAddManual(false);
    setShowConfirm(false);
    setError('');
    onClose();
  };

  useEffect(() => {
    console.log('State changed - version:', stateVersion, 'subtasks:', subTasks);
  }, [stateVersion, subTasks]);

  console.log('Rendering with subtasks:', subTasks);

  if (!isOpen) return null;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Create New Task</h2>
                <button 
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X size={24} />
                </button>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 flex items-center">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="taskTitle" className="block text-sm font-medium">
                    Task Title
                  </label>
                  <input
                    id="taskTitle"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1 block w-full rounded-md"
                  />
                </div>

                <div>
                  <label htmlFor="taskDescription" className="block text-sm font-medium">
                    Description
                  </label>
                  <textarea
                    id="taskDescription"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 block w-full rounded-md"
                  />
                </div>

                {!subTasks.length && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleGenerateSubtasks()}
                      disabled={!title || !description || isGenerating || credits <= 0}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="animate-spin">⌛</span> Generating...
                        </span>
                      ) : (
                        'Generate Subtasks'
                      )}
                    </button>
                    <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                      {credits} credits remaining
                    </div>
                  </>
                )}

                <div className="p-2 text-xs bg-gray-100 dark:bg-gray-900 mt-4">
                  <pre>
                    SubTasks count: {subTasks.length}
                    {JSON.stringify(subTasks, null, 2)}
                  </pre>
                </div>

                <div className="mt-4">
                  <h3 className="text-lg font-medium">Subtasks ({subTasks.length})</h3>
                  
                  {subTasks.length > 0 ? (
                    <div className="space-y-2 mt-2">
                      {subTasks.map((subtask) => (
                        <div 
                          key={subtask.id} 
                          className="flex items-center justify-between p-2 bg-gray-700 rounded"
                        >
                          <div>
                            <p className="text-white">{subtask.title}</p>
                            <p className="text-sm text-gray-400">
                              Estimated: {subtask.estimatedTime} minutes
                            </p>
                          </div>
                          <button onClick={() => handleDeleteSubTask(subtask.id)}>
                            <X className="text-gray-400 hover:text-red-400" size={20} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 mt-2">No subtasks yet</p>
                  )}
                </div>

                {subTasks.length > 0 && showAddManual && (
                  <div className="space-y-2 mt-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newSubTask.title}
                        onChange={(e) => setNewSubTask(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Subtask title"
                        className="flex-1 rounded-md"
                      />
                      <input
                        type="number"
                        value={newSubTask.estimatedTime}
                        onChange={(e) => setNewSubTask(prev => ({ ...prev, estimatedTime: e.target.value }))}
                        placeholder="Minutes"
                        className="w-24 rounded-md"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubTask}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!title || !description || subTasks.length === 0}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={resetAndClose}
        title="Discard Changes"
        message="Are you sure you want to discard your changes?"
        confirmText="Discard"
        cancelText="Cancel"
      />

      <CreditsExhaustedModal
        isOpen={showCreditsExhausted}
        onClose={() => setShowCreditsExhausted(false)}
      />

      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 bg-gray-100 dark:bg-gray-900 mt-4">
          <pre className="text-xs">
            {JSON.stringify({ subTasks, showAddManual }, null, 2)}
          </pre>
        </div>
      )}
    </>
  );
}