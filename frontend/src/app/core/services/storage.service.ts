import { Injectable } from '@angular/core';
import { Task } from '../interfaces/task.interface';

// Interface for pending operations queue
export interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  taskData: Partial<Task>;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly TASKS_KEY = 'tasks';
  private readonly PENDING_OPERATIONS_KEY = 'pendingOperations';

  constructor() {}

  /**
   * Save all tasks to localStorage
   */
  saveTasks(tasks: Task[]): void {
    try {
      const tasksJson = JSON.stringify(tasks);
      localStorage.setItem(this.TASKS_KEY, tasksJson);
    } catch (error) {
      this.handleStorageError(error, 'saveTasks');
    }
  }

  /**
   * Retrieve all tasks from localStorage
   */
  getTasks(): Task[] | null {
    try {
      const tasksJson = localStorage.getItem(this.TASKS_KEY);
      if (!tasksJson) {
        return null;
      }
      return JSON.parse(tasksJson) as Task[];
    } catch (error) {
      this.handleStorageError(error, 'getTasks');
      return null;
    }
  }

  /**
   * Save or update a single task in localStorage
   */
  saveTask(task: Task): void {
    try {
      const tasks = this.getTasks() || [];
      const existingIndex = tasks.findIndex(t => t.id === task.id);
      
      if (existingIndex !== -1) {
        // Update existing task
        tasks[existingIndex] = task;
      } else {
        // Add new task
        tasks.push(task);
      }
      
      this.saveTasks(tasks);
    } catch (error) {
      this.handleStorageError(error, 'saveTask');
    }
  }

  /**
   * Remove a task from localStorage by ID
   */
  removeTask(id: string): void {
    try {
      const tasks = this.getTasks() || [];
      const filteredTasks = tasks.filter(t => t.id !== id);
      this.saveTasks(filteredTasks);
    } catch (error) {
      this.handleStorageError(error, 'removeTask');
    }
  }

  /**
   * Queue an operation for offline sync
   */
  queueOperation(operation: PendingOperation): void {
    try {
      const operations = this.getPendingOperations();
      operations.push(operation);
      const operationsJson = JSON.stringify(operations);
      localStorage.setItem(this.PENDING_OPERATIONS_KEY, operationsJson);
    } catch (error) {
      this.handleStorageError(error, 'queueOperation');
    }
  }

  /**
   * Get all pending operations from queue
   */
  getPendingOperations(): PendingOperation[] {
    try {
      const operationsJson = localStorage.getItem(this.PENDING_OPERATIONS_KEY);
      if (!operationsJson) {
        return [];
      }
      return JSON.parse(operationsJson) as PendingOperation[];
    } catch (error) {
      this.handleStorageError(error, 'getPendingOperations');
      return [];
    }
  }

  /**
   * Clear all pending operations after successful sync
   */
  clearPendingOperations(): void {
    try {
      localStorage.removeItem(this.PENDING_OPERATIONS_KEY);
    } catch (error) {
      this.handleStorageError(error, 'clearPendingOperations');
    }
  }

  /**
   * Clear all localStorage data
   */
  clearAll(): void {
    try {
      localStorage.removeItem(this.TASKS_KEY);
      localStorage.removeItem(this.PENDING_OPERATIONS_KEY);
    } catch (error) {
      this.handleStorageError(error, 'clearAll');
    }
  }

  /**
   * Get the count of pending operations
   */
  getPendingOperationsCount(): number {
    return this.getPendingOperations().length;
  }

  /**
   * Handle storage errors with proper logging
   */
  private handleStorageError(error: any, operation: string): void {
    if (error instanceof DOMException) {
      if (error.name === 'QuotaExceededError') {
        console.error(`localStorage quota exceeded during ${operation}. Consider clearing old data.`);
        // Optionally, you could clear old data or notify the user
      } else {
        console.error(`localStorage error during ${operation}:`, error);
      }
    } else {
      console.error(`Unexpected error during ${operation}:`, error);
    }
  }
}
