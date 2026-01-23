import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Skeleton } from '@shared';

@Component({
  selector: 'app-note-card-skeleton',
  standalone: true,
  imports: [MatCardModule, Skeleton],
  template: `
    <mat-card class="skeleton-card">
      <mat-card-header>
        <app-skeleton width="60%" height="1.25rem" />
        <app-skeleton width="40%" height="0.875rem" />
      </mat-card-header>
      <mat-card-content>
        <app-skeleton width="100%" height="0.875rem" />
        <app-skeleton width="90%" height="0.875rem" />
        <app-skeleton width="70%" height="0.875rem" />
      </mat-card-content>
      <mat-card-actions>
        <app-skeleton width="60px" height="36px" radius="4px" />
        <app-skeleton width="70px" height="36px" radius="4px" />
      </mat-card-actions>
    </mat-card>
  `,
  styles: `
    .skeleton-card {
      mat-card-header { margin-bottom: 16px; }
      mat-card-content app-skeleton { margin-bottom: 8px; }
      mat-card-actions { display: flex; gap: 8px; justify-content: flex-end; }
    }
  `
})
export class NoteCardSkeleton {}
