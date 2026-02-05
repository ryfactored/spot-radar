import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { FeatureFlags } from '@core';

@Component({
  selector: 'app-feature-flags',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatSlideToggleModule, MatIconModule],
  template: `
    <div class="page-header">
      <h1>Feature Flags</h1>
      <p class="subtitle">
        <mat-icon class="subtitle-icon">info</mat-icon>
        Changes are session-only and reset on page reload.
      </p>
    </div>

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
  `,
  styles: `
    .subtitle {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--mat-sys-on-surface-variant);
      font-size: 14px;
      margin: 0;
    }

    .subtitle-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .flags-list {
      max-width: 480px;
    }

    .flag-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid var(--mat-sys-outline-variant);
    }

    .flag-name {
      font-weight: 500;
    }
  `,
})
export class FeatureFlagsPage {
  protected featureFlags = inject(FeatureFlags);
}
