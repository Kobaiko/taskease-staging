import { 
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Task, SubTask } from '../types';

const TASKS_COLLECTION = 'tasks';

export async function getUserTasks(userId: string): Promise<Task[]> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)
    } as Task;
  });
}

export async function createTask(userId: string, task: Omit<Task, 'id'>): Promise<string> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const timestamp = serverTimestamp();
  
  const taskData = {
    ...task,
    userId,
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const docRef = await addDoc(tasksRef, taskData);
  return docRef.id;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  
  const updateData = {
    subTasks: updates.subTasks,
    completed: updates.completed,
    updatedAt: serverTimestamp()
  };

  await updateDoc(taskRef, updateData);
}

export async function deleteTask(taskId: string): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  await deleteDoc(taskRef);
}

export async function deleteAllUserTasks(userId: string): Promise<void> {
  const tasksRef = collection(db, TASKS_COLLECTION);
  const q = query(tasksRef, where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}

export async function updateSubtaskStatus(taskId: string, subtaskId: string, completed: boolean): Promise<void> {
  const taskRef = doc(db, TASKS_COLLECTION, taskId);
  const taskDoc = await getDoc(taskRef);

  if (!taskDoc.exists()) {
    throw new Error('Task not found');
  }

  const taskData = taskDoc.data() as Task;
  const updatedSubtasks = taskData.subTasks.map(st =>
    st.id === subtaskId ? { ...st, completed } : st
  );

  await updateDoc(taskRef, {
    subTasks: updatedSubtasks,
    completed: updatedSubtasks.every(st => st.completed),
    updatedAt: serverTimestamp()
  });
}