import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '@core';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  template: `
    <h2>Sign In</h2>

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
      </mat-form-field>

      @if (error) {
        <p class="error">{{ error }}</p>
      }

      <button mat-raised-button color="primary" class="full-width" type="submit" [disabled]="loading">
        {{ loading ? 'Signing in...' : 'Sign In' }}
      </button>
    </form>

    <mat-divider class="divider"></mat-divider>

    <button mat-stroked-button class="full-width google-btn" (click)="loginWithGoogle()">
      <mat-icon>login</mat-icon>
      Continue with Google
    </button>

    <p class="footer">
      Don't have an account? <a routerLink="/register">Sign up</a>
    </p>
  `,
  styles: `
    h2 { text-align: center; margin-bottom: 24px; }
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    .divider { margin: 24px 0; }
    .google-btn { margin-bottom: 16px; }
    .google-btn mat-icon { margin-right: 8px; }
    .footer { text-align: center; margin-top: 16px; }
    .error { color: #f44336; text-align: center; }
  `
})
export class Login {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  loading = false;
  error = '';

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.error = '';

    try {
      await this.auth.signIn(this.form.value.email!, this.form.value.password!);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error = err.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle() {
    await this.auth.signInWithGoogle();
  }
}