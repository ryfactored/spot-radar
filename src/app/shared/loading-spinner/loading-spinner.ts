import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-container" role="status" aria-live="polite">
      <mat-spinner [diameter]="diameter()" aria-hidden="true"></mat-spinner>
      <span class="visually-hidden">Loading{{ message() ? ': ' + message() : '' }}</span>
      @if (message()) {
        <p aria-hidden="true">{{ message() }}</p>
      }
    </div>
  `,
  styles: `
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      padding: 24px;
    }
    .visually-hidden {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class LoadingSpinner {
  diameter = input(40);
  message = input<string>('');
}
