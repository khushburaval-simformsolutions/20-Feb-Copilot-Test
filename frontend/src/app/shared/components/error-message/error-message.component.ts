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
