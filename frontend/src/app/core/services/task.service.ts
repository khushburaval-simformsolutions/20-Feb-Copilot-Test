import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject, forkJoin, of, fromEvent, merge } from 'rxjs';
import { catchError, tap, finalize, map } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto } from '../interfaces/task.interface';
import { StorageService, PendingOperation } from './storage.service';
import { TaskStatus } from '../enums/task-status.enum';
import { TaskPriority } from '../enums/task-priority.enum';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = 'http://localhost:3001/tasks';
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  // Online/Offline detection
  private isOnlineSubject = new BehaviorSubject<boolean>(navigator.onLine);
  public isOnline$ = this.isOnlineSubject.asObservable();

  // Pending changes count
  private pendingChangesSubject = new BehaviorSubject<number>(0);
  public pendingChanges$ = this.pendingChangesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private storageService: StorageService
  ) {
    this.initializeOnlineOfflineDetection();
    this.updatePendingChangesCount();
  }

  /**
   * Initialize online/offline event listeners
   */
  private initializeOnlineOfflineDetection(): void {
    // Listen to online and offline events
    merge(
      fromEvent(window, 'online'),
      fromEvent(window, 'offline')
    ).subscribe(() => {
      const isOnline = navigator.onLine;
      this.isOnlineSubject.next(isOnline);
      
      // Auto-sync when connection is restored
      if (isOnline) {
        console.log('Connection restored. Syncing pending operations...');
        this.syncPendingOperations().subscribe({
          next: () => console.log('Sync completed successfully'),
          error: (err) => console.error('Sync failed:', err)
        });
      }
    });
  }

  /**
   * Update pending changes count
   */
  private updatePendingChangesCount(): void {
    const count = this.storageService.getPendingOperationsCount();
    this.pendingChangesSubject.next(count);
  }

  // GET all tasks
  getTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);
    
    // First, load from localStorage immediately for instant display
    const cachedTasks = this.storageService.getTasks();
    if (cachedTasks) {
      this.tasksSubject.next(cachedTasks);
    }

    // If online, fetch from API and update cache
    if (this.isOnlineSubject.value) {
      return this.http.get<Task[]>(this.apiUrl).pipe(
        tap(tasks => {
          this.tasksSubject.next(tasks);
          this.storageService.saveTasks(tasks);
        }),
        catchError(error => {
          // If API fails but we have cached data, return it
          if (cachedTasks) {
            return of(cachedTasks);
          }
          return this.handleError(error);
        }),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      // If offline, return cached data
      this.loadingSubject.next(false);
      return of(cachedTasks || []);
    }
  }

  // GET task by ID
  getTaskById(id: string): Observable<Task> {
    this.loadingSubject.next(true);
    
    return this.http.get<Task>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // POST create task
  createTask(task: CreateTaskDto): Observable<Task> {
    this.loadingSubject.next(true);
    
    if (this.isOnlineSubject.value) {
      // Online: normal API call + update localStorage
      return this.http.post<Task>(this.apiUrl, task).pipe(
        tap(newTask => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next([...currentTasks, newTask]);
          this.storageService.saveTask(newTask);
        }),
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      // Offline: save to localStorage + queue operation
      const tempId = 'temp_' + Date.now();
      const newTask: Task = {
        ...task,
        id: tempId,
        status: task.status || TaskStatus.TODO,
        priority: task.priority || TaskPriority.MEDIUM,
        dueDate: task.dueDate || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this.storageService.saveTask(newTask);
      this.storageService.queueOperation({
        id: tempId,
        type: 'create',
        taskData: task,
        timestamp: Date.now()
      });
      this.updatePendingChangesCount();

      const currentTasks = this.tasksSubject.value;
      this.tasksSubject.next([...currentTasks, newTask]);
      this.loadingSubject.next(false);
      
      return of(newTask);
    }
  }

  // PATCH update task
  updateTask(task: UpdateTaskDto): Observable<Task> {
    this.loadingSubject.next(true);
    
    if (this.isOnlineSubject.value) {
      // Online: API call + update localStorage
      return this.http.patch<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
        tap(updatedTask => {
          const currentTasks = this.tasksSubject.value;
          const index = currentTasks.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            currentTasks[index] = updatedTask;
            this.tasksSubject.next([...currentTasks]);
          }
          this.storageService.saveTask(updatedTask);
        }),
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      // Offline: update localStorage + queue operation
      const currentTasks = this.tasksSubject.value;
      const index = currentTasks.findIndex(t => t.id === task.id);
      
      if (index !== -1) {
        const updatedTask = { ...currentTasks[index], ...task };
        currentTasks[index] = updatedTask;
        this.tasksSubject.next([...currentTasks]);
        this.storageService.saveTask(updatedTask);
        
        this.storageService.queueOperation({
          id: task.id,
          type: 'update',
          taskData: task,
          timestamp: Date.now()
        });
        this.updatePendingChangesCount();
        
        this.loadingSubject.next(false);
        return of(updatedTask);
      }
      
      this.loadingSubject.next(false);
      return throwError(() => new Error('Task not found'));
    }
  }

  // DELETE task
  deleteTask(id: string): Observable<void> {
    this.loadingSubject.next(true);
    
    if (this.isOnlineSubject.value) {
      // Online: API call + remove from localStorage
      return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
        tap(() => {
          const currentTasks = this.tasksSubject.value;
          this.tasksSubject.next(currentTasks.filter(t => t.id !== id));
          this.storageService.removeTask(id);
        }),
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      // Offline: remove from localStorage + queue operation
      const currentTasks = this.tasksSubject.value;
      this.tasksSubject.next(currentTasks.filter(t => t.id !== id));
      this.storageService.removeTask(id);
      
      this.storageService.queueOperation({
        id: id,
        type: 'delete',
        taskData: { id },
        timestamp: Date.now()
      });
      this.updatePendingChangesCount();
      
      this.loadingSubject.next(false);
      return of(void 0);
    }
  }

  // PATCH update task priorities (bulk update)
  updateTaskPriorities(tasks: Task[]): Observable<Task[]> {
    this.loadingSubject.next(true);
    
    if (this.isOnlineSubject.value) {
      // Online: bulk API update
      const updateRequests = tasks.map(task => 
        this.http.patch<Task>(`${this.apiUrl}/${task.id}`, { priority: task.priority })
      );
      
      return forkJoin(updateRequests).pipe(
        tap(updatedTasks => {
          this.tasksSubject.next(updatedTasks);
          this.storageService.saveTasks(updatedTasks);
        }),
        catchError(this.handleError),
        finalize(() => this.loadingSubject.next(false))
      );
    } else {
      // Offline: update localStorage and queue each operation
      tasks.forEach(task => {
        this.storageService.saveTask(task);
        this.storageService.queueOperation({
          id: task.id,
          type: 'update',
          taskData: { id: task.id, priority: task.priority },
          timestamp: Date.now()
        });
      });
      
      this.updatePendingChangesCount();
      this.storageService.saveTasks(tasks);
      this.loadingSubject.next(false);
      
      return of(tasks);
    }
  }

  /**
   * Sync pending operations with the server
   */
  syncPendingOperations(): Observable<void> {
    const pendingOperations = this.storageService.getPendingOperations();
    
    if (pendingOperations.length === 0) {
      return of(void 0);
    }

    if (!this.isOnlineSubject.value) {
      return throwError(() => new Error('Cannot sync while offline'));
    }

    console.log(`Syncing ${pendingOperations.length} pending operations...`);
    this.loadingSubject.next(true);

    // Execute operations sequentially
    const syncOperations = pendingOperations.map(op => {
      switch (op.type) {
        case 'create':
          return this.http.post<Task>(this.apiUrl, op.taskData).pipe(
            tap(newTask => {
              // Replace temp task with real task
              if (op.id.startsWith('temp_')) {
                this.storageService.removeTask(op.id);
                this.storageService.saveTask(newTask);
              }
            }),
            catchError(err => {
              console.error(`Failed to sync create operation for ${op.id}:`, err);
              return of(null);
            })
          );
        
        case 'update':
          return this.http.patch<Task>(`${this.apiUrl}/${op.id}`, op.taskData).pipe(
            tap(updatedTask => {
              if (updatedTask) {
                this.storageService.saveTask(updatedTask);
              }
            }),
            catchError(err => {
              console.error(`Failed to sync update operation for ${op.id}:`, err);
              return of(null);
            })
          );
        
        case 'delete':
          return this.http.delete<void>(`${this.apiUrl}/${op.id}`).pipe(
            tap(() => {
              this.storageService.removeTask(op.id);
            }),
            catchError(err => {
              console.error(`Failed to sync delete operation for ${op.id}:`, err);
              return of(null);
            })
          );
        
        default:
          return of(null);
      }
    });

    return forkJoin(syncOperations).pipe(
      tap(() => {
        // Clear pending operations after successful sync
        this.storageService.clearPendingOperations();
        this.updatePendingChangesCount();
        
        // Refresh tasks from server
        this.getTasks().subscribe();
      }),
      map(() => void 0),
      catchError(err => {
        console.error('Sync failed:', err);
        return throwError(() => new Error('Failed to sync pending operations'));
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // Centralized error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Server Error: ${error.status} - ${error.message}`;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
