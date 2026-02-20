# Task Management Feature - Implementation Plan

**Reference:** See [instructions.md](./instructions.md) for detailed technical guidelines and best practices.

---

## Tasks Overview

### Phase 1: Core Features
1. ✅ **Create TypeScript interfaces and enums**
2. ✅ **Create a service to handle API calls**
3. ✅ **Create a task management component**
4. ✅ **Build forms for creating/editing tasks**
5. ✅ **Implement proper error handling**
6. ✅ **Add loading states for async operations**
7. ✅ **Display tasks in a user-friendly way**

### Phase 2: Advanced Features
8. ✅ **Implement drag-and-drop task reordering**
9. ✅ **Add local storage and offline support**

---

## Task 1: Create TypeScript Interfaces and Enums

### Objective
Set up strong typing for the task management feature using TypeScript interfaces and enums.

### Files to Create
- `src/app/core/interfaces/task.interface.ts`
- `src/app/core/enums/task-status.enum.ts`

### Prompt
```
Create TypeScript interfaces and enums for the task management feature:

1. Create the task status enum at src/app/core/enums/task-status.enum.ts with values: 'todo', 'in-progress', 'done'

2. Create task interfaces at src/app/core/interfaces/task.interface.ts with:
   - Task interface with: id (string), title (string), description (string), status (TaskStatus), createdAt (string), updatedAt (optional string)
   - CreateTaskDto interface with: title, description, status
   - UpdateTaskDto interface extending Partial<CreateTaskDto> with id

Follow TypeScript strict typing as per instructions.md.
```

---

## Task 2: Create a Service to Handle API Calls

### Objective
Create a service that encapsulates all HTTP operations for task management with proper error handling, loading states, and RxJS best practices.

### Files to Create
- `src/app/core/services/task.service.ts`

### Dependencies
- Task interfaces and enums (Task 1)
- HttpClientModule in app.module.ts

### Prompt
```
Create a TaskService at src/app/core/services/task.service.ts following the guidelines in instructions.md:

Requirements:
1. Use Angular's HttpClient for all API calls
2. Set API base URL to http://localhost:3001/tasks
3. Implement BehaviorSubject for loading state (loading$)
4. Implement BehaviorSubject for tasks state (tasks$)
5. Create methods for:
   - getTasks(): Observable<Task[]>
   - getTaskById(id: string): Observable<Task>
   - createTask(task: CreateTaskDto): Observable<Task>
   - updateTask(task: UpdateTaskDto): Observable<Task>
   - deleteTask(id: string): Observable<void>
6. Use RxJS operators: tap, catchError, finalize
7. Implement centralized error handling in handleError method
8. Update BehaviorSubjects appropriately on CRUD operations
9. Set loading state before and after API calls

Follow the service implementation pattern from instructions.md.
```

---

## Task 3: Create a Task Management Component

### Objective
Create a smart component that manages the overall task list, handles user interactions, and manages component state.

### Files to Create
- `src/app/components/task-list/task-list.component.ts`
- `src/app/components/task-list/task-list.component.html`
- `src/app/components/task-list/task-list.component.css`

### Dependencies
- TaskService (Task 2)
- Task interfaces (Task 1)

### Prompt
```
Create a TaskListComponent at src/app/components/task-list/ following the smart component pattern from instructions.md:

Requirements:
1. Inject TaskService
2. Component state properties: tasks[], loading, error, showForm, selectedTask
3. Implement OnInit and OnDestroy lifecycle hooks
4. Use Subject for unsubscription pattern (destroy$)
5. Implement methods:
   - loadTasks(): Subscribe to taskService.getTasks() with proper error handling
   - subscribeToLoadingState(): Subscribe to taskService.loading$
   - onCreateTask(taskDto): Call taskService.createTask()
   - onEditTask(task): Set selectedTask and show form
   - onDeleteTask(id): Confirm and call taskService.deleteTask()
   - toggleForm(): Toggle form visibility
6. Use takeUntil(destroy$) for all subscriptions
7. Properly handle next/error callbacks
8. Clean up subscriptions in ngOnDestroy

Follow the component pattern from instructions.md.
```

---

## Task 4: Build Forms for Creating/Editing Tasks

