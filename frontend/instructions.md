# Frontend Development Instructions

## Overview

This document provides technical guidance for implementing the Task Management feature using Angular 17+ with TypeScript. These instructions assume 5+ years of Angular development experience and emphasize best practices, type safety, and clean architecture.

---

## ⚠️ CRITICAL INSTRUCTION - READ FIRST

**IMPLEMENT ONLY WHAT IS REQUESTED. NO ADDITIONAL FEATURES.**

- Only develop features explicitly specified in the requirements provided by the invigilator
- Do not add extra functionality, UI enhancements, or features beyond what is asked
- Focus on delivering exactly what is requested with high code quality
- Additional features, no matter how useful, will not add value to your submission
- Stick to the requirements - quality over quantity

---

## Architecture & Project Structure

### Recommended Folder Structure

The following structure is recommended for organizing your code. **Adapt it based on actual requirements** - only create what you need:

```
frontend/src/app/
├── core/
│   ├── interfaces/
│   │   └── task.interface.ts
│   ├── services/
│   │   └── task.service.ts
│   ├── interceptors/              // Only if error handling is required
│   │   └── http-error.interceptor.ts
│   └── enums/
│       └── task-status.enum.ts
├── features/
│   └── tasks/
│       ├── components/
│       │   ├── task-list/
│       │   ├── task-form/
│       │   └── task-item/
│       ├── tasks.module.ts         // Optional - if using feature modules
│       └── tasks-routing.module.ts // Only if routing is required
├── shared/
│   ├── components/
│   │   ├── loading-spinner/        // Only if loading states are required
│   │   └── error-message/          // Only if error display is required
│   └── directives/                 // Only if custom directives are needed
└── app.module.ts
```

**Important:** Create only the components and services needed to fulfill the requirements. Avoid over-engineering.

---

## TypeScript Configuration & Best Practices

### 1. Strict Type Safety

Ensure `tsconfig.json` has strict mode enabled:
```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### 2. Define Strong Type Interfaces

Create comprehensive interfaces for type safety:

```typescript
// core/interfaces/task.interface.ts
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskDto {
  title: string;
  description: string;
  status: TaskStatus;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  id: string;
}
```

### 3. Use Enums for Constants

```typescript
// core/enums/task-status.enum.ts
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in-progress',
  DONE = 'done'
}
```

---

## Service Layer Implementation

### HTTP Service with RxJS Best Practices

```typescript
// core/services/task.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap, finalize } from 'rxjs/operators';
import { Task, CreateTaskDto, UpdateTaskDto } from '../interfaces/task.interface';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly apiUrl = 'http://localhost:3001/tasks'; // or 3000 for full-stack
  
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  // GET all tasks
  getTasks(): Observable<Task[]> {
    this.loadingSubject.next(true);
    
    return this.http.get<Task[]>(this.apiUrl).pipe(
      tap(tasks => this.tasksSubject.next(tasks)),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
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
    
    return this.http.post<Task>(this.apiUrl, task).pipe(
      tap(newTask => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next([...currentTasks, newTask]);
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // PUT/PATCH update task
  updateTask(task: UpdateTaskDto): Observable<Task> {
    this.loadingSubject.next(true);
    
    return this.http.patch<Task>(`${this.apiUrl}/${task.id}`, task).pipe(
      tap(updatedTask => {
        const currentTasks = this.tasksSubject.value;
        const index = currentTasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          currentTasks[index] = updatedTask;
          this.tasksSubject.next([...currentTasks]);
        }
      }),
      catchError(this.handleError),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  // DELETE task
  deleteTask(id: string): Observable<void> {
    this.loadingSubject.next(true);
    
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        const currentTasks = this.tasksSubject.value;
        this.tasksSubject.next(currentTasks.filter(t => t.id !== id));
      }),
      catchError(this.handleError),
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
```

---

## Reactive Forms Implementation

### Form Component with Validation

```typescript
// features/tasks/components/task-form/task-form.component.ts
import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TaskStatus } from '../../../../core/enums/task-status.enum';
import { Task, CreateTaskDto } from '../../../../core/interfaces/task.interface';

@Component({
  selector: 'app-task-form',
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Output() submitForm = new EventEmitter<CreateTaskDto>();
  @Output() cancel = new EventEmitter<void>();

  taskForm!: FormGroup;
  taskStatuses = Object.values(TaskStatus);
  isEditMode = false;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.isEditMode = !!this.task;
    this.initializeForm();
  }

  private initializeForm(): void {
    this.taskForm = this.fb.group({
      title: [
        this.task?.title || '', 
        [Validators.required, Validators.minLength(3), Validators.maxLength(100)]
      ],
      description: [
        this.task?.description || '', 
        [Validators.required, Validators.minLength(10)]
      ],
      status: [
        this.task?.status || TaskStatus.TODO, 
        [Validators.required]
      ]
    });
  }

  onSubmit(): void {
    if (this.taskForm.valid) {
      const formValue: CreateTaskDto = {
        ...this.taskForm.value,
        createdAt: new Date().toISOString()
      };
      this.submitForm.emit(formValue);
      this.taskForm.reset();
    } else {
      this.markFormGroupTouched(this.taskForm);
    }
  }

  onCancel(): void {
    this.cancel.emit();
    this.taskForm.reset();
  }

  // Helper to show validation errors
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Getters for template access
  get title() { return this.taskForm.get('title'); }
  get description() { return this.taskForm.get('description'); }
  get status() { return this.taskForm.get('status'); }
}
```

---

## Component State Management

### Smart Component (Container)

```typescript
// features/tasks/components/task-list/task-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../../../core/services/task.service';
import { Task, CreateTaskDto } from '../../../../core/interfaces/task.interface';

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

  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    this.subscribeToLoadingState();
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
}
```

---

## Loading & Error State Components

### Loading Spinner Component

```typescript
// shared/components/loading-spinner/loading-spinner.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  template: `
    <div class="spinner-container">
      <div class="spinner"></div>
      <p>Loading...</p>
    </div>
  `,
  styles: [`
    .spinner-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class LoadingSpinnerComponent {}
```

### Error Message Component

```typescript
// shared/components/error-message/error-message.component.ts
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-error-message',
  template: `
    <div class="error-container" *ngIf="message">
      <p class="error-message">{{ message }}</p>
    </div>
  `,
  styles: [`
    .error-container {
      padding: 1rem;
      margin: 1rem 0;
      background-color: #fee;
      border-left: 4px solid #c33;
      border-radius: 4px;
    }
    .error-message {
      color: #c33;
      margin: 0;
    }
  `]
})
export class ErrorMessageComponent {
  @Input() message: string | null = null;
}
```

---

## Advanced Techniques

**Apply these techniques only when relevant to the requirements:**

### 1. HTTP Interceptor for Global Error Handling

**Only implement if global error handling is required:**

```typescript
// core/interceptors/http-error.interceptor.ts
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = '';
        
        if (error.error instanceof ErrorEvent) {
          errorMsg = `Client Error: ${error.error.message}`;
        } else {
          errorMsg = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
        }
        
        console.error(errorMsg);
        return throwError(() => error);
      })
    );
  }
}
```

Register in `app.module.ts`:
```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';

