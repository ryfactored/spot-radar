import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-feed-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
  ],
  template: `
    <div class="filter-bar">
      <div class="header-block">
        <span class="subtitle-label"><span class="teal-dot"></span>Latest Arrivals</span>
        <h2 class="feed-title">New Releases</h2>
      </div>
      <div class="filters">
        <mat-button-toggle-group
          [value]="releaseTypeFilter()"
          (change)="releaseTypeChange.emit($event.value)"
          aria-label="Release type"
        >
          <mat-button-toggle value="everything">Everything</mat-button-toggle>
          <mat-button-toggle value="album">Albums</mat-button-toggle>
          <mat-button-toggle value="single">Singles</mat-button-toggle>
        </mat-button-toggle-group>

        <mat-button-toggle-group
          [value]="sourceFilter()"
          (change)="sourceFilterChange.emit($event.value)"
          aria-label="Artist source"
        >
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="followed">Following</mat-button-toggle>
          <mat-button-toggle value="saved">In Library</mat-button-toggle>
        </mat-button-toggle-group>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Min tracks</mat-label>
          <mat-select
            [value]="minTrackCount()"
            (selectionChange)="minTrackChange.emit($event.value)"
          >
            <mat-option [value]="0">No minimum</mat-option>
            <mat-option [value]="3">3+</mat-option>
            <mat-option [value]="5">5+</mat-option>
            <mat-option [value]="8">8+</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" subscriptSizing="dynamic">
          <mat-label>Recency</mat-label>
          <mat-select [value]="recencyDays()" (selectionChange)="recencyChange.emit($event.value)">
            <mat-option [value]="30">Last 30 days</mat-option>
            <mat-option [value]="90">Last 90 days</mat-option>
            <mat-option [value]="180">Last 6 months</mat-option>
            <mat-option [value]="365">Last year</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-slide-toggle [checked]="hideLive()" (change)="hideLiveChange.emit($event.checked)">
          Hide live albums
        </mat-slide-toggle>

        <button mat-stroked-button (click)="markAllSeen.emit()">
          <mat-icon>check</mat-icon>
          Mark all seen
        </button>

        <div class="split-btn" [class.disabled]="syncing()">
          <button
            mat-flat-button
            class="split-main gradient-btn"
            [disabled]="syncing()"
            matTooltip="Check for new releases from your current artists"
            (click)="syncNow.emit('quick')"
          >
            <mat-icon>sync</mat-icon>
            {{ syncing() ? 'Syncing…' : 'Sync' }}
          </button>
          <button
            mat-flat-button
            class="split-arrow gradient-btn"
            [disabled]="syncing()"
            [matMenuTriggerFor]="syncMenu"
            aria-label="More sync options"
          >
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
        </div>

        <mat-menu #syncMenu="matMenu">
          <button mat-menu-item (click)="syncNow.emit('full')">
            <mat-icon>manage_search</mat-icon>
            <span>Full sync</span>
            <span class="menu-hint">Re-fetch your Spotify library</span>
          </button>
        </mat-menu>
      </div>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 24px;
      border-radius: 16px;
      background: rgba(38, 38, 38, 0.4);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);

      --mat-standard-button-toggle-selected-state-background-color: rgba(186, 158, 255, 0.15);
      --mat-standard-button-toggle-selected-state-text-color: #ba9eff;
      --mat-standard-button-toggle-text-color: #adaaaa;
      --mat-standard-button-toggle-background-color: transparent;
      --mat-standard-button-toggle-shape: 12px;
      --mat-standard-button-toggle-divider-color: rgba(72, 72, 71, 0.15);
    }

    .header-block {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .subtitle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #ba9eff;
    }

    .teal-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #6df5e1;
    }

    .feed-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.75rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #ffffff;
      margin: 0;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
    }

    mat-form-field {
      min-width: 140px;
    }

    .split-btn {
      display: flex;
      align-items: stretch;

      .split-main {
        border-radius: 12px 0 0 12px;
        border-right: none;
      }

      .split-arrow {
        border-radius: 0 12px 12px 0;
        padding: 0 4px;
        min-width: unset;
      }
    }

    .gradient-btn {
      background: linear-gradient(135deg, #8455ef, #ba9eff) !important;
      color: #000000 !important;
      font-weight: 700;
    }

    .menu-hint {
      display: block;
      font-size: 0.7rem;
      color: #767575;
      margin-top: 1px;
    }
  `,
})
export class FeedFilterBar {
  releaseTypeFilter = input.required<string>();
  minTrackCount = input.required<number>();
  recencyDays = input.required<number>();
  hideLive = input.required<boolean>();
  sourceFilter = input.required<string>();
  syncing = input<boolean>(false);

  releaseTypeChange = output<string>();
  minTrackChange = output<number>();
  recencyChange = output<number>();
  hideLiveChange = output<boolean>();
  sourceFilterChange = output<string>();
  markAllSeen = output<void>();
  syncNow = output<'quick' | 'full'>();
}
