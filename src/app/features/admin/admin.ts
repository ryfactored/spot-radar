import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="page-header">
      <h1>Admin</h1>
    </div>

    <mat-card class="admin-card">
      <mat-card-header>
        <mat-icon mat-card-avatar class="admin-avatar">admin_panel_settings</mat-icon>
        <mat-card-title>Admin Dashboard</mat-card-title>
        <mat-card-subtitle>Manage your application</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <p>This page is only accessible to users with the <strong>admin</strong> role.</p>
        <p>Add your admin functionality here:</p>
        <ul>
          <li>User management</li>
          <li>System settings</li>
          <li>Analytics dashboard</li>
          <li>Content moderation</li>
        </ul>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .admin-card {
      max-width: 800px;
    }

    .admin-avatar {
      background-color: var(--mat-sys-primary);
      color: var(--mat-sys-on-primary);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    ul {
      margin: 16px 0 0;
      padding-left: 20px;
    }

    li {
      margin: 8px 0;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class Admin {}