providers: [
  { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }
]
```

### 2. OnPush Change Detection Strategy

For performance optimization:

```typescript
import { ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-task-item',
  templateUrl: './task-item.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TaskItemComponent {
  @Input() task!: Task;
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<string>();
}
```

### 3. Async Pipe for Subscription Management

```html
<!-- task-list.component.html -->
<div *ngIf="taskService.loading$ | async" class="loading">
  <app-loading-spinner></app-loading-spinner>
</div>

<div *ngIf="taskService.tasks$ | async as tasks">
  <app-task-item 
    *ngFor="let task of tasks" 
    [task]="task"
    (edit)="onEditTask($event)"
    (delete)="onDeleteTask($event)">
  </app-task-item>
</div>
```

---

## Best Practices Checklist

### Code Quality
- ✅ Use strict TypeScript configuration
- ✅ Define interfaces for all data models
- ✅ Use enums for constant values
- ✅ Implement proper error handling (if required)
- ✅ Use RxJS operators effectively (tap, catchError, finalize)
- ✅ Unsubscribe from observables (use takeUntil pattern)

### Component Design
- ✅ Keep components focused and single-responsibility
- ✅ Use smart/dumb component pattern where appropriate
- ✅ Implement OnDestroy for cleanup
- ✅ Use ChangeDetectionStrategy.OnPush where appropriate
- ✅ Prefer async pipe over manual subscriptions

### Forms
- ✅ Use Reactive Forms for form handling (as specified)
- ✅ Implement validators as needed by requirements
- ✅ Show validation errors clearly
- ✅ Disable submit button when form is invalid

### State Management
- ✅ Use BehaviorSubject for shared state (if needed)
- ✅ Centralize state in services
- ✅ Expose observables as public properties
- ✅ Keep component state minimal

### HTTP & API
- ✅ Encapsulate all HTTP calls in services (as specified)
- ✅ Use Angular's HttpClient for all requests
- ✅ Set API base URL to `http://localhost:3001` (mock API) or `http://localhost:3000` (backend)
- ✅ Use proper HTTP methods (GET, POST, PATCH, DELETE)
- ✅ Implement query parameters only if filtering/sorting/pagination is required
- ✅ Handle loading states (as specified)
- ✅ Handle errors gracefully (as specified)
- ✅ Use interceptors only if cross-cutting concerns need to be addressed

