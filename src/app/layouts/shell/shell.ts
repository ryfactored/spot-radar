import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  resource,
  signal,
  viewChild,
} from '@angular/core';
import {
  RouterOutlet,
  RouterLink,
  RouterLinkActive,
  Router,
  NavigationEnd,
  ActivatedRoute,
} from '@angular/router';
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

/** Navigation mode for routes with child pages */
export const CHILD_NAV_MODE = {
  SIDENAV: 'sidenav',
  TABS: 'tabs',
  NONE: 'none',
} as const;

export type ChildNavMode = (typeof CHILD_NAV_MODE)[keyof typeof CHILD_NAV_MODE];
import { ThemePicker, LoadingBar, Avatar, Breadcrumb, ChildNav } from '@shared';
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
    Breadcrumb,
    ChildNav,
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
  private route = inject(ActivatedRoute);

  // Route animation key — incremented on each route activation
  routeKey = signal(0);

  // Route-level overrides (read from route data)
  private routeChildNavMode = signal<ChildNavMode | undefined>(undefined);
  private routeShowBreadcrumb = signal<boolean | undefined>(undefined);

  // Expandable submenu groups — derived from routes with slashes (e.g. admin/users → group "admin")
  private readonly groupPrefixes: Set<string>;
  expandedGroups = signal(new Set<string>());

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

  // Detect tablet breakpoint (768-1024px) — sidenav uses 'over' mode on tablets
  private isTablet$ = this.breakpointObserver
    .observe(['(max-width: 1024px)'])
    .pipe(map((result) => result.matches));

  private isTabletOrMobile = toSignal(this.isTablet$, { initialValue: false });

  // Sidenav mode: 'over' on mobile/tablet, 'side' on desktop (> 1024px)
  sidenavMode = computed(() => (this.isTabletOrMobile() ? 'over' : 'side'));

  // Sidenav opened state: closed on mobile/tablet by default, respects preference on desktop
  sidenavOpened = computed(() =>
    this.isTabletOrMobile() ? false : this.preferences.sidenavOpened(),
  );

  // Child navigation mode — controls how subpages are navigated
  // Set via route data `childNavMode: 'tabs' | 'sidenav' | 'none'`
  // Falls back to featureFlags.defaultChildNavMode, then CHILD_NAV_MODE.NONE
  private defaultChildNavMode = computed(() => {
    const configured = this.featureFlags.getString('defaultChildNavMode');
    return (configured as ChildNavMode) ?? CHILD_NAV_MODE.NONE;
  });
  childNavMode = computed(() => this.routeChildNavMode() ?? this.defaultChildNavMode());
  showSidenavSubmenus = computed(() => this.childNavMode() === CHILD_NAV_MODE.SIDENAV);
  showChildNavTabs = computed(() => this.childNavMode() === CHILD_NAV_MODE.TABS);
  hasExpandableGroups = computed(() => this.groupPrefixes.size > 0);

  // Breadcrumb visibility — controlled by feature flag and route data `showBreadcrumb: boolean`
  // Defaults to false if not specified in route data
  contentCentered = computed(() => this.featureFlags.isEnabled('centerContent'));

  showBreadcrumb = computed(() => {
    if (!this.featureFlags.isEnabled('breadcrumb')) return false;
    return this.routeShowBreadcrumb() ?? false;
  });

  constructor() {
    // Derive expandable group prefixes from Shell's child routes
    // Any route with a slash (e.g. "admin/users") makes its prefix ("admin") a group
    const shellRoute = this.router.config.find((r) => r.component === Shell);
    const childPaths = new Set((shellRoute?.children ?? []).map((r) => r.path).filter(Boolean));
    this.groupPrefixes = new Set<string>();
    for (const path of childPaths) {
      const slash = path!.indexOf('/');
      if (slash > 0) {
        const prefix = path!.substring(0, slash);
        if (childPaths.has(prefix)) {
          this.groupPrefixes.add(prefix);
        }
      }
    }

    // Close sidenav on navigation when on mobile, auto-expand matching submenu groups
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => {
        if (this.isTabletOrMobile()) {
          this.sidenav()?.close();
        }
        for (const prefix of this.groupPrefixes) {
          if (event.urlAfterRedirects.startsWith(`/${prefix}`)) {
            this.expandedGroups.update((g) => new Set(g).add(prefix));
          }
        }
        // Scroll content to top — the scroll container is mat-sidenav-content, not the viewport
        this.sidenavContent()?.getElementRef().nativeElement.scrollTo(0, 0);

        // Update route-level childNavMode
        this.updateRouteData();
      });

    // Initial route check
    this.updateRouteData();
  }

  private updateRouteData(): void {
    // Traverse to deepest child route
    let child = this.route;
    while (child.firstChild) child = child.firstChild;

    // Walk up looking for route data settings
    let current: ActivatedRoute | null = child;
    let foundChildNavMode = false;
    let foundShowBreadcrumb = false;

    while (current) {
      const data = current.snapshot?.data;
      if (data) {
        if (!foundChildNavMode && data['childNavMode'] !== undefined) {
          this.routeChildNavMode.set(data['childNavMode'] as ChildNavMode);
          foundChildNavMode = true;
        }
        if (!foundShowBreadcrumb && data['showBreadcrumb'] !== undefined) {
          this.routeShowBreadcrumb.set(data['showBreadcrumb'] as boolean);
          foundShowBreadcrumb = true;
        }
      }
      if (foundChildNavMode && foundShowBreadcrumb) break;
      current = current.parent;
    }

    if (!foundChildNavMode) this.routeChildNavMode.set(undefined);
    if (!foundShowBreadcrumb) this.routeShowBreadcrumb.set(undefined);
  }

  toggleSidenav() {
    if (this.isTabletOrMobile()) {
      this.sidenav()?.toggle();
    } else {
      this.preferences.toggleSidenav();
    }
  }

  toggleGroup(group: string, navigateTo?: string) {
    const next = new Set(this.expandedGroups());
    const expanding = !next.has(group);
    if (expanding) {
      next.add(group);
    } else {
      next.delete(group);
    }
    this.expandedGroups.set(next);
    if (expanding && navigateTo) {
      this.router.navigate([navigateTo]);
    }
  }

  onActivate() {
    this.routeKey.update((k) => k + 1);
  }

  async logout() {
    await this.auth.signOut();
  }
}
