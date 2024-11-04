// Previous imports remain the same...
import { useAnalytics } from '../hooks/useAnalytics';

export function Dashboard() {
  // Previous state declarations remain the same...
  const { trackEvent } = useAnalytics();

  // In handleCreateTask:
  const handleCreateTask = async (title: string, description: string, subTasks: SubTask[]) => {
    if (!currentUser) return;

    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      description,
      subTasks,
      createdAt: new Date(),
      completed: false,
      userId: currentUser.uid
    };

    // Track task creation
    trackEvent('create_task', {
      task_id: newTask.id,
      subtasks_count: subTasks.length
    });

    setTasks(prevTasks => [newTask, ...prevTasks]);

    try {
      const taskId = await createTask(currentUser.uid, newTask);
      setTasks(prevTasks => prevTasks.map(task => 
        task.id === newTask.id ? { ...task, id: taskId } : task
      ));
      await loadUserCredits();
    } catch (error) {
      setTasks(prevTasks => prevTasks.filter(task => task.id !== newTask.id));
      console.error('Failed to create task:', error);
    }
  };

  const handleToggleSubTask = useCallback(async (taskId: string, subTaskId: string) => {
    const taskIndex = tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = tasks[taskIndex];
    const updatedSubTasks = task.subTasks.map(st => 
      st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    
    const allCompleted = updatedSubTasks.every(st => st.completed);
    if (allCompleted && !task.completed) {
      fireConfetti();
      // Track task completion
      trackEvent('complete_task', {
        task_id: taskId
      });
    }

    const updatedTask = {
      ...task,
      subTasks: updatedSubTasks,
      completed: allCompleted
    };

    setTasks(prevTasks => prevTasks.map(t => 
      t.id === taskId ? updatedTask : t
    ));

    try {
      await updateTask(taskId, {
        subTasks: updatedSubTasks,
        completed: allCompleted
      });
    } catch (error) {
      setTasks(prevTasks => prevTasks.map(t => 
        t.id === taskId ? task : t
      ));
      console.error('Failed to update task:', error);
    }
  }, [tasks, trackEvent]);

  // Rest of the component remains the same...
}