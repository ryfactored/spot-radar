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
      gap: 10px;
      padding: 16px 20px;
      border-radius: 16px;
      background: rgba(38, 38, 38, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      box-shadow: 0 0 24px rgba(109, 245, 225, 0.1);

      --mdc-linear-progress-active-indicator-color: #6df5e1;
      --mdc-linear-progress-track-color: rgba(109, 245, 225, 0.1);
    }

    .sync-text {
      margin: 0;
      font-family: 'Manrope', sans-serif;
      font-size: 0.875rem;
      color: #adaaaa;
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();
}
