import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  output,
  signal,
} from '@angular/core';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-feed-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TitleCasePipe],
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
          <span class="filter-pill">{{
            sourceFilter() === 'followed' ? 'Following' : 'In Library'
          }}</span>
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
          <span class="material-icons">tune</span>
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
            <span class="material-icons">close</span>
          </button>
        </div>

        <div class="panel-body">
          <!-- Display Collection — custom segmented control -->
          <div class="panel-section">
            <span class="panel-label">Display Collection</span>
            <div class="seg-control" role="radiogroup" aria-label="Artist source">
              <button
                class="seg-btn"
                [class.active]="sourceFilter() === 'all'"
                (click)="sourceFilterChange.emit('all')"
              >
                All
              </button>
              <button
                class="seg-btn"
                [class.active]="sourceFilter() === 'followed'"
                (click)="sourceFilterChange.emit('followed')"
              >
                Following
              </button>
              <button
                class="seg-btn"
                [class.active]="sourceFilter() === 'saved'"
                (click)="sourceFilterChange.emit('saved')"
              >
                In Library
              </button>
            </div>
          </div>

          <!-- Release Type — custom segmented control -->
          <div class="panel-section">
            <span class="panel-label">Release Type</span>
            <div class="seg-control" role="radiogroup" aria-label="Release type">
              <button
                class="seg-btn"
                [class.active]="releaseTypeFilter() === 'everything'"
                (click)="releaseTypeChange.emit('everything')"
              >
                All
              </button>
              <button
                class="seg-btn"
                [class.active]="releaseTypeFilter() === 'album'"
                (click)="releaseTypeChange.emit('album')"
              >
                Albums
              </button>
              <button
                class="seg-btn"
                [class.active]="releaseTypeFilter() === 'single'"
                (click)="releaseTypeChange.emit('single')"
              >
                Singles
              </button>
            </div>
          </div>

          <!-- Minimum Tracks — custom select -->
          <div class="panel-section">
            <span class="panel-label">Minimum Tracks</span>
            <div class="custom-select-wrapper">
              <select
                class="custom-select"
                [value]="minTrackCount()"
                (change)="onMinTrackSelect($event)"
              >
                <option value="0">Any Number</option>
                <option value="3">3+ Tracks</option>
                <option value="5">5+ Tracks</option>
                <option value="8">8+ Tracks</option>
              </select>
              <span class="material-icons select-arrow">expand_more</span>
            </div>
          </div>

          <!-- Recency — custom select -->
          <div class="panel-section">
            <span class="panel-label">Recency</span>
            <div class="custom-select-wrapper">
              <select
                class="custom-select"
                [value]="recencyDays()"
                (change)="onRecencySelect($event)"
              >
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="180">Last 6 months</option>
                <option value="365">Last year</option>
              </select>
              <span class="material-icons select-arrow">expand_more</span>
            </div>
          </div>

          <!-- Hide Live Albums — custom toggle switch -->
          <div class="panel-section toggle-section">
            <div class="toggle-info">
              <span class="toggle-title">Hide Live Albums</span>
              <span class="toggle-subtitle">Show only studio recordings</span>
            </div>
            <button
              class="toggle-switch"
              [class.on]="hideLive()"
              (click)="hideLiveChange.emit(!hideLive())"
              role="switch"
              [attr.aria-checked]="hideLive()"
              aria-label="Hide live albums"
            >
              <span class="toggle-dot"></span>
            </button>
          </div>
        </div>

        <div class="panel-footer">
          <button class="btn-apply" (click)="closeFilterPanel()">Apply Filters</button>
          <button class="btn-actions" (click)="markAllSeen.emit(); closeFilterPanel()">
            Mark all seen
          </button>
          <div class="sync-row">
            <button
              class="btn-sync"
              [disabled]="syncing()"
              (click)="syncNow.emit('quick'); closeFilterPanel()"
            >
              <span class="material-icons sync-icon">sync</span>
              {{ syncing() ? 'Syncing…' : 'Quick Sync' }}
            </button>
            <button
              class="btn-sync"
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
      position: sticky;
      top: 0;
      z-index: 10;
      background: #0e0e11;
      padding: 16px 0 12px;
      margin: -16px 0 0;
    }

    /* ── Header ── */
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

      .material-icons {
        font-size: 20px;
      }

      &:hover {
        background: rgba(186, 158, 255, 0.12);
        color: #ba9eff;
      }
    }

    /* ── Side Panel ── */
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
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .panel-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 28px;
      overflow-y: auto;
      scrollbar-width: none;

      &::-webkit-scrollbar {
        display: none;
      }
    }

    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .panel-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #acaaae;
    }

    /* ── Segmented Control ── */
    .seg-control {
      display: flex;
      gap: 2px;
      padding: 3px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 0.75rem;
    }

    .seg-btn {
      flex: 1;
      padding: 8px 0;
      border: none;
      border-radius: 0.5rem;
      background: transparent;
      color: #acaaae;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;

      &:hover:not(.active) {
        background: rgba(255, 255, 255, 0.04);
        color: #f0edf1;
      }

      &.active {
        background: #ba9eff;
        color: #000;
        font-weight: 700;
      }
    }

    /* ── Custom Select ── */
    .custom-select-wrapper {
      position: relative;
    }

    .custom-select {
      width: 100%;
      padding: 12px 40px 12px 16px;
      background: rgba(37, 37, 42, 0.6);
      border: 1px solid rgba(72, 72, 71, 0.3);
      border-radius: 0.75rem;
      color: #f0edf1;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 500;
      appearance: none;
      -webkit-appearance: none;
      cursor: pointer;
      outline: none;
      transition: border-color 0.2s;

      &:hover {
        border-color: rgba(186, 158, 255, 0.3);
      }

      &:focus {
        border-color: rgba(186, 158, 255, 0.5);
      }

      option {
        background: #19191d;
        color: #f0edf1;
      }
    }

    .select-arrow {
      position: absolute;
      right: 12px;
      top: 50%;
      transform: translateY(-50%);
      color: #acaaae;
      font-size: 20px;
      pointer-events: none;
    }

    /* ── Toggle Switch ── */
    .toggle-section {
      flex-direction: row !important;
      align-items: center;
      justify-content: space-between;
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

    .toggle-switch {
      position: relative;
      width: 40px;
      height: 22px;
      border-radius: 999px;
      border: none;
      background: #25252a;
      cursor: pointer;
      padding: 0;
      transition: background 0.3s;
      flex-shrink: 0;

      &.on {
        background: #ba9eff;
      }
    }

    .toggle-dot {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 999px;
      background: #f0edf1;
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);

      .toggle-switch.on & {
        transform: translateX(18px);
      }
    }

    /* ── Footer ── */
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
      box-shadow: 0 10px 20px rgba(186, 158, 255, 0.2);
      transition: transform 0.15s;

      &:hover {
        transform: scale(1.02);
      }

      &:active {
        transform: scale(0.98);
      }
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

      &:hover {
        color: #f0edf1;
      }
    }

    .sync-row {
      display: flex;
      gap: 8px;
      margin-top: 4px;
    }

    .btn-sync {
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

      .sync-icon {
        font-size: 16px;
      }

      &:hover {
        border-color: rgba(186, 158, 255, 0.3);
        color: #f0edf1;
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
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

  onMinTrackSelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.minTrackChange.emit(value);
  }

  onRecencySelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    this.recencyChange.emit(value);
  }
}
