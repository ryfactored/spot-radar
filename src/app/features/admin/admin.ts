import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  template: `
    <div class="admin-container">
      <mat-card>
        <mat-card-header>
          <mat-icon mat-card-avatar>admin_panel_settings</mat-icon>
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
    </div>
  `,
  styles: `
    .admin-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    mat-icon[mat-card-avatar] {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
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
