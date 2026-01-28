import { Component, input, computed } from '@angular/core';

export type StrengthLevel = 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number;
  level: StrengthLevel;
  label: string;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
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
      background: #e0e0e0;
      border-radius: 2px;
      transition: background-color 0.2s;
    }
    .segment.weak {
      background: #f44336;
    }
    .segment.fair {
      background: #ff9800;
    }
    .segment.good {
      background: #ffc107;
    }
    .segment.strong {
      background: #4caf50;
    }
    .strength-label {
      display: block;
      font-size: 12px;
      line-height: 18px;
      min-height: 18px;
      text-transform: capitalize;
    }
    .strength-label.weak {
      color: #f44336;
    }
    .strength-label.fair {
      color: #ff9800;
    }
    .strength-label.good {
      color: #ffc107;
    }
    .strength-label.strong {
      color: #4caf50;
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
    const score = len >= 15 ? 4 : len >= 12 ? 3 : len >= 8 ? 2 : 1;
    const levels: StrengthLevel[] = ['weak', 'fair', 'good', 'strong'];
    const labels = ['Weak', 'Fair', 'Good', 'Strong'];

    return {
      score,
      level: levels[score - 1],
      label: labels[score - 1],
    };
  }
}
