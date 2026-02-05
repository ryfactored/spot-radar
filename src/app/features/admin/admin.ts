import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { UsersService } from './users-service';

@Component({
  selector: 'app-admin',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule],
  template: `
    <div class="page-header">
      <h1>Admin</h1>
    </div>

    <div class="admin-grid">
      <mat-card class="admin-link-card" routerLink="/admin/users">
        <mat-card-header>
          <mat-icon mat-card-avatar class="admin-avatar">group</mat-icon>
          <mat-card-title>Users</mat-card-title>
          <mat-card-subtitle>
            @if (userCount() !== null) {
              {{ userCount() }} registered {{ userCount() === 1 ? 'user' : 'users' }}
            } @else {
              View registered users
            }
          </mat-card-subtitle>
        </mat-card-header>
      </mat-card>
    </div>
  `,
  styles: `
    .admin-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .admin-link-card {
      cursor: pointer;
      transition: transform 0.15s ease;
    }

    .admin-link-card:hover {
      transform: scale(1.02);
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
  `,
})
export class Admin implements OnInit {
  private usersService = inject(UsersService);

  userCount = signal<number | null>(null);

  async ngOnInit() {
    try {
      this.userCount.set(await this.usersService.count());
    } catch {
      // keep default subtitle
    }
  }
}
