import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { TaskService } from '../../../core/services/task.service';

@Component({
  selector: 'app-sync-status',
  template: `
    <div class="sync-status">
      <div class="status-indicator">
        <!-- Status Dot -->
        <span 
          class="status-dot" 
          [ngClass]="{
            'online': (isOnline$ | async) && (pendingCount$ | async) === 0,
            'syncing': (isOnline$ | async) && (pendingCount$ | async)! > 0,
            'offline': !(isOnline$ | async)
          }">
        </span>

        <!-- Status Text -->
        <span class="status-text">
          <ng-container *ngIf="(isOnline$ | async); else offlineText">
            <ng-container *ngIf="(pendingCount$ | async) === 0; else syncingText">
              Online ✓
            </ng-container>
            <ng-template #syncingText>
              Syncing...
            </ng-template>
          </ng-container>
          <ng-template #offlineText>
            Offline
          </ng-template>
        </span>

        <!-- Pending Count Badge -->
        <span 
          class="pending-badge" 
          *ngIf="(pendingCount$ | async)! > 0">
          {{ pendingCount$ | async }}
        </span>
      </div>

      <!-- Sync Now Button -->
      <button 
        class="sync-button"
        *ngIf="(pendingCount$ | async)! > 0 && (isOnline$ | async)"
        (click)="syncNow()"
        [disabled]="isSyncing">
        <span *ngIf="!isSyncing">Sync Now</span>
        <span *ngIf="isSyncing" class="spinner-small"></span>
      </button>
    </div>
  `,
  styles: [`
    .sync-status {
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      border-radius: 8px;
      padding: 10px 15px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 1000;
      font-size: 14px;
    }

    .status-indicator {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .status-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      transition: background-color 0.3s ease;
    }

    .status-dot.online {
      background-color: #28a745;
    }

    .status-dot.syncing {
      background-color: #ffc107;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .status-dot.offline {
      background-color: #dc3545;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.6;
        transform: scale(1.2);
      }
    }

    .status-text {
      font-weight: 500;
      color: #333;
    }

    .pending-badge {
      background-color: #007bff;
      color: white;
      border-radius: 12px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: bold;
      min-width: 20px;
      text-align: center;
    }

    .sync-button {
      background-color: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 5px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .sync-button:hover:not(:disabled) {
      background-color: #0056b3;
    }

    .sync-button:disabled {
      background-color: #6c757d;
      cursor: not-allowed;
    }

    .spinner-small {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .sync-status {
        top: 10px;
        right: 10px;
        padding: 8px 12px;
        font-size: 12px;
      }

      .status-text {
        display: none;
      }

      .sync-button {
        padding: 4px 8px;
        font-size: 11px;
      }
    }
  `]
})
export class SyncStatusComponent implements OnInit, OnDestroy {
  isOnline$: Observable<boolean>;
  pendingCount$: Observable<number>;
  isSyncing = false;

  private destroy$ = new Subject<void>();

  constructor(private taskService: TaskService) {
    this.isOnline$ = this.taskService.isOnline$;
    this.pendingCount$ = this.taskService.pendingChanges$;
  }

  ngOnInit(): void {
    // Subscribe to online status changes for logging
    this.isOnline$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isOnline => {
        console.log('Network status:', isOnline ? 'Online' : 'Offline');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  syncNow(): void {
    if (this.isSyncing) {
      return;
    }

    this.isSyncing = true;
    this.taskService.syncPendingOperations()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.isSyncing = false;
          console.log('Manual sync completed successfully');
        },
        error: (err) => {
          this.isSyncing = false;
          console.error('Manual sync failed:', err);
          alert('Sync failed. Please try again.');
        }
      });
  }
}
