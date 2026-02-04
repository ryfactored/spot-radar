import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenav, MatSidenavContent, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BreakpointObserver } from '@angular/cdk/layout';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { map, filter } from 'rxjs';
import { PreferencesService, AuthService, UserRole, FeatureFlags } from '@core';
import { ThemePicker, LoadingBar, Avatar } from '@shared';
import { ProfileService } from '@features/profile/profile-service';
import { ProfileStore } from '@features/profile/profile-store';
import { environment } from '@env';
import { routeAnimation } from '@shared';

@Component({
  selector: 'app-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  animations: [routeAnimation],
})
export class Shell {
  private sidenav = viewChild<MatSidenav>('sidenav');
  private sidenavContent = viewChild(MatSidenavContent);

  siteTitle = environment.siteTitle;
  preferences = inject(PreferencesService);
  featureFlags = inject(FeatureFlags);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private profileStore = inject(ProfileStore);
  private breakpointObserver = inject(BreakpointObserver);
  private router = inject(Router);

  // Route animation key — incremented on each route activation
  routeKey = signal(0);

  // User role — loaded reactively when currentUser changes
  private userRoleResource = resource({
    params: () => {
      const userId = this.auth.currentUser()?.id;
      return userId ? { userId } : undefined;
    },
    loader: async ({ params }) => {
      const profile = await this.profileService.getProfile(params.userId);
      this.profileStore.setProfile(profile);
      return (profile?.role as UserRole) ?? null;
    },
  });
  isAdmin = computed(() => this.userRoleResource.value() === 'admin');

  // User avatar and display name (shared via ProfileStore)
  avatarUrl = this.profileStore.avatarUrl;
  displayName = this.profileStore.displayName;
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
        if (this.isMobile()) {
          this.sidenav()?.close();
        }
        // Scroll content to top — the scroll container is mat-sidenav-content, not the viewport
        this.sidenavContent()?.getElementRef().nativeElement.scrollTo(0, 0);
      });
  }

  toggleSidenav() {
    if (this.isMobile()) {
      this.sidenav()?.toggle();
    } else {
      this.preferences.toggleSidenav();
    }
  }

  onActivate() {
    this.routeKey.update((k) => k + 1);
  }

  async logout() {
    await this.auth.signOut();
  }
}
