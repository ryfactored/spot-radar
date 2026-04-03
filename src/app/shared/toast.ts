import { Injectable, signal, computed } from '@angular/core';
import { environment } from '@env';

export interface ToastMessage {
  type: 'success' | 'error' | 'info';
  title: string;
  subtitle?: string;
  action?: string;
  onAction?: () => void;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private durations = environment.toastDuration;
  private timer: ReturnType<typeof setTimeout> | null = null;

  private _toast = signal<ToastMessage | null>(null);
  readonly toast = this._toast.asReadonly();
  readonly visible = computed(() => this._toast() !== null);

  success(message: string, subtitle?: string) {
    this.showToast({ type: 'success', title: message, subtitle }, this.durations.success);
  }

  error(message: string, subtitle?: string) {
    this.showToast({ type: 'error', title: message, subtitle }, this.durations.error);
  }

  info(message: string, subtitle?: string) {
    this.showToast({ type: 'info', title: message, subtitle }, this.durations.info);
  }

  dismiss(runAction = false): void {
    const current = this._toast();
    if (runAction && current?.onAction) {
      current.onAction();
    }
    this.clear();
  }

  showWithAction(
    message: string,
    action: string,
    onAction: () => void,
    duration = 5000,
    type: ToastMessage['type'] = 'info',
  ): void {
    this.showToast({ type, title: message, action, onAction }, duration);
  }

  private showToast(toast: ToastMessage, duration: number): void {
    if (this.timer) clearTimeout(this.timer);
    this._toast.set(toast);
    this.timer = setTimeout(() => this.clear(), duration);
  }

  private clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this._toast.set(null);
  }
}