### Objective
Create a reactive form component for creating and editing tasks with proper validation.

### Files to Create
- `src/app/components/task-form/task-form.component.ts`
- `src/app/components/task-form/task-form.component.html`
- `src/app/components/task-form/task-form.component.css`

### Dependencies
- Task interfaces (Task 1)
- ReactiveFormsModule in app.module.ts

### Prompt
```
Create a TaskFormComponent at src/app/components/task-form/ using Angular Reactive Forms as per instructions.md:

Requirements:
1. Use FormBuilder to create reactive form
2. Inputs: @Input() task?: Task (for edit mode)
3. Outputs: @Output() submitForm, @Output() cancel
4. Form fields with validators:
   - title: required, minLength(3), maxLength(100)
   - description: required, minLength(10)
   - status: required
5. Implement methods:
   - initializeForm(): Initialize form with validators
   - onSubmit(): Validate and emit form value
   - onCancel(): Emit cancel and reset form
   - markFormGroupTouched(): Helper to show validation errors
6. Create getters for form controls (title, description, status)
7. Set isEditMode based on task input
8. Pre-populate form if task is provided (edit mode)

Template should:
- Display validation errors
- Disable submit button when form is invalid
- Show different button text for create vs edit

Follow the Reactive Forms pattern from instructions.md.
```

---

## Task 5: Implement Proper Error Handling

### Objective
Create reusable error message component to display errors across the application.

### Files to Create
- `src/app/shared/components/error-message/error-message.component.ts`

### Prompt
```
Create an ErrorMessageComponent at src/app/shared/components/error-message/ as shown in instructions.md:

Requirements:
1. Create inline template component
2. Input property: @Input() message: string | null = null
3. Display error only when message exists (*ngIf="message")
4. Style with error container: red border, light red background
5. Make it reusable across different components

Use the exact implementation from instructions.md for consistency.
```

---

## Task 6: Add Loading States for Async Operations

### Objective
Create a loading spinner component to show during async operations.

### Files to Create
- `src/app/shared/components/loading-spinner/loading-spinner.component.ts`

### Prompt
```
Create a LoadingSpinnerComponent at src/app/shared/components/loading-spinner/ as shown in instructions.md:

Requirements:
1. Create inline template component
2. Display a CSS spinner animation
3. Show "Loading..." text
4. Center align the spinner
5. Use the spinner CSS animation from instructions.md
6. Make it reusable across different components

Use the exact implementation from instructions.md for consistency.
```

---

## Task 7: Display Tasks in a User-Friendly Way

### Objective
Create the main task list template and integrate all components together with proper user experience.

### Files to Update
- `src/app/components/task-list/task-list.component.html`
- `src/app/app.module.ts`

### Dependencies
- All previous tasks completed

### Prompt
```
Update TaskListComponent template to display tasks in a user-friendly way:

Requirements:
1. Show loading spinner when loading is true
2. Show error message when error exists
3. Display create task button
4. Show/hide task form based on showForm state
5. Pass selectedTask to form for edit mode
6. Display tasks in a clean, organized layout
7. For each task show:
   - Title
   - Description
   - Status badge (with color coding)
   - Edit button
   - Delete button
8. Handle empty state (no tasks)
9. Ensure responsive design

Also update app.module.ts to:
1. Import HttpClientModule
2. Import ReactiveFormsModule
3. Declare all components
4. Provide TaskService

Follow the component integration pattern from instructions.md.
```

---

## Task 8: Implement Drag-and-Drop Task Reordering

### Objective
Enable users to reorder tasks by dragging and dropping them, with visual feedback and persistent priority updates.

### Files to Create/Update
- Install `@angular/cdk` package
- Update `src/app/core/interfaces/task.interface.ts` (add priority field)
- Update `src/app/components/task-list/task-list.component.ts`
- Update `src/app/components/task-list/task-list.component.html`
- Update `src/app/components/task-list/task-list.component.css`
- Update `src/app/core/services/task.service.ts` (add updatePriorities method)
- Update `src/app/app.module.ts` (import DragDropModule)

### Dependencies
- Tasks 1-7 completed
- Angular CDK library

