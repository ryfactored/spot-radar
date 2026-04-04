import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  template: `
    <div class="callback-container">
      <p>{{ message() }}</p>
    </div>
  `,
  styles: `
    .callback-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100dvh;
      color: var(--mat-sys-on-background, #fff);
      background: var(--mat-sys-background, #121215);
    }
  `,
})
export class AuthCallback implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  message = signal('Completing sign in...');

  ngOnInit() {
    toObservable(this.auth.loading)
      .pipe(
        filter((loading) => !loading),
        take(1),
      )
      .subscribe(() => {
        if (this.auth.currentUser()) {
          this.router.navigate(['/dashboard']);
        } else {
          this.message.set('Sign in failed. Redirecting...');
          setTimeout(() => this.router.navigate(['/login']), 2000);
        }
      });
  }
}
