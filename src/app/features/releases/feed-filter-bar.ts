import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
  selector: 'app-feed-filter-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
  ],
  template: `
    <div class="filter-bar">
      <h2 class="feed-title">New Releases</h2>
      <div class="filters">
        <mat-button-toggle-group
          [value]="releaseTypeFilter()"
          (change)="releaseTypeChange.emit($event.value)"
          aria-label="Release type"
        >
          <mat-button-toggle value="everything">Everything</mat-button-toggle>
          <mat-button-toggle value="album">Albums</mat-button-toggle>
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

        <button mat-stroked-button (click)="markAllSeen.emit()">
          <mat-icon>check</mat-icon>
          Mark all seen
        </button>
      </div>
    </div>
  `,
  styles: `
    .filter-bar {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container);
    }

    .feed-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      margin: 0;
    }

    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
    }

    mat-form-field {
      min-width: 140px;
    }
  `,
})
export class FeedFilterBar {
  releaseTypeFilter = input.required<string>();
  minTrackCount = input.required<number>();
  recencyDays = input.required<number>();

  releaseTypeChange = output<string>();
  minTrackChange = output<number>();
  recencyChange = output<number>();
  markAllSeen = output<void>();
}
