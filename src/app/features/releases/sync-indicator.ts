import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
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
        <div class="sync-row">
          <p class="sync-text">
            @if (progress().total === 0) {
              Fetching your artists from Spotify...
            } @else if (progress().checked === 0) {
              Scanning {{ progress().total | number }} artists for new releases...
            } @else {
              Checked {{ progress().checked | number }} of {{ progress().total | number }} artists
              @if (progress().releasesFound > 0) {
                — {{ progress().releasesFound }}
                {{ progress().releasesFound === 1 ? 'release' : 'releases' }} found
              }
            }
          </p>
          @if (progress().total > 0 && progress().checked > 0) {
            <span class="sync-pct">{{ pct() }}%</span>
          }
        </div>
        @if (progress().total > 0 && progress().checked > 0) {
          <mat-progress-bar mode="determinate" [value]="pct()" />
        } @else {
          <mat-progress-bar mode="indeterminate" />
        }
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
      background: rgba(25, 25, 29, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      box-shadow: 0 0 24px rgba(164, 201, 255, 0.08);

      --mdc-linear-progress-active-indicator-color: #a4c9ff;
      --mdc-linear-progress-track-color: rgba(164, 201, 255, 0.1);
    }

    .sync-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }

    .sync-text {
      margin: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      color: #acaaae;
    }

    .sync-pct {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      color: #a4c9ff;
      flex-shrink: 0;
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();

  protected pct = computed(() => {
    const p = this.progress();
    if (p.total === 0) return 0;
    return Math.round((p.checked / p.total) * 100);
  });
}
