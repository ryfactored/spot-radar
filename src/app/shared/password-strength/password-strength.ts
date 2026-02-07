import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { environment } from '@env';

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number;
  level: StrengthLevel;
  label: string;
}

@Component({
  selector: 'app-password-strength',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="password-strength" aria-live="polite" aria-atomic="true">
      <div class="strength-bar" aria-hidden="true">
        @for (segment of [1, 2, 3, 4]; track segment) {
          <div
            class="segment"
            [class.active]="segment <= strength().score"
            [class.weak]="strength().level === 'weak' && segment <= strength().score"
            [class.fair]="strength().level === 'fair' && segment <= strength().score"
            [class.good]="strength().level === 'good' && segment <= strength().score"
            [class.strong]="strength().level === 'strong' && segment <= strength().score"
          ></div>
        }
      </div>
      <span class="strength-label" [class]="strength().level" [class.hidden]="!password()">
        @if (password()) {
          Password strength: {{ strength().label }}
        }
      </span>
    </div>
  `,
  styles: `
    .password-strength {
      margin-top: -8px;
      margin-bottom: 16px;
    }
    .strength-bar {
      display: flex;
      gap: 4px;
      height: 4px;
      margin-bottom: 4px;
    }
    .segment {
      flex: 1;
      background: var(--mat-sys-surface-variant, #e0e0e0);
      border-radius: 2px;
      transition: background-color 0.2s;
    }
    .segment.weak {
      background: var(--mat-sys-error, #f44336);
    }
    .segment.fair {
      background: var(--password-strength-fair, #ff9800);
    }
    .segment.good {
      background: var(--password-strength-good, #ffc107);
    }
    .segment.strong {
      background: var(--password-strength-strong, #4caf50);
    }
    .strength-label {
      display: block;
      font-size: 12px;
      line-height: 18px;
      min-height: 18px;
      text-transform: capitalize;
    }
    .strength-label.weak {
      color: var(--mat-sys-error, #f44336);
    }
    .strength-label.fair {
      color: var(--password-strength-fair, #ff9800);
    }
    .strength-label.good {
      color: var(--password-strength-good, #ffc107);
    }
    .strength-label.strong {
      color: var(--password-strength-strong, #4caf50);
    }
    .strength-label.hidden {
      visibility: hidden;
    }
  `,
})
export class PasswordStrength {
  password = input<string>('');

  strength = computed<PasswordStrengthResult>(() => {
    return this.calculateStrength(this.password());
  });

  private calculateStrength(password: string): PasswordStrengthResult {
    if (!password) {
      return { score: 0, level: 'weak', label: '' };
    }

    // NIST SP 800-63B: Length is the primary factor for password strength
    // - Minimum 8 characters required
    // - 15+ characters recommended
    // Complexity requirements (mixed case, numbers, symbols) are discouraged
    const len = password.length;
    const min = environment.passwordMinLength;

    let score: number;
    if (len >= 15) score = 4;
    else if (len >= 12) score = 3;
    else if (len >= min) score = 2;
    else score = 1;
    const levels: StrengthLevel[] = ['weak', 'fair', 'good', 'strong'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];

    return {
      score,
      level: levels[score - 1],
      label: labels[score - 1],
    };
  }
}
