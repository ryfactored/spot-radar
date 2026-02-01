import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2>Reset Password</h2>

    @if (success()) {
      <p class="success" role="status">Check your email for a password reset link.</p>
    } @else {
      <form [formGroup]="form" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline" class="full-width" subscriptSizing="fixed">
          <mat-label>Email</mat-label>
          <input matInput formControlName="email" type="email" />
          @if (form.controls.email.hasError('required')) {
            <mat-error>Email is required</mat-error>
          }
          @if (form.controls.email.hasError('email')) {
            <mat-error>Invalid email format</mat-error>
          }
        </mat-form-field>

        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }

        <button
          mat-raised-button
          color="primary"
          class="full-width"
          type="submit"
          [disabled]="loading()"
        >
          {{ loading() ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>
    }

    <p class="footer">Remember your password? <a routerLink="/login">Sign in</a></p>
  `,
  styles: `
    h2 {
      text-align: center;
      margin-bottom: 24px;
    }
    .full-width {
      width: 100%;
    }
    mat-form-field {
      margin-bottom: 16px;
    }
    .footer {
      text-align: center;
      margin-top: 16px;
    }
    .footer a {
      color: var(--mat-sys-primary);
    }
    .error {
      color: #f44336;
      text-align: center;
    }
    .success {
      color: #4caf50;
      text-align: center;
    }
  `,
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  loading = signal(false);
  error = signal('');
  success = signal(false);

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading.set(true);
    this.error.set('');

    try {
      await this.auth.resetPassword(this.form.value.email!);
      this.success.set(true);
    } catch (err) {
      this.error.set(err instanceof Error ? err.message : 'Failed to send reset link');
    } finally {
      this.loading.set(false);
    }
  }
}
