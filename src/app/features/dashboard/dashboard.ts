import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, FeatureFlags } from '@core';
import { ProfileStore } from '@features/profile/profile-store';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatCardModule, MatIconModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <p class="welcome">Welcome back, {{ greeting() }}</p>

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
    :host {
      display: block;
    }
    h1 {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f0edf1;
    }
    .welcome {
      margin-bottom: 32px;
      color: #acaaae;
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
      --mdc-elevated-card-container-color: transparent;
      border: none;
      box-shadow: none;
      transition: background-color 0.2s ease;
    }
    .link-card mat-card:hover {
      --mdc-elevated-card-container-color: #25252a;
    }
    .card-body {
      display: flex;
      align-items: flex-start;
      gap: 16px;
    }
    .card-icon {
      background: linear-gradient(135deg, #ba9eff, #8553f3);
      color: white;
      font-size: 18px;
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .card-body h3 {
      margin: 0 0 4px;
      color: #f0edf1;
    }
    .card-body p {
      margin: 0;
      color: #acaaae;
      font-size: 14px;
    }
  `,
})
export class Dashboard {
  private auth = inject(AuthService);
  private featureFlags = inject(FeatureFlags);
  private profileStore = inject(ProfileStore);

  readonly greeting = computed(
    () => this.profileStore.displayName() || this.auth.currentUser()?.email,
  );

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