### Prompt
```
Implement drag-and-drop task reordering functionality:

Requirements:
1. Install Angular CDK: Run `npm install @angular/cdk`
2. Add 'priority' field (number) to Task interface in src/app/core/interfaces/task.interface.ts
3. Import DragDropModule from @angular/cdk/drag-drop in app.module.ts
4. Update task-list.component.html:
   - Wrap task list in cdkDropList container
   - Add cdkDrag directive to each task item
   - Add (cdkDropListDropped) event handler
   - Include drag handle visual indicator
5. Update task-list.component.ts:
   - Implement drop(event: CdkDragDrop<Task[]>) method
   - Reorder tasks array using moveItemInArray
   - Update priority values for all tasks
   - Call service to persist new priorities
   - Sort tasks by priority on load
6. Update task.service.ts:
   - Add updateTaskPriorities(tasks: Task[]): Observable<Task[]> method
   - Make bulk API call to update priorities
7. Add CSS for drag feedback:
   - Placeholder styling during drag
   - Dragging state styles
   - Hover effects
   - Drag handle icon

Visual feedback should include:
- Dashed border placeholder where item will drop
- Reduced opacity for dragged item
- Smooth animations
- Clear drag handle icon (⋮⋮)

Follow Angular CDK drag-drop best practices.
```

---

## Task 9: Add Local Storage and Offline Support

### Objective
Implement offline-first functionality with localStorage caching and operation queuing for seamless offline/online transitions.

### Files to Create/Update
- Create `src/app/core/services/storage.service.ts`
- Create `src/app/shared/components/sync-status/sync-status.component.ts`
- Update `src/app/core/services/task.service.ts`
- Update `src/app/app.component.html`
- Update `src/app/app.module.ts`

### Dependencies
- Tasks 1-8 completed

### Prompt Part 1: Storage Service
```
Create a StorageService for localStorage management and offline support:

Requirements:
1. Generate service: src/app/core/services/storage.service.ts
2. Implement methods:
   - saveTasks(tasks: Task[]): void - Save tasks to localStorage
   - getTasks(): Task[] | null - Retrieve tasks from localStorage
   - saveTask(task: Task): void - Save single task
   - removeTask(id: string): void - Remove task from cache
   - queueOperation(operation: PendingOperation): void - Queue offline operations
   - getPendingOperations(): PendingOperation[] - Get queued operations
   - clearPendingOperations(): void - Clear queue after sync
   - clearAll(): void - Clear all localStorage data
3. Define PendingOperation interface:
   - type: 'create' | 'update' | 'delete'
   - taskData: Partial<Task>
   - timestamp: number
   - id: string
4. Use localStorage keys:
   - 'tasks' for cached tasks
   - 'pendingOperations' for offline queue
5. Handle JSON serialization/deserialization
6. Add error handling for localStorage quota exceeded

Follow Angular service patterns with proper error handling.
```

### Prompt Part 2: Update Task Service for Offline
```
Update TaskService to support offline mode with localStorage fallback:

Requirements:
1. Inject StorageService in task.service.ts
2. Add online/offline detection:
   - Subscribe to window online/offline events
   - Maintain isOnline$ BehaviorSubject
3. Modify getTasks():
   - First, load from localStorage immediately
   - Then fetch from API if online
   - Update localStorage with API response
   - If offline, return cached data
4. Modify createTask():
   - If online: normal API call + update localStorage
   - If offline: save to localStorage + queue operation
5. Modify updateTask():
   - If online: API call + update localStorage
   - If offline: update localStorage + queue operation
6. Modify deleteTask():
   - If online: API call + remove from localStorage
   - If offline: remove from localStorage + queue operation
7. Implement syncPendingOperations():
   - Get queued operations from StorageService
   - Execute each operation in order
   - Clear queue on success
   - Handle sync errors gracefully
8. Auto-sync when connection is restored:
   - Listen to online event
   - Automatically call syncPendingOperations()
9. Add pendingChanges$ BehaviorSubject to track queue count

Ensure seamless user experience during online/offline transitions.
```

