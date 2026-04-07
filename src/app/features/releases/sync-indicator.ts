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
        <p class="sync-text">
          @if (progress().total === 0) {
            Fetching your artists from Spotify...
          } @else if (progress().currentArtist) {
            Checking {{ progress().currentArtist }}...
            <span class="sync-count">{{ progress().checked }}/{{ progress().total | number }}</span>
          } @else {
            Scanning {{ progress().total | number }} artists for new releases...
          }
        </p>
        <mat-progress-bar [mode]="progressMode()" [value]="progressPercent()" />
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
      box-shadow: 0 0 24px rgba(186, 158, 255, 0.08);

      --mdc-linear-progress-active-indicator-color: #ba9eff;
      --mdc-linear-progress-track-color: rgba(186, 158, 255, 0.1);
    }

    .sync-text {
      margin: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      color: #acaaae;
    }

    .sync-count {
      color: #ba9eff;
      font-weight: 600;
    }
  `,
})
export class SyncIndicator {
  progress = input.required<SyncProgress>();

  protected progressPercent = computed(() => {
    const p = this.progress();
    if (p.total === 0) return 0;
    return (p.checked / p.total) * 100;
  });

  protected progressMode = computed(() => {
    const p = this.progress();
    return p.total > 0 ? 'determinate' : 'indeterminate';
  });
}
