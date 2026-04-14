import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil, interval } from 'rxjs';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { TaskService } from '../../core/services/task.service';
import { Task, CreateTaskDto } from '../../core/interfaces/task.interface';
import { TaskStatus } from '../../core/enums/task-status.enum';
import { TaskPriority } from '../../core/enums/task-priority.enum';

@Component({
  selector: 'app-task-list',
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent implements OnInit, OnDestroy {
  tasks: Task[] = [];
  loading = false;
  error: string | null = null;
  showForm = false;
  selectedTask?: Task;
  sortBy: 'priority' | 'dueDate' = 'priority';
  sortOrder: 'asc' | 'desc' = 'asc';
  currentTime = new Date().getTime(); // For timer calculations

  TaskStatus = TaskStatus; // Expose enum for template

  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    this.subscribeToLoadingState();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadTasks(): void {
    this.taskService.getTasks()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tasks) => {
          this.tasks = tasks;
          this.sortTasks();
          this.error = null;
        },
        error: (err) => {
          this.error = err.message;
          console.error('Error loading tasks:', err);
        }
      });
  }

  private subscribeToLoadingState(): void {
    this.taskService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => this.loading = loading);
  }

  onCreateTask(taskDto: CreateTaskDto): void {
    this.taskService.createTask(taskDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.showForm = false;
          this.loadTasks();
        },
        error: (err) => {
          this.error = err.message;
        }
      });
  }

  onEditTask(task: Task): void {
    // Prevent editing of completed tasks
    if (task.status === TaskStatus.DONE) {
      this.error = 'Cannot edit completed tasks';
      return;
    }
    this.selectedTask = task;
    this.showForm = true;
  }

  onDeleteTask(id: string): void {
    if (confirm('Are you sure you want to delete this task?')) {
      this.taskService.deleteTask(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => this.loadTasks(),
          error: (err) => {
            this.error = err.message;
          }
        });
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.selectedTask = undefined;
    }
  }

  drop(event: CdkDragDrop<Task[]>): void {
    // Reorder the tasks array
    moveItemInArray(this.tasks, event.previousIndex, event.currentIndex);
    
    // Note: With TaskPriority as enum (high/medium/low), drag-drop reordering
    // just changes visual order. To persist, we'd need a separate 'order' field.
    // For now, just update the UI order.
  }

  sortTasks(): void {
    this.tasks.sort((a, b) => {
      let comparison = 0;

      if (this.sortBy === 'dueDate') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = dateA - dateB;
      } else {
        // Sort by priority
        const priorityOrder = { [TaskPriority.HIGH]: 1, [TaskPriority.MEDIUM]: 2, [TaskPriority.LOW]: 3 };
        const priorityA = a.priority ? priorityOrder[a.priority] || 99 : 99;
        const priorityB = b.priority ? priorityOrder[b.priority] || 99 : 99;
        comparison = priorityA - priorityB;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  changeSortBy(sortBy: 'priority' | 'dueDate'): void {
    if (this.sortBy === sortBy) {
      // Toggle order if clicking the same sort field
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = 'asc';
    }
    this.sortTasks();
  }

  canEditTask(task: Task): boolean {
    return task.status !== TaskStatus.DONE;
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(task.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today && task.status !== TaskStatus.DONE;
  }

  getPriorityClass(priority: TaskPriority | undefined): string {
    switch (priority) {
      case TaskPriority.HIGH:
        return 'priority-high';
      case TaskPriority.MEDIUM:
        return 'priority-medium';
      case TaskPriority.LOW:
        return 'priority-low';
      default:
        return '';
    }
  }

  // Format duration in minutes to a human-readable string
  formatDuration(minutes: number): string {
    if (!minutes || minutes < 1) return '';
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} minute${mins !== 1 ? 's' : ''}`;
    } else if (mins === 0) {
      return `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      return `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Start a timer that updates current time every second
   */
  private startTimer(): void {
    interval(1000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentTime = new Date().getTime();
      });
  }

  /**
   * Calculate elapsed time in minutes for a task
   */
  getElapsedMinutes(task: Task): number {
    if (!task.startedAt || task.status !== TaskStatus.IN_PROGRESS) {
      return 0;
    }
    const startedAtTime = new Date(task.startedAt).getTime();
    return Math.floor((this.currentTime - startedAtTime) / (1000 * 60));
  }

  /**
   * Calculate remaining time in minutes for a task
   */
  getRemainingMinutes(task: Task): number {
    if (!task.duration || !task.startedAt || task.status !== TaskStatus.IN_PROGRESS) {
      return 0;
    }
    const elapsed = this.getElapsedMinutes(task);
    return Math.max(0, task.duration - elapsed);
  }

  /**
   * Get time progress percentage
   */
  getTimeProgress(task: Task): number {
    if (!task.duration || !task.startedAt || task.status !== TaskStatus.IN_PROGRESS) {
      return 0;
    }
    const elapsed = this.getElapsedMinutes(task);
    return Math.min(100, Math.floor((elapsed / task.duration) * 100));
  }

  /**
   * Check if task is in progress and has time tracking
   */
  isTaskTimerRunning(task: Task): boolean {
    return task.status === TaskStatus.IN_PROGRESS && 
           !!task.duration && 
           !!task.startedAt;
  }
}
