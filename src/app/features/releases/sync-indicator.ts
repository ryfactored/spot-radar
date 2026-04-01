import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { SyncProgress } from './releases-store';

@Component({
  selector: 'app-sync-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, MatProgressBarModule],
  template: `
    @if (progress().syncing) {
      <div class="sync-indicator">
        <p class="sync-text">
          @if (progress().total === 0) {
            Fetching your artists from Spotify...
          } @else if (progress().releasesFound === 0) {
            Scanning {{ progress().total | number }} artists for new releases...
          } @else {
            Found {{ progress().releasesFound | number }}
            {{ progress().releasesFound === 1 ? 'release' : 'releases' }} so far across
            {{ progress().total | number }} artists...
          }
        </p>
        <mat-progress-bar mode="indeterminate" />
      </div>
    }
  `,
  styles: `
    .sync-indicator {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      background: var(--mat-sys-surface-container);
    }

    .sync-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();
}
