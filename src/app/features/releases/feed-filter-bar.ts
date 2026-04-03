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
        <button class="tune-btn" (click)="openFilterPanel()" aria-label="Open filters">
          <mat-icon>tune</mat-icon>
        </button>
      </div>
    </div>

    @if (panelOpen()) {
      <div
        class="panel-backdrop"
        role="button"
        tabindex="-1"
        (click)="closeFilterPanel()"
        (keydown.escape)="closeFilterPanel()"
      ></div>
    }
    <div class="filter-side-panel" [class.open]="panelOpen()">
      <div class="panel-inner">
        <div class="panel-header">
          <h4 class="panel-title">Filters</h4>
          <button class="panel-close" (click)="closeFilterPanel()">
            <mat-icon>close</mat-icon>
          </button>
        </div>

        <div class="panel-body">
          <div class="panel-section">
            <span class="panel-label">Display Collection</span>
            <div class="segmented-control">
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
          </div>

          <div class="panel-section">
            <span class="panel-label">Release Type</span>
            <div class="segmented-control">
              <mat-button-toggle-group
                [value]="releaseTypeFilter()"
                (change)="releaseTypeChange.emit($event.value)"
                aria-label="Release type"
              >
                <mat-button-toggle value="everything">All</mat-button-toggle>
                <mat-button-toggle value="album">Albums</mat-button-toggle>
                <mat-button-toggle value="single">Singles</mat-button-toggle>
              </mat-button-toggle-group>
            </div>
          </div>

          <div class="panel-section">
            <span class="panel-label">Minimum Tracks</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select
                [value]="minTrackCount()"
                (selectionChange)="minTrackChange.emit($event.value)"
              >
                <mat-option [value]="0">Any Number</mat-option>
                <mat-option [value]="3">3+ Tracks</mat-option>
                <mat-option [value]="5">5+ Tracks</mat-option>
                <mat-option [value]="8">8+ Tracks</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="panel-section">
            <span class="panel-label">Recency</span>
            <mat-form-field appearance="outline" subscriptSizing="dynamic">
              <mat-select
                [value]="recencyDays()"
                (selectionChange)="recencyChange.emit($event.value)"
              >
                <mat-option [value]="30">Last 30 days</mat-option>
                <mat-option [value]="90">Last 90 days</mat-option>
                <mat-option [value]="180">Last 6 months</mat-option>
                <mat-option [value]="365">Last year</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="panel-section toggle-section">
            <div class="toggle-info">
              <span class="toggle-title">Hide Live Albums</span>
              <span class="toggle-subtitle">Show only studio recordings</span>
            </div>
            <mat-slide-toggle
              [checked]="hideLive()"
              (change)="hideLiveChange.emit($event.checked)"
            />
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-apply" (click)="closeFilterPanel()">
            <mat-icon>check</mat-icon>
            Apply Filters
          </button>
          <button class="btn-actions" (click)="markAllSeen.emit(); closeFilterPanel()">
            Mark all seen
          </button>
          <div class="sync-row">
            <button
              class="btn-sync"
              [disabled]="syncing()"
              (click)="syncNow.emit('quick'); closeFilterPanel()"
            >
              <mat-icon>sync</mat-icon>
              {{ syncing() ? 'Syncing…' : 'Quick Sync' }}
            </button>
            <button
              class="btn-sync-full"
              [disabled]="syncing()"
              (click)="syncNow.emit('full'); closeFilterPanel()"
            >
              Full Sync
            </button>
          </div>
        </div>
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

    /* Side panel */
    .filter-side-panel {
      position: fixed;
      top: 0;
      right: 0;
      height: 100%;
      width: 320px;
      background: #1f1f23;
      z-index: 60;
      transform: translateX(100%);
      transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      box-shadow: -20px 0 60px rgba(0, 0, 0, 0.5);
      border-left: 1px solid rgba(72, 72, 71, 0.2);
    }

    .filter-side-panel.open {
      transform: translateX(0);
    }

    .panel-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.3);
      z-index: 59;
    }

    .panel-inner {
      height: 100%;
      display: flex;
      flex-direction: column;
      padding: 32px;
    }

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 40px;
    }

    .panel-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #f0edf1;
      margin: 0;
    }

    .panel-close {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: none;
      background: transparent;
      color: #acaaae;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .panel-close:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .panel-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 32px;
      overflow-y: auto;
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .panel-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #acaaae;
    }

    /* Segmented control — override mat-button-toggle-group */
    .segmented-control {
      mat-button-toggle-group {
        width: 100%;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 0.75rem;
        padding: 4px;
        border: none !important;
        gap: 4px;

        --mat-standard-button-toggle-selected-state-background-color: #ba9eff;
        --mat-standard-button-toggle-selected-state-text-color: #000;
        --mat-standard-button-toggle-text-color: #acaaae;
        --mat-standard-button-toggle-background-color: transparent;
        --mat-standard-button-toggle-shape: 0.5rem;
        --mat-standard-button-toggle-divider-color: transparent;
        --mat-standard-button-toggle-height: 36px;
      }

      mat-button-toggle {
        flex: 1;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 12px;
        font-weight: 500;

        &.mat-button-toggle-checked {
          font-weight: 700;
        }
      }
    }

    /* Form field overrides */
    .panel-section mat-form-field {
      width: 100%;
      --mdc-outlined-text-field-container-shape: 0.75rem;
      --mdc-outlined-text-field-outline-color: rgba(72, 72, 71, 0.3);
      --mdc-outlined-text-field-hover-outline-color: rgba(186, 158, 255, 0.3);
      --mdc-outlined-text-field-focus-outline-color: #ba9eff;
      --mdc-outlined-text-field-label-text-color: #767579;
      --mdc-outlined-text-field-input-text-color: #f0edf1;
      --mat-select-trigger-text-color: #f0edf1;
      --mat-select-panel-background-color: #19191d;
      --mat-option-label-text-color: #f0edf1;
      --mat-option-selected-state-label-text-color: #ba9eff;
    }

    /* Toggle section */
    .toggle-section {
      flex-direction: row !important;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
    }

    .toggle-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .toggle-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      color: #f0edf1;
    }

    .toggle-subtitle {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      color: #acaaae;
    }

    /* Slide toggle overrides */
    .toggle-section {
      --mdc-switch-selected-track-color: #ba9eff;
      --mdc-switch-selected-handle-color: #f0edf1;
      --mdc-switch-unselected-track-color: #25252a;
      --mdc-switch-unselected-handle-color: #f0edf1;
    }

    /* Panel footer */
    .panel-footer {
      padding-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .btn-apply {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #ba9eff, #8553f3);
      color: #000;
      border: none;
      border-radius: 0.75rem;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 10px 20px rgba(186, 158, 255, 0.2);
      transition: transform 0.15s;
    }

    .btn-apply:hover {
      transform: scale(1.02);
    }

    .btn-apply:active {
      transform: scale(0.98);
    }

    .btn-actions {
      width: 100%;
      padding: 12px;
      background: transparent;
      border: none;
      color: #acaaae;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: color 0.2s;
    }

    .btn-actions:hover {
      color: #f0edf1;
    }

    .sync-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .btn-sync,
    .btn-sync-full {
      flex: 1;
      padding: 10px;
      border-radius: 0.5rem;
      border: 1px solid rgba(72, 72, 71, 0.3);
      background: transparent;
      color: #acaaae;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      transition: all 0.2s;
    }

    .btn-sync:hover,
    .btn-sync-full:hover {
      border-color: rgba(186, 158, 255, 0.3);
      color: #f0edf1;
    }

    .btn-sync:disabled,
    .btn-sync-full:disabled {
      opacity: 0.4;
      cursor: not-allowed;
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

  openFilterPanel(): void {
    this.panelOpen.set(true);
  }

  closeFilterPanel(): void {
    this.panelOpen.set(false);
  }
}
