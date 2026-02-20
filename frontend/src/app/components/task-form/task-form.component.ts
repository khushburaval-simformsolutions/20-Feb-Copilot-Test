import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TaskStatus } from '../../core/enums/task-status.enum';
import { TaskPriority } from '../../core/enums/task-priority.enum';
import { Task, CreateTaskDto } from '../../core/interfaces/task.interface';

// Custom validator for high priority tasks
function highPriorityDueDateValidator(control: AbstractControl): ValidationErrors | null {
  const priority = control.get('priority')?.value;
  const dueDate = control.get('dueDate')?.value;

  if (priority === TaskPriority.HIGH) {
    if (!dueDate) {
      return { highPriorityNoDueDate: true };
    }

    const dueDateObj = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    if (dueDateObj > sevenDaysFromNow) {
      return { highPriorityDueDateTooFar: true };
    }
  }

  return null;
}

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css'],
})
export class TaskFormComponent implements OnInit {
  @Input() task?: Task;
  @Output() submitForm = new EventEmitter<CreateTaskDto>();
  @Output() cancel = new EventEmitter<void>();

  taskForm!: FormGroup;
  taskStatuses = Object.values(TaskStatus);
  taskPriorities = Object.values(TaskPriority);
  isEditMode = false;
  minDate: string;

  constructor(private fb: FormBuilder) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

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
      ],
      priority: [
        this.task?.priority || TaskPriority.MEDIUM,
        [Validators.required]
      ],
      dueDate: [
        this.task?.dueDate ? this.task.dueDate.split('T')[0] : '',
        [Validators.required]
      ]
    }, { validators: highPriorityDueDateValidator });

    // Watch for priority or dueDate changes to re-validate
    this.taskForm.get('priority')?.valueChanges.subscribe(() => {
      this.taskForm.updateValueAndValidity();
    });
    
    this.taskForm.get('dueDate')?.valueChanges.subscribe(() => {
      this.taskForm.updateValueAndValidity();
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
  get priority() { return this.taskForm.get('priority'); }
  get dueDate() { return this.taskForm.get('dueDate'); }
  
  // Getter for form-level errors
  get hasHighPriorityError() {
    return this.taskForm.errors?.['highPriorityNoDueDate'] || 
           this.taskForm.errors?.['highPriorityDueDateTooFar'];
  }
}
