import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { ConfirmDialogService, ToastService } from '@shared';

@Component({
  selector: 'app-feedback',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatCardModule],
  template: `
    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Toast Notifications</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Display temporary notifications for user feedback.</p>
        <div class="button-row">
          <button mat-raised-button color="primary" (click)="showSuccess()">Success</button>
          <button mat-raised-button color="warn" (click)="showError()">Error</button>
          <button mat-raised-button color="accent" (click)="showInfo()">Info</button>
          <button mat-raised-button color="warn" (click)="testError()">Throw Error</button>
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
  `,
  styles: `
    .section {
      margin-bottom: 24px;
      max-width: 600px;
    }
    .button-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
  `,
})
export class Feedback {
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
      cancelText: 'Cancel',
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
