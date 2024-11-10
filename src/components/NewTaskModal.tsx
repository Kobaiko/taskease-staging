import React, { useState, useEffect } from 'react';
import { X, Clock, Plus, Trash2, AlertCircle, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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
  const [newSubTask, setNewSubTask] = useState({ title: '', estimatedTime: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showAddManual, setShowAddManual] = useState(false);
  const [showCreditsExhausted, setShowCreditsExhausted] = useState(false);
  const [error, setError] = useState('');
  const [editingSubTaskId, setEditingSubTaskId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const { currentUser } = useAuth();

  const resetAndClose = () => {
    setTitle('');
    setDescription('');
    setSubTasks([]);
    setShowAddManual(false);
    setShowConfirm(false);
    setError('');
    onClose();
  };

  const handleClose = () => {
    if (title || description || subTasks.length > 0) {
      setShowConfirm(true);
    } else {
      resetAndClose();
    }
  };

  const handleCreditsExhaustedClose = () => {
    setShowCreditsExhausted(false);
    onClose();
  };

  const handleGenerateSubtasks = async () => {
    if (!title || !description || !currentUser) return;
    
    if (credits <= 0) {
      setError('No credits remaining. Please add subtasks manually.');
      return;
    }

    setIsGenerating(true);
    setError('');
    
    try {
      await deductCredit(currentUser.uid);
      const generatedSubtasks = await generateSubtasks(title, description);
      setSubTasks(generatedSubtasks.map(st => ({
        ...st,
        id: crypto.randomUUID()
      })));
      setShowAddManual(true);
      onCreditsUpdate();
    } catch (error) {
      console.error('Error generating subtasks:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate subtasks');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubTask = () => {
    if (newSubTask.title && newSubTask.estimatedTime) {
      const subTask: SubTask = {
        id: crypto.randomUUID(),
        title: newSubTask.title,
        estimatedTime: parseInt(newSubTask.estimatedTime),
        completed: false,
      };
      setSubTasks([...subTasks, subTask]);
      setNewSubTask({ title: '', estimatedTime: '' });
    }
  };

  const handleDeleteSubTask = (id: string) => {
    setSubTasks(subTasks.filter(st => st.id !== id));
  };

  const handleUpdateSubTaskTitle = (id: string, newTitle: string) => {
    setSubTasks(subTasks.map(st => 
      st.id === id ? { ...st, title: newTitle } : st
    ));
  };

  const handleUpdateSubTaskTime = (id: string, newTime: string) => {
    const time = parseInt(newTime);
    if (!isNaN(time) && time > 0 && time <= 60) {
      setSubTasks(subTasks.map(st =>
        st.id === id ? { ...st, estimatedTime: time } : st
      ));
    }
  };

  const handleStartEditing = (subTask: SubTask) => {
    setEditingSubTaskId(subTask.id);
    setEditingTitle(subTask.title);
    setEditingTime(subTask.estimatedTime.toString());
  };

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(subTasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setSubTasks(items);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title && description && subTasks.length > 0) {
      onSubmit(title, description, subTasks);
      setTitle('');
      setDescription('');
      setSubTasks([]);
      setShowAddManual(false);
      
      if (credits === 0) {
        setShowCreditsExhausted(true);
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Task Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white"
                  rows={3}
                  placeholder="Enter task description"
                  required
                />
              </div>

              {!subTasks.length && (
                <>
                  <button
                    type="button"
                    onClick={handleGenerateSubtasks}
                    disabled={!title || !description || isGenerating || credits <= 0}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? 'Generating...' : 'Generate Subtasks'}
                  </button>
                  <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                    {credits} credits remaining
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
                  Subtasks
                </label>

                <div className="space-y-3">
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="subtasks">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                          {subTasks.map((subTask, index) => (
                            <Draggable key={subTask.id} draggableId={subTask.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg group"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <div {...provided.dragHandleProps} className="text-gray-400 cursor-grab">
                                      <GripVertical size={16} />
                                    </div>
                                    {editingSubTaskId === subTask.id ? (
                                      <div className="flex gap-2 flex-1">
                                        <input
                                          type="text"
                                          value={editingTitle}
                                          onChange={(e) => setEditingTitle(e.target.value)}
                                          onBlur={() => {
                                            handleUpdateSubTaskTitle(subTask.id, editingTitle);
                                            setEditingSubTaskId(null);
                                          }}
                                          className="flex-1 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-sm"
                                          autoFocus
                                        />
                                        <input
                                          type="number"
                                          value={editingTime}
                                          onChange={(e) => setEditingTime(e.target.value)}
                                          onBlur={() => {
                                            handleUpdateSubTaskTime(subTask.id, editingTime);
                                            setEditingSubTaskId(null);
                                          }}
                                          className="w-20 px-2 py-1 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-sm"
                                          min="1"
                                          max="60"
                                        />
                                      </div>
                                    ) : (
                                      <>
                                        <span
                                          onClick={() => handleStartEditing(subTask)}
                                          className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 flex-1"
                                        >
                                          {subTask.title}
                                        </span>
                                        <div className="flex items-center text-gray-400 dark:text-gray-500 text-sm">
                                          <Clock size={14} className="mr-1" />
                                          <span onClick={() => handleStartEditing(subTask)} className="cursor-pointer">
                                            {subTask.estimatedTime}m
                                          </span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteSubTask(subTask.id)}
                                    className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 ml-3"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  {showAddManual && (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubTask.title}
                        onChange={(e) => setNewSubTask({ ...newSubTask, title: e.target.value })}
                        className="flex-1 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-sm"
                        placeholder="Subtask title"
                      />
                      <input
                        type="number"
                        value={newSubTask.estimatedTime}
                        onChange={(e) => setNewSubTask({ ...newSubTask, estimatedTime: e.target.value })}
                        className="w-20 px-2 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white text-sm"
                        placeholder="Min"
                        min="1"
                        max="60"
                      />
                      <button
                        type="button"
                        onClick={handleAddSubTask}
                        className="h-9 w-9 flex items-center justify-center bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>

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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

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
        onClose={handleCreditsExhaustedClose}
      />
    </>
  );
}