import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../core/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  template: `
    <h2>Create Account</h2>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Email</mat-label>
        <input matInput formControlName="email" type="email">
        @if (form.controls.email.hasError('required')) {
          <mat-error>Email is required</mat-error>
        }
        @if (form.controls.email.hasError('email')) {
          <mat-error>Invalid email format</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Password</mat-label>
        <input matInput formControlName="password" type="password">
        @if (form.controls.password.hasError('required')) {
          <mat-error>Password is required</mat-error>
        }
        @if (form.controls.password.hasError('minlength')) {
          <mat-error>Password must be at least 6 characters</mat-error>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="full-width">
        <mat-label>Confirm Password</mat-label>
        <input matInput formControlName="confirmPassword" type="password">
        @if (form.controls.confirmPassword.hasError('required')) {
          <mat-error>Please confirm your password</mat-error>
        }
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      @if (success) {
        <p class="success">{{ success }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Creating account...' : 'Sign Up' }}
      </button>
    </form>

    <p class="footer">
      Already have an account? <a routerLink="/login">Sign in</a>
    </p>
  `,
  styles: `
    h2 { text-align: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .footer { text-align: center; margin-top: 16px; }
    .error { color: #f44336; text-align: center; }
    .success { color: #4caf50; text-align: center; }
  `
})
export class Register {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required],
  });

  loading = false;
  error = '';
  success = '';

  async onSubmit() {
    if (this.form.invalid) return;

    if (this.form.value.password !== this.form.value.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signUp(this.form.value.email!, this.form.value.password!);
      this.success = 'Account created! Check your email to confirm.';
    } catch (err: any) {
      this.error = err.message || 'Registration failed';
    } finally {
      this.loading = false;
    }
  }
}