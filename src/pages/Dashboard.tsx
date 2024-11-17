// ... previous imports remain the same ...

export function Dashboard() {
  // ... previous state and handlers remain the same ...

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size={40} className="text-purple-600 dark:text-purple-400" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'}`}>
      {/* ... header remains the same ... */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {tasks.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
              No tasks yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Create your first task and let AI help you break it down into manageable steps.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              Create Your First Task
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
            {tasks.map(task => (
              <div key={task.id} className="h-fit">
                <TaskCard
                  task={task}
                  onToggleSubTask={handleToggleSubTask}
                  onDeleteTask={handleDeleteTask}
                  onAddSubTask={handleAddSubTask}
                />
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ... rest of the component remains the same ... */}
    </div>
  );
}