### Prompt Part 3: Sync Status Component
```
Create a SyncStatusComponent to display online/offline status and pending changes:

Requirements:
1. Create component at src/app/shared/components/sync-status/sync-status.component.ts
2. Display in top-right corner with fixed positioning
3. Show different states:
   - Online + Synced: Green dot + "Online" + checkmark
   - Online + Pending: Yellow dot + "Syncing..." + count badge
   - Offline: Red dot + "Offline" + pending count
4. Component properties:
   - isOnline$: Observable<boolean> from TaskService
   - pendingCount$: Observable<number> from TaskService
   - isSyncing: boolean flag
5. Add manual "Sync Now" button:
   - Only show when pendingCount > 0
   - Call taskService.syncPendingOperations()
   - Show loading spinner during sync
6. Template structure:
   - Status dot (colored circle)
   - Status text
   - Pending count badge
   - Sync button (conditional)
7. Styling:
   - Fixed position: top-right
   - Small, unobtrusive design
   - Smooth color transitions
   - Pulsing animation when syncing
   - Badge with pending count
8. Update app.component.html:
   - Add <app-sync-status></app-sync-status> in nav or header
9. Declare component in app.module.ts

Design should be minimal and informative without blocking content.
```

---

## Implementation Order - Advanced Features

Execute advanced tasks in this sequence:
1. **Task 8:** Drag-and-Drop (implement and test with API)
2. **Task 9 Part 1:** Create StorageService
3. **Task 9 Part 2:** Update TaskService for offline mode
4. **Task 9 Part 3:** Create SyncStatusComponent
5. **Integration Test:** Verify drag-drop works offline

---

## Advanced Testing Checklist

After implementing Tasks 8-9, verify:

### Drag-and-Drop Testing
- ✅ Can drag tasks up and down
- ✅ Visual placeholder shows where task will drop
- ✅ Dragged item has visual feedback
- ✅ Task order persists after page reload
- ✅ Priority values update correctly
- ✅ Drag handle is clearly visible

### Offline Support Testing
- ✅ Tasks load from cache on app start
- ✅ Can create tasks while offline
- ✅ Can edit tasks while offline
- ✅ Can delete tasks while offline
- ✅ Can reorder tasks while offline
- ✅ Sync status shows "Offline" when offline
- ✅ Pending count increases with offline operations
- ✅ Changes sync automatically when back online
- ✅ Manual sync button works
- ✅ No data loss during offline/online transitions
- ✅ Sync status indicator displays correctly

### Integration Testing
- ✅ Drag-drop + offline: Reordering works offline and syncs
- ✅ Form + offline: Creating/editing persists offline
- ✅ All features work in offline mode
- ✅ Smooth transition between offline/online states

### Manual Testing Steps
1. **Test Offline Mode:**
   - Open DevTools → Network tab → Set to "Offline"
   - Create, edit, delete tasks
   - Verify changes in localStorage
   - Go back "Online"
   - Verify sync happens automatically

2. **Test Drag-and-Drop:**
   - Drag tasks to reorder
   - Refresh page, verify order persists
   - Go offline, reorder, go online, verify sync

3. **Test Sync Status:**
   - Watch indicator change with network status
   - Verify pending count increases/decreases
   - Test manual sync button

---

## Implementation Order

Execute tasks in the following sequence:

### Phase 1: Core Features (Completed ✅)
1. Task 1 → Task 2 (Foundation: Types & Service)
2. Task 5 → Task 6 (Reusable UI Components)
3. Task 4 (Form Component)
4. Task 3 → Task 7 (Main Component & Integration)

### Phase 2: Advanced Features
5. Task 8 (Drag-and-Drop Reordering)
6. Task 9 Part 1 → Part 2 → Part 3 (Offline Support)
7. Integration Testing

---

## Testing Checklist

### Core Features Testing (Completed ✅)
- ✅ Can create new tasks
- ✅ Can edit existing tasks
- ✅ Can delete tasks
- ✅ Loading spinner appears during API calls
- ✅ Error messages display on failures
- ✅ Form validation works correctly
- ✅ Task list updates after CRUD operations
- ✅ No console errors
- ✅ Proper TypeScript typing throughout

### Advanced Features Testing
- ✅ Drag-and-drop reordering works
- ✅ Offline support works
- ✅ Sync status indicator displays
- ✅ All features work offline
- ✅ Smooth offline/online transitions

---

**Note:** Refer to [instructions.md](./instructions.md) for detailed code examples and best practices for each task.


