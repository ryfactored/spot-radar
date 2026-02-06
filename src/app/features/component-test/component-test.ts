import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-component-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    <div class="page-header">
      <h1>Shared Components</h1>
    </div>
    <p class="subtitle">Test page for shared UI components</p>
    <router-outlet />
  `,
  styles: `
    .subtitle {
      color: var(--mat-card-subtitle-text-color, #666);
      margin-bottom: 24px;
    }
  `,
})
export class ComponentTest {}
