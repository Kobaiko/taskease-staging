export interface SubTask {
  id: string;
  title: string;
  estimatedTime: number; // in minutes
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  subTasks: SubTask[];
  createdAt: Date;
  dueDate?: Date;
}