// ... (previous imports remain the same)

export function Dashboard() {
  // ... (previous state and other code remains the same until handleToggleSubTask)

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

  // ... (rest of the component remains the same)
}