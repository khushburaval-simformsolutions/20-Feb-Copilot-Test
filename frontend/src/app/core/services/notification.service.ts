import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { Notification, CreateNotificationDto, NotificationType } from '../interfaces/notification.interface';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  // Loading state (following TaskService pattern)
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();
  
  // Notifications state (following tasks$ pattern from TaskService)
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  // Default auto-close duration in milliseconds
  private readonly DEFAULT_DURATION = 5000;

  constructor() {
    // Initialize with empty notifications array
    this.notificationsSubject.next([]);
  }

  /**
   * Add a notification
   * Similar to createTask pattern in TaskService
   */
  addNotification(notificationDto: CreateNotificationDto): Observable<Notification> {
    this.loadingSubject.next(true);
    
    try {
      const notification: Notification = {
        id: this.generateId(),
        message: notificationDto.message,
        type: notificationDto.type,
        timestamp: new Date(),
        autoClose: notificationDto.autoClose !== undefined ? notificationDto.autoClose : true,
        duration: notificationDto.duration || this.DEFAULT_DURATION
      };

      const currentNotifications = this.notificationsSubject.value;
      this.notificationsSubject.next([...currentNotifications, notification]);

      // Auto-remove notification after duration if autoClose is true
      if (notification.autoClose) {
        timer(notification.duration!).subscribe(() => {
          this.removeNotification(notification.id).subscribe();
        });
      }

      this.loadingSubject.next(false);
      return new BehaviorSubject<Notification>(notification).asObservable();
    } catch (error) {
      this.loadingSubject.next(false);
      return this.handleError(error);
    }
  }

  /**
   * Remove a notification by ID
   * Similar to deleteTask pattern in TaskService
   */
  removeNotification(id: string): Observable<void> {
    this.loadingSubject.next(true);
    
    try {
      const currentNotifications = this.notificationsSubject.value;
      const filteredNotifications = currentNotifications.filter(n => n.id !== id);
      this.notificationsSubject.next(filteredNotifications);
      
      this.loadingSubject.next(false);
      return new BehaviorSubject<void>(void 0).asObservable();
    } catch (error) {
      this.loadingSubject.next(false);
      return this.handleError(error);
    }
  }

  /**
   * Clear all notifications
   */
  clearAllNotifications(): Observable<void> {
    this.loadingSubject.next(true);
    
    try {
      this.notificationsSubject.next([]);
      this.loadingSubject.next(false);
      return new BehaviorSubject<void>(void 0).asObservable();
    } catch (error) {
      this.loadingSubject.next(false);
      return this.handleError(error);
    }
  }

  /**
   * Show success notification for task added
   */
  showTaskAdded(taskTitle: string): Observable<Notification> {
    return this.addNotification({
      message: `Task "${taskTitle}" has been added successfully`,
      type: NotificationType.SUCCESS,
      autoClose: true,
      duration: this.DEFAULT_DURATION
    });
  }

  /**
   * Show success notification for task removed
   */
  showTaskRemoved(taskTitle: string): Observable<Notification> {
    return this.addNotification({
      message: `Task "${taskTitle}" has been removed`,
      type: NotificationType.INFO,
      autoClose: true,
      duration: this.DEFAULT_DURATION
    });
  }

  /**
   * Show error notification
   */
  showError(message: string): Observable<Notification> {
    return this.addNotification({
      message: message,
      type: NotificationType.ERROR,
      autoClose: true,
      duration: 7000 // Errors stay a bit longer
    });
  }

  /**
   * Show info notification
   */
  showInfo(message: string): Observable<Notification> {
    return this.addNotification({
      message: message,
      type: NotificationType.INFO,
      autoClose: true,
      duration: this.DEFAULT_DURATION
    });
  }

  /**
   * Show warning notification
   */
  showWarning(message: string): Observable<Notification> {
    return this.addNotification({
      message: message,
      type: NotificationType.WARNING,
      autoClose: true,
      duration: 6000
    });
  }

  /**
   * Get notification by ID
   * Similar to getTaskById pattern in TaskService
   */
  getNotificationById(id: string): Observable<Notification | undefined> {
    this.loadingSubject.next(true);
    
    try {
      const currentNotifications = this.notificationsSubject.value;
      const notification = currentNotifications.find(n => n.id === id);
      
      this.loadingSubject.next(false);
      return new BehaviorSubject<Notification | undefined>(notification).asObservable();
    } catch (error) {
      this.loadingSubject.next(false);
      return this.handleError(error);
    }
  }

  /**
   * Generate unique ID for notification
   */
  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Centralized error handling
   * Following TaskService pattern
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error instanceof Error) {
      errorMessage = `Error: ${error.message}`;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
