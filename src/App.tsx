import React, { useState } from 'react';
import { Layout, Plus } from 'lucide-react';
import { TaskCard } from './components/TaskCard';
import { TaskModal } from './components/TaskModal';
import { ThemeToggle } from './components/ThemeToggle';
import { useDarkMode } from './hooks/useDarkMode';
import type { Task, SubTask } from './types';

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Launch Marketing Campaign',
    description: 'Plan and execute Q1 marketing campaign for new product launch',
    createdAt: new Date(),
    subTasks: [
      { id: '1-1', title: 'Research target audience', estimatedTime: 120, completed: false },
      { id: '1-2', title: 'Develop campaign messaging', estimatedTime: 180, completed: false },
      { id: '1-3', title: 'Create visual assets', estimatedTime: 240, completed: false },
      { id: '1-4', title: 'Set up social media schedule', estimatedTime: 90, completed: false },
    ],
  },
  {
    id: '2',
    title: 'Website Redesign',
    description: 'Modernize company website with new branding and improved UX',
    createdAt: new Date(),
    subTasks: [
      { id: '2-1', title: 'Gather requirements', estimatedTime: 180, completed: true },
      { id: '2-2', title: 'Create wireframes', estimatedTime: 240, completed: false },
      { id: '2-3', title: 'Design UI components', estimatedTime: 300, completed: false },
      { id: '2-4', title: 'Implement responsive layout', estimatedTime: 420, completed: false },
    ],
  },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDark, setIsDark] = useDarkMode();

  const handleToggleSubTask = (taskId: string, subTaskId: string) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: task.subTasks.map(subTask =>
                subTask.id === subTaskId
                  ? { ...subTask, completed: !subTask.completed }
                  : subTask
              ),
            }
          : task
      )
    );
  };

  const handleCreateTask = (title: string, description: string, subTasks: SubTask[]) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      description,
      createdAt: new Date(),
      subTasks,
    };
    setTasks([...tasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const handleAddSubTask = (taskId: string, subTask: SubTask) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              subTasks: [...task.subTasks, subTask],
            }
          : task
      )
    );
  };

  const toggleDarkMode = () => setIsDark(!isDark);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      <header className="bg-white dark:bg-gray-800 shadow-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Layout className="w-8 h-8 text-blue-600 dark:text-blue-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">TaskEase</h1>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle isDark={isDark} toggle={toggleDarkMode} />
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onToggleSubTask={handleToggleSubTask}
              onDeleteTask={handleDeleteTask}
              onAddSubTask={handleAddSubTask}
            />
          ))}
        </div>
      </main>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateTask}
      />
    </div>
  );
}

export default App;