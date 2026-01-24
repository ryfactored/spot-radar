import { Component, inject, signal, computed, ViewChild } from '@angular/core';
import { RouterOutlet, RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs';
import { PreferencesService, AuthService } from '@core';
import { ThemePicker } from '@shared';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ThemePicker,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss'
})
export class Shell {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  preferences = inject(PreferencesService);
  private auth = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  // Detect mobile breakpoint (< 768px)
  private isMobile$ = this.breakpointObserver
    .observe(['(max-width: 767px)'])
    .pipe(map(result => result.matches));

  isMobile = toSignal(this.isMobile$, { initialValue: false });

  // Sidenav mode: 'over' on mobile, 'side' on desktop
  sidenavMode = computed(() => this.isMobile() ? 'over' : 'side');

  // Sidenav opened state: closed on mobile by default, respects preference on desktop
  sidenavOpened = computed(() => this.isMobile() ? false : this.preferences.sidenavOpened());

  constructor() {
    // Close sidenav on navigation when on mobile
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntilDestroyed()
    ).subscribe(() => {
      if (this.isMobile() && this.sidenav) {
        this.sidenav.close();
      }
    });
  }

  toggleSidenav() {
    if (this.isMobile()) {
      this.sidenav.toggle();
    } else {
      this.preferences.toggleSidenav();
    }
  }

  async logout() {
    await this.auth.signOut();
  }
}