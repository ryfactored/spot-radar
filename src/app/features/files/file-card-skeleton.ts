import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Skeleton } from '@shared';

@Component({
  selector: 'app-file-card-skeleton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, Skeleton],
  template: `
    <mat-card class="skeleton-card">
      <mat-card-header>
        <app-skeleton mat-card-avatar width="40px" height="40px" radius="50%" />
        <app-skeleton width="60%" height="1.25rem" />
        <app-skeleton width="80%" height="0.875rem" />
      </mat-card-header>
      <mat-card-actions align="end">
        <app-skeleton width="100px" height="36px" radius="4px" />
        <app-skeleton width="80px" height="36px" radius="4px" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .skeleton-card {
      mat-card-header {
        margin-bottom: 16px;
      }
      mat-card-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
      }
    }
  `,
})
export class FileCardSkeleton {}
