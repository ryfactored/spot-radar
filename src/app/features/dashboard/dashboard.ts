import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, FeatureFlags } from '@core';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <p class="welcome">Welcome back, {{ currentUser()?.email }}</p>

    <div class="quick-links">
      @for (link of links(); track link.route) {
        <a [routerLink]="link.route" class="link-card">
          <mat-card>
            <mat-card-content class="card-body">
              <mat-icon class="card-icon">{{ link.icon }}</mat-icon>
              <div>
                <h3>{{ link.title }}</h3>
                <p>{{ link.description }}</p>
              </div>
            </mat-card-content>
          </mat-card>
        </a>
      }
    </div>
  `,
  styles: `
    .welcome {
      margin-bottom: 32px;
      color: var(--mat-card-subtitle-text-color, #666);
    }
    .quick-links {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
      gap: 16px;
    }
    .link-card {
      text-decoration: none;
      color: inherit;
    }
    .link-card mat-card {
      height: 100%;
    }
    .card-body {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .card-icon {
      color: var(--mat-sys-primary, #3b82f6);
      font-size: 32px;
      width: 32px;
      height: 32px;
      flex-shrink: 0;
    }
    .card-body h3 {
      margin: 0 0 4px;
    }
    .card-body p {
      margin: 0;
      color: var(--mat-card-subtitle-text-color, #666);
      font-size: 14px;
    }
  `,
})
export class Dashboard {
  private auth = inject(AuthService);
  private featureFlags = inject(FeatureFlags);

  readonly currentUser = this.auth.currentUser;

  private allLinks = [
    {
      route: '/notes',
      icon: 'note',
      title: 'Notes',
      description: 'Create and manage your notes',
      feature: 'notes',
    },
    {
      route: '/chat',
      icon: 'chat',
      title: 'Chat',
      description: 'Real-time messaging with others',
      feature: 'chat',
    },
    {
      route: '/files',
      icon: 'folder',
      title: 'Files',
      description: 'Upload and manage your files',
      feature: 'files',
    },
    {
      route: '/profile',
      icon: 'person',
      title: 'Profile',
      description: 'Update your account settings',
      feature: null as string | null,
    },
  ];

  readonly links = computed(() =>
    this.allLinks.filter(
      (link) => link.feature === null || this.featureFlags.isEnabled(link.feature),
    ),
  );
}