### **Remember: Only implement what is explicitly requested in the requirements**

---

## Testing Considerations

**Only implement tests if explicitly requested in the requirements.**

### Unit Test Example

```typescript
// task.service.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { Task } from '../interfaces/task.interface';
import { TaskStatus } from '../enums/task-status.enum';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should retrieve tasks from API', () => {
    const mockTasks: Task[] = [
      { id: '1', title: 'Test', description: 'Test', status: TaskStatus.TODO, createdAt: '' }
    ];

    service.getTasks().subscribe(tasks => {
      expect(tasks.length).toBe(1);
      expect(tasks).toEqual(mockTasks);
    });

    const req = httpMock.expectOne('http://localhost:3001/tasks');
    expect(req.request.method).toBe('GET');
    req.flush(mockTasks);
  });
});
```

---

## API Integration Guide

### API Base URLs
- **Mock API (Frontend-only):** `http://localhost:3001`
- **Full-Stack Backend:** `http://localhost:3000`

### Available Endpoints

All endpoints are automatically provided by json-server:

#### Basic CRUD Operations
- `GET /tasks` - Retrieve all tasks
- `GET /tasks/:id` - Retrieve a single task by ID
- `POST /tasks` - Create a new task
- `PUT /tasks/:id` - Update entire task (replace)
- `PATCH /tasks/:id` - Update partial task fields
- `DELETE /tasks/:id` - Delete a task

#### Advanced Query Features

**Use these features ONLY if specifically requested in your requirements:**

**Filtering:**
```typescript
// Filter tasks by status
this.http.get<Task[]>('http://localhost:3001/tasks?status=todo');

// Multiple filters
this.http.get<Task[]>('http://localhost:3001/tasks?status=todo&createdAt=2026-02-18');
```

**Sorting:**
```typescript
// Sort by createdAt descending
this.http.get<Task[]>('http://localhost:3001/tasks?_sort=createdAt&_order=desc');

// Sort by multiple fields
this.http.get<Task[]>('http://localhost:3001/tasks?_sort=status,createdAt&_order=asc,desc');
```

**Pagination:**
```typescript
// Get page 1 with 10 items per page
this.http.get<Task[]>('http://localhost:3001/tasks?_page=1&_limit=10');
```

### Service Implementation with Query Parameters

**Note:** Only implement filtering, sorting, and pagination if explicitly requested in the requirements.

```typescript
// Enhanced service with filtering and pagination (ONLY IF REQUIRED)
getTasks(filter?: { status?: string; page?: number; limit?: number }): Observable<Task[]> {
  this.loadingSubject.next(true);
  
  let params = new HttpParams();
  if (filter?.status) {
    params = params.set('status', filter.status);
  }
  if (filter?.page) {
    params = params.set('_page', filter.page.toString());
  }
  if (filter?.limit) {
    params = params.set('_limit', filter.limit.toString());
  }
  
  return this.http.get<Task[]>(this.apiUrl, { params }).pipe(
    tap(tasks => this.tasksSubject.next(tasks)),
    catchError(this.handleError),
    finalize(() => this.loadingSubject.next(false))
  );
}
```

### Important API Notes

- **IDs are auto-generated** when you POST without an id
- Data persists between server restarts (saved to db.json)
- The server has **CORS enabled** by default
- Returns proper HTTP status codes (200, 201, 404, etc.)
- Changes made through the API are **automatically saved** to db.json

---

## Quick Reference

### Common RxJS Operators
- `tap()` - Side effects without changing stream
- `catchError()` - Error handling
- `finalize()` - Cleanup (like try-finally)
- `takeUntil()` - Unsubscribe pattern
- `map()` - Transform data
- `switchMap()` - Switch to new observable (cancels previous)

### Angular CLI Commands
```bash
# Generate service
ng generate service core/services/task

# Generate component
ng generate component features/tasks/components/task-list

# Generate interface
ng generate interface core/interfaces/task

# Generate enum
ng generate enum core/enums/task-status
```

---

## Additional Resources

- [Angular Documentation](https://angular.io/docs)
- [Angular HttpClient Guide](https://angular.io/guide/http)
- [RxJS Documentation](https://rxjs.dev/)
- [Angular Style Guide](https://angular.io/guide/styleguide)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [json-server Documentation](https://github.com/typicode/json-server)
- See `../mock-api/README.md` for complete API documentation and examples

---

**Good luck with your implementation! 🚀**
