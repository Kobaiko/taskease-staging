document.addEventListener('DOMContentLoaded', () => {
  const features = [
    { icon: 'sparkles', title: "AI-Powered Breakdown", description: "Our AI analyzes your tasks and automatically creates a detailed breakdown of subtasks.", color: "#FF6B6B" },
    { icon: 'clock', title: "Time Estimation", description: "Get accurate time estimates for each subtask to better plan your work.", color: "#6366F1" },
    { icon: 'check-circle', title: "Progress Tracking", description: "Track  your progress with visual indicators and completion percentages.", color: "#4ECDC4" }
  ];

  const benefits = [
    { text: "Smart task analysis", color: "#FF6B6B" },
    { text: "Automatic time estimation", color: "#6366F1" },
    { text: "Progress tracking", color: "#4ECDC4" }
  ];

  const tasks = [
    { done: true, text: "Conduct market research (60m)" },
    { done: true, text: "Identify target audience (30m)" },
    { done: false, text: "Develop marketing goals (45m)" },
    { done: false, text: "Create a budget (45m)" },
    { done: false, text: "Plan marketing strategies (60m)" }
  ];

  const featuresContainer = document.getElementById('features');
  const benefitsContainer = document.getElementById('benefits');
  const tasksContainer = document.getElementById('tasks');

  features.forEach(feature => {
    const featureElement = document.createElement('div');
    featureElement.className = 'bg-gradient-to-br from-[#1a1f35] to-[#0F1629] rounded-lg p-8 border border-gray-800 transition-all duration-500 opacity-0 translate-y-10';
    featureElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${feature.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mb-6">
        ${getIconPath(feature.icon)}
      </svg>
      <h3 class="text-xl font-bold mb-3 text-white">${feature.title}</h3>
      <p class="text-gray-300">${feature.description}</p>
    `;
    featuresContainer.appendChild(featureElement);
    setTimeout(() => {
      featureElement.classList.remove('opacity-0', 'translate-y-10');
    }, 100);
  });

  benefits.forEach(benefit => {
    const benefitElement = document.createElement('li');
    benefitElement.className = 'flex items-center text-lg text-white';
    benefitElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${benefit.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 mr-3 flex-shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${benefit.text}</span>
    `;
    benefitsContainer.appendChild(benefitElement);
  });

  tasks.forEach(task => {
    const taskElement = document.createElement('li');
    taskElement.className = `flex items-center ${task.done ? 'text-white' : 'text-gray-500'}`;
    taskElement.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${task.done ? '#4ECDC4' : '#4A5568'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 mr-3 flex-shrink-0">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>${task.text}</span>
    `;
    tasksContainer.appendChild(taskElement);
  });
});

function getIconPath(icon) {
  switch (icon) {
    case 'sparkles':
      return '<path d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l3.293 3.293a1 1 0 0 1 0 1.414l-3.293 3.293M13 21l3.293-3.293a1 1 0 0 0 0-1.414L13 13M21 13l-3.293 3.293a1 1 0 0 1-1.414 0L13 13M21 11l-3.293-3.293a1 1 0 0 0-1.414 0L13 11"></path>';
    case 'clock':
      return '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>';
    case 'check-circle':
      return '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>';
    default:
      return '';
  }
}