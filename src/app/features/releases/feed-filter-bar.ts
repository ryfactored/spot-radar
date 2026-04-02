import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';
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
    TitleCasePipe,
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
    <div class="header-bar">
      <div class="header-left">
        <span class="curated-label">Curated Discovery</span>
        <h2 class="feed-title">New Releases</h2>
        <p class="feed-subtitle">Fresh releases from artists you follow and save</p>
      </div>
      <div class="pills-area">
        @if (releaseTypeFilter() !== 'everything') {
          <span class="filter-pill">{{ releaseTypeFilter() | titlecase }}</span>
        }
        @if (sourceFilter() !== 'all') {
          <span class="filter-pill">{{ sourceFilter() | titlecase }}</span>
        }
        @if (recencyDays() !== 90) {
          <span class="filter-pill">{{ recencyDays() }}d</span>
        }
        @if (minTrackCount() > 0) {
          <span class="filter-pill">{{ minTrackCount() }}+ tracks</span>
        }
        @if (hideLive()) {
          <span class="filter-pill">No live</span>
        }
        <button
          class="tune-btn"
          #tuneBtnRef
          (click)="toggleFilterPanel()"
          aria-label="Open filters"
        >
          <mat-icon>tune</mat-icon>
        </button>
      </div>
    </div>

    <div
      class="panel-backdrop"
      [class.visible]="panelOpen()"
      role="button"
      tabindex="-1"
      (click)="panelOpen.set(false)"
      (keydown.escape)="panelOpen.set(false)"
    ></div>
    <div class="filter-panel" [class.open]="panelOpen()">
      <div class="panel-section">
        <span class="panel-label">Release Type</span>
        <mat-button-toggle-group
          [value]="releaseTypeFilter()"
          (change)="releaseTypeChange.emit($event.value)"
          aria-label="Release type"
        >
          <mat-button-toggle value="everything">Everything</mat-button-toggle>
          <mat-button-toggle value="album">Albums</mat-button-toggle>
          <mat-button-toggle value="single">Singles</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="panel-section">
        <span class="panel-label">Source</span>
        <mat-button-toggle-group
          [value]="sourceFilter()"
          (change)="sourceFilterChange.emit($event.value)"
          aria-label="Artist source"
        >
          <mat-button-toggle value="all">All</mat-button-toggle>
          <mat-button-toggle value="followed">Following</mat-button-toggle>
          <mat-button-toggle value="saved">In Library</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div class="panel-section">
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
      </div>

      <div class="panel-section">
        <mat-slide-toggle [checked]="hideLive()" (change)="hideLiveChange.emit($event.checked)">
          Hide live albums
        </mat-slide-toggle>
      </div>

      <div class="panel-section panel-actions">
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
    :host {
      position: relative;
    }

    .header-bar {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      padding: 0 0 8px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .curated-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.3em;
      text-transform: uppercase;
      color: #ba9eff;
    }

    .feed-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 3.5rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f0edf1;
      margin: 0;
      line-height: 1.1;
    }

    .feed-subtitle {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9375rem;
      color: #acaaae;
      margin: 4px 0 0;
    }

    .pills-area {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      justify-content: flex-end;
      padding-top: 8px;
    }

    .filter-pill {
      background: rgba(186, 158, 255, 0.12);
      color: #ba9eff;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 5px 12px;
      border-radius: 1rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
    }

    .tune-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 1px solid rgba(72, 72, 71, 0.2);
      background: rgba(25, 25, 29, 0.6);
      color: #acaaae;
      cursor: pointer;
      transition:
        background 0.2s,
        color 0.2s;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }

      &:hover {
        background: rgba(186, 158, 255, 0.12);
        color: #ba9eff;
      }
    }

    .panel-backdrop {
      position: fixed;
      inset: 0;
      z-index: 999;
      display: none;

      &.visible {
        display: block;
      }
    }

    .filter-panel {
      position: absolute;
      top: 100%;
      right: 0;
      z-index: 1000;
      margin-top: 8px;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-8px);
      transition:
        opacity 0.2s ease,
        transform 0.2s ease;

      &.open {
        opacity: 1;
        pointer-events: auto;
        transform: translateY(0);
      }
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 20px;
      background: rgba(25, 25, 29, 0.85);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(72, 72, 71, 0.15);
      border-radius: 1rem;
      box-shadow: 0 40px 40px rgba(186, 158, 255, 0.06);
      min-width: 340px;

      --mat-standard-button-toggle-selected-state-background-color: rgba(186, 158, 255, 0.15);
      --mat-standard-button-toggle-selected-state-text-color: #ba9eff;
      --mat-standard-button-toggle-text-color: #acaaae;
      --mat-standard-button-toggle-background-color: transparent;
      --mat-standard-button-toggle-shape: 12px;
      --mat-standard-button-toggle-divider-color: rgba(72, 72, 71, 0.15);
    }

    .panel-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    .panel-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #767579;
      width: 100%;
    }

    .panel-actions {
      margin-top: 4px;
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
      color: #767579;
      margin-top: 1px;
    }

    @media (max-width: 600px) {
      .header-bar {
        flex-direction: column;
        gap: 16px;
      }

      .feed-title {
        font-size: 2.25rem;
      }

      .pills-area {
        justify-content: flex-start;
      }
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

  protected panelOpen = signal(false);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.panelOpen.set(false);
  }

  toggleFilterPanel(): void {
    this.panelOpen.update((v) => !v);
  }
}
