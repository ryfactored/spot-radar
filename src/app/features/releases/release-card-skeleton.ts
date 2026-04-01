import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from 'src/app/shared/skeleton/skeleton';

@Component({
  selector: 'app-release-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <app-skeleton class="art" width="88px" height="88px" radius="8px" />
      <div class="content">
        <app-skeleton width="55%" height="1rem" />
        <app-skeleton width="40%" height="0.875rem" />
        <app-skeleton width="30%" height="0.75rem" />
        <div class="actions">
          <app-skeleton width="120px" height="32px" radius="16px" />
          <app-skeleton width="80px" height="32px" radius="16px" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .skeleton-card {
      display: flex;
      flex-direction: row;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
    }

    .art {
      flex-shrink: 0;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
  `,
})
export class ReleaseCardSkeleton {}
