import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from './toast';

@Component({
  selector: 'app-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.visible()) {
      <div class="toast" [class]="'toast-' + toast.toast()!.type">
        <div class="toast-accent"></div>
        <div class="toast-icon">
          @switch (toast.toast()!.type) {
            @case ('success') {
              <span class="material-icons">check_circle</span>
            }
            @case ('error') {
              <span class="material-icons">error</span>
            }
            @case ('info') {
              <span class="material-icons">info</span>
            }
          }
        </div>
        <div class="toast-content">
          <span class="toast-title">{{ toast.toast()!.title }}</span>
          @if (toast.toast()!.subtitle) {
            <span class="toast-subtitle">{{ toast.toast()!.subtitle }}</span>
          }
        </div>
        @if (toast.toast()!.action) {
          <button class="toast-action" (click)="toast.dismiss(true)">
            {{ toast.toast()!.action }}
          </button>
        }
        <button class="toast-close" (click)="toast.dismiss()">
          <span class="material-icons">close</span>
        </button>
      </div>
    }
  `,
  styles: `
    .toast {
      position: fixed;
      bottom: 32px;
      right: 32px;
      z-index: 10000;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px 14px 0;
      background: #1f1f23;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
      animation: toast-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      max-width: 420px;
      overflow: hidden;
    }

    @keyframes toast-in {
      from {
        opacity: 0;
        transform: translateY(12px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .toast-accent {
      width: 3px;
      align-self: stretch;
      border-radius: 3px 0 0 3px;
      flex-shrink: 0;
    }

    .toast-success .toast-accent {
      background: #6df5e1;
    }
    .toast-success .toast-icon {
      color: #6df5e1;
    }

    .toast-error .toast-accent {
      background: #ff6e84;
    }
    .toast-error .toast-icon {
      color: #ff6e84;
    }

    .toast-info .toast-accent {
      background: #ba9eff;
    }
    .toast-info .toast-icon {
      color: #ba9eff;
    }

    .toast-icon {
      flex-shrink: 0;

      .material-icons {
        font-size: 22px;
      }
    }

    .toast-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 13px;
      font-weight: 700;
      color: #f0edf1;
    }

    .toast-subtitle {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 11px;
      color: #767579;
    }

    .toast-action {
      flex-shrink: 0;
      padding: 6px 14px;
      border: 1px solid rgba(186, 158, 255, 0.3);
      border-radius: 0.5rem;
      background: transparent;
      color: #ba9eff;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(186, 158, 255, 0.1);
      }
    }

    .toast-close {
      flex-shrink: 0;
      background: none;
      border: none;
      color: #767579;
      cursor: pointer;
      padding: 2px;
      display: flex;
      align-items: center;
      transition: color 0.2s;

      .material-icons {
        font-size: 16px;
      }

      &:hover {
        color: #f0edf1;
      }
    }
  `,
})
export class ToastContainer {
  protected toast = inject(ToastService);
}
