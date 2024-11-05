import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Task } from '../types';

const TASKS_COLLECTION = 'tasks';

export async function getUserTasks(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Task));
}

export async function createTask(userId: string, task: Omit<Task, 'id'>): Promise<string> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const docRef = await addDoc(tasksRef, {
    ...task,
    userId,
    createdAt: serverTimestamp(),
    completed: false
  });
  return docRef.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await updateDoc(taskRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(taskRef);
}

export async function updateSubtaskStatus(
  taskId: string,
  subtaskId: string,
  completed: boolean
): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const task = (await getDocs(query(collection(db, TASKS_COLLECTION), where('id', '==', taskId)))).docs[0];
  
  if (!task) throw new Error('Task not found');
  
  const updatedSubtasks = task.data().subTasks.map((st: any) =>
    st.id === subtaskId ? { ...st, completed } : st
  );
  
  await updateDoc(taskRef, {
    subTasks: updatedSubtasks,
    completed: updatedSubtasks.every((st: any) => st.completed),
    updatedAt: serverTimestamp()
  });
}