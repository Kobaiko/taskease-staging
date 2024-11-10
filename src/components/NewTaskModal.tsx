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

  // ... (keep the rest of the code the same until the render part)

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* ... (keep the header part the same) */}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ... (keep the title and description inputs the same) */}

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

            {/* ... (keep the rest of the form the same) */}
          </form>
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