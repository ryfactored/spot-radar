import { Component, inject, computed, ViewChild, signal, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs';
import { PreferencesService, AuthService, UserRole } from '@core';
import { ThemePicker, LoadingBar, Avatar } from '@shared';
import { ProfileService } from '@features/profile/profile-service';
import { environment } from '@env';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    ThemePicker,
    LoadingBar,
    Avatar,
  ],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  siteTitle = environment.siteTitle;
  preferences = inject(PreferencesService);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  // User role for conditional nav items
  userRole = signal<UserRole | null>(null);
  isAdmin = computed(() => this.userRole() === 'admin');

  // User avatar and display name (shared via ProfileService)
  avatarUrl = this.profileService.avatarUrl;
  displayName = this.profileService.displayName;
  // Detect mobile breakpoint (< 768px)
  private isMobile$ = this.breakpointObserver
    .observe(['(max-width: 767px)'])
    .pipe(map((result) => result.matches));

  isMobile = toSignal(this.isMobile$, { initialValue: false });

  // Sidenav mode: 'over' on mobile, 'side' on desktop
  sidenavMode = computed(() => (this.isMobile() ? 'over' : 'side'));

  // Sidenav opened state: closed on mobile by default, respects preference on desktop
  sidenavOpened = computed(() => (this.isMobile() ? false : this.preferences.sidenavOpened()));

  constructor() {
    // Close sidenav on navigation when on mobile
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        if (this.isMobile() && this.sidenav) {
          this.sidenav.close();
        }
      });
  }

  async ngOnInit() {
    await this.loadUserRole();
  }

  private async loadUserRole() {
    const user = this.auth.currentUser();
    if (!user) return;

    const profile = await this.profileService.getProfile(user.id);
    if (profile?.role) {
      this.userRole.set(profile.role as UserRole);
    }
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
