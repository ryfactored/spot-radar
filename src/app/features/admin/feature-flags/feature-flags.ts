import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { FeatureFlags } from '@core';

@Component({
  selector: 'app-feature-flags',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, MatIconModule, MatCardModule],
  template: `
    <div class="page-header">
      <h1>Feature Flags</h1>
    </div>

    <mat-card class="flags-card">
      <mat-card-header>
        <mat-card-title>Runtime Overrides</mat-card-title>
        <mat-card-subtitle>
          <mat-icon class="subtitle-icon">info</mat-icon>
          Changes are session-only and reset on page reload.
        </mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div class="flags-list">
          @for (flag of featureFlags.allFlags(); track flag.name) {
            <div class="flag-row">
              <div class="flag-info">
                <span class="flag-name">{{ flag.name }}</span>
              </div>
              <mat-slide-toggle
                [checked]="flag.enabled"
                (change)="featureFlags.setEnabled(flag.name, $event.checked)"
              />
            </div>
          }
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .flags-card {
      max-width: 520px;
    }

    .subtitle-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
      vertical-align: text-bottom;
      margin-right: 4px;
    }

    .flag-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .flag-row:last-child {
      border-bottom: none;
    }

    .flag-name {
      font-weight: 500;
    }
  `,
})
export class FeatureFlagsPage {
  protected featureFlags = inject(FeatureFlags);
}
