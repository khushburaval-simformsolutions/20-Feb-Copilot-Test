export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  timestamp: Date;
  autoClose?: boolean;
  duration?: number; // in milliseconds
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
  WARNING = 'warning'
}

export interface CreateNotificationDto {
  message: string;
  type: NotificationType;
  autoClose?: boolean;
  duration?: number;
}
