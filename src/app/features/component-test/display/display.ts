import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { LoadingSpinner, EmptyState } from '@shared';

@Component({
  selector: 'app-display',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, LoadingSpinner, EmptyState],
  template: `
    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Loading Spinner</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Displays a loading indicator with optional message.</p>
        <div class="demo-box">
          <app-loading-spinner message="Loading data..." />
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Empty State</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Displays a friendly message when lists are empty.</p>
        <div class="demo-box">
          <app-empty-state
            icon="folder_open"
            title="No projects yet"
            message="Create your first project to get started"
          >
          </app-empty-state>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .section {
      margin-bottom: 24px;
      max-width: 600px;
    }
    .demo-box {
      background: var(--app-inset-bg, #f5f5f5);
      border-radius: 8px;
      margin-top: 16px;
    }
  `,
})
export class Display {}
