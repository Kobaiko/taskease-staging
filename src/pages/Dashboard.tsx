// Update the TaskCard component usage to remove isNewlyCreated prop
<TaskCard
  key={task.id}
  task={task}
  onToggleSubTask={handleToggleSubTask}
  onDeleteTask={handleDeleteTask}
  onAddSubTask={handleAddSubTask}
/>