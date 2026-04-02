import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Skeleton } from 'src/app/shared/skeleton/skeleton';

@Component({
  selector: 'app-release-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Skeleton],
  template: `
    <div class="skeleton-card">
      <div class="art-placeholder"></div>
      <div class="content">
        <app-skeleton width="70%" height="1rem" />
        <app-skeleton width="50%" height="0.875rem" />
        <app-skeleton width="35%" height="0.65rem" />
      </div>
    </div>
  `,
  styles: `
    .skeleton-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .art-placeholder {
      width: 100%;
      aspect-ratio: 1;
      border-radius: 0.5rem;
      background: #1f1f23;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 0 4px;
    }
  `,
})
export class ReleaseCardSkeleton {}
