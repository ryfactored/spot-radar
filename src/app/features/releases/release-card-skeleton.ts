import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from 'src/app/shared/skeleton/skeleton';

@Component({
  selector: 'app-release-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <app-skeleton class="art" width="100%" height="0" radius="1rem" />
      <div class="content">
        <app-skeleton width="70%" height="1rem" />
        <app-skeleton width="50%" height="0.875rem" />
        <app-skeleton width="35%" height="0.65rem" />
        <div class="actions">
          <app-skeleton width="120px" height="36px" radius="12px" />
          <app-skeleton width="80px" height="36px" radius="12px" />
        </div>
      </div>
    </div>
  `,
  styles: `
    .skeleton-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: rgba(26, 26, 26, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
    }

    .art {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 1rem;
      overflow: hidden;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex: 1;
      padding: 0 4px 4px;
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }
  `,
})
export class ReleaseCardSkeleton {}
