import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { ConfirmDialogService, ToastService, LoadingSpinner, EmptyState } from '../../shared';

@Component({
  selector: 'app-component-test',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    LoadingSpinner,
    EmptyState,
  ],
  template: `
    <h1>Shared Components</h1>
    <p class="subtitle">Test page for shared UI components</p>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Toast Notifications</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Display temporary notifications for user feedback.</p>
        <div class="button-row">
          <button mat-raised-button color="primary" (click)="showSuccess()">Success</button>
          <button mat-raised-button color="warn" (click)="showError()">Error</button>
          <button mat-raised-button (click)="showInfo()">Info</button>
          <button mat-raised-button color="accent" (click)="testError()">Throw Error</button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Confirm Dialog</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Modal dialog for confirming destructive actions.</p>
        <div class="button-row">
          <button mat-raised-button color="warn" (click)="showConfirm()">Delete Something</button>
        </div>
      </mat-card-content>
    </mat-card>

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
            message="Create your first project to get started">
          </app-empty-state>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .subtitle {
      color: #666;
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 24px;
      max-width: 600px;
    }
    .button-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .demo-box {
      background: #f5f5f5;
      border-radius: 8px;
      margin-top: 16px;
    }
  `
})
export class ComponentTest {
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);

  showSuccess() {
    this.toast.success('Operation completed successfully!');
  }

  showError() {
    this.toast.error('Something went wrong. Please try again.');
  }

  showInfo() {
    this.toast.info('This is an informational message.');
  }

  async showConfirm() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      this.toast.success('Item deleted!');
    } else {
      this.toast.info('Cancelled');
    }
  }

  testError() {
    throw new Error('Test error!');
  }
}
