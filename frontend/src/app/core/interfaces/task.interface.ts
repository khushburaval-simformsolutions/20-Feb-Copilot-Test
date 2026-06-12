import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // ISO date string
  duration?: number; // Duration in minutes to complete the task
  startedAt?: string; // ISO date string - when task status changed to IN_PROGRESS
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  duration?: number; // Duration in minutes to complete the task
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  id: string;
  startedAt?: string; // ISO date string - when task status changed to IN_PROGRESS
}
