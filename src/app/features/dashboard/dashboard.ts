import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '@core';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [MatButtonModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    @if (auth.currentUser()) {
      <p>Logged in as: {{ auth.currentUser()?.email }}</p>
      <button mat-raised-button (click)="logout()">Logout</button>
    } @else {
      <p>Not logged in</p>
      <button mat-raised-button color="primary" (click)="loginWithGoogle()">
        Sign in with Google
      </button>
    }
  `,
})
export class Dashboard {
  auth = inject(AuthService);

  async loginWithGoogle() {
    try {
      await this.auth.signInWithProvider('google');
    } catch (error) {
      console.error('Login failed:', error);
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}
