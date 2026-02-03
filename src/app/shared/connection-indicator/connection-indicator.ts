import { Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ConnectionStatus } from '@core';

/**
 * Displays the current realtime connection status.
 *
 * Shows an icon with optional label indicating whether the app
 * is connected to the realtime server for live updates.
 */
@Component({
  selector: 'app-connection-indicator',
  standalone: true,
  imports: [MatIconModule, MatTooltipModule],
  template: `
    <div class="connection-indicator" [matTooltip]="tooltip()">
      <mat-icon [class]="status()">{{ icon() }}</mat-icon>
      @if (showLabel()) {
        <span class="label">{{ label() }}</span>
      }
    </div>
  `,
  styles: `
    .connection-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 0.875rem;
    }

    mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-icon.connected {
      color: #4caf50;
    }

    mat-icon.connecting,
    mat-icon.reconnecting {
      color: #ff9800;
      animation: pulse 1.5s infinite;
    }

    mat-icon.disconnected {
      color: var(--mat-card-subtitle-text-color, #9e9e9e);
    }

    .label {
      color: var(--mat-sys-on-surface-variant);
    }

    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
  `,
})
export class ConnectionIndicator {
  status = input<ConnectionStatus>('disconnected');
  showLabel = input(false);

  icon = computed(() => {
    switch (this.status()) {
      case 'connected':
      case 'connecting':
        return 'wifi';
      case 'reconnecting':
      case 'disconnected':
        return 'wifi_off';
    }
  });

  label = computed(() => {
    switch (this.status()) {
      case 'connected':
        return 'Live';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Offline';
    }
  });

  tooltip = computed(() => `Realtime: ${this.label()}`);
}
