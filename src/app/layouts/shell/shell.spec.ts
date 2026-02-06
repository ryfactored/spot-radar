import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Component, signal } from '@angular/core';

import { Shell } from './shell';
import { PreferencesService, AuthService } from '@core';
import { ProfileService } from '@features/profile/profile-service';
import { ProfileStore } from '@features/profile/profile-store';

@Component({ template: '' })
class DummyComponent {}

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let profileMock: ReturnType<typeof createProfileMock>;
  let profileStore: ProfileStore;

  // Mock scrollTo for test environment
  beforeAll(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  function createProfileMock(role = 'user') {
    return {
      getProfile: vi.fn().mockResolvedValue({
        role,
        avatar_url: null,
        display_name: null,
        id: '123',
        email: 'test@test.com',
        bio: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      }),
    };
  }

  function createAuthMock(
    user: { id: string; email: string } | null = { id: '123', email: 'test@test.com' },
  ) {
    return {
      signOut: vi.fn().mockResolvedValue(undefined),
      currentUser: signal(user),
    };
  }

  const preferencesMock = {
    darkMode: signal(false),
    colorTheme: signal('default'),
    sidenavOpened: signal(true),
    toggleDarkMode: vi.fn(),
    toggleSidenav: vi.fn(),
    setColorTheme: vi.fn(),
  };

  async function setupTest(
    options: { role?: string; user?: { id: string; email: string } | null } = {},
  ) {
    const { role = 'user', user = { id: '123', email: 'test@test.com' } } = options;

    profileMock = createProfileMock(role);
    const authMock = createAuthMock(user);

    await TestBed.configureTestingModule({
      imports: [Shell, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PreferencesService, useValue: preferencesMock },
        { provide: AuthService, useValue: authMock },
        { provide: ProfileService, useValue: profileMock },
      ],
    }).compileComponents();

    profileStore = TestBed.inject(ProfileStore);
    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  describe('role-based navigation', () => {
    it('should set isAdmin to false for regular users', async () => {
      await setupTest({ role: 'user' });

      expect(component.isAdmin()).toBe(false);
    });

    it('should set isAdmin to true for admin users', async () => {
      await setupTest({ role: 'admin' });

      expect(component.isAdmin()).toBe(true);
    });

    it('should not show admin toggle for regular users', async () => {
      await setupTest({ role: 'user' });

      const adminToggle = fixture.nativeElement.querySelector('.admin-toggle');
      expect(adminToggle).toBeNull();
    });

    it('should not fetch role when user is not logged in', async () => {
      await setupTest({ user: null });

      expect(profileMock.getProfile).not.toHaveBeenCalled();
      expect(component.isAdmin()).toBe(false);
    });
  });

  describe('profile store integration', () => {
    it('should populate profile store after loading', async () => {
      await setupTest();

      expect(profileStore.currentProfile()).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should call auth signOut when logout is clicked', async () => {
      await setupTest();
      const authService = TestBed.inject(AuthService);

      await component.logout();

      expect(authService.signOut).toHaveBeenCalled();
    });
  });

  describe('route-based childNavMode', () => {
    async function setupTestWithRoutes(routes: Routes, initialUrl = '/') {
      profileMock = createProfileMock('admin');
      const authMock = createAuthMock();

      await TestBed.configureTestingModule({
        imports: [Shell, NoopAnimationsModule],
        providers: [
          provideRouter(routes),
          { provide: PreferencesService, useValue: preferencesMock },
          { provide: AuthService, useValue: authMock },
          { provide: ProfileService, useValue: profileMock },
        ],
      }).compileComponents();

      const router = TestBed.inject(Router);
      profileStore = TestBed.inject(ProfileStore);
      fixture = TestBed.createComponent(Shell);
      component = fixture.componentInstance;

      await router.navigateByUrl(initialUrl);
      await fixture.whenStable();
      fixture.detectChanges();
    }

    it('should default to none when route has no childNavMode', async () => {
      const routes: Routes = [
        {
          path: '',
          component: Shell,
          children: [
            {
              path: 'dashboard',
              component: DummyComponent,
              data: { title: 'Dashboard' },
            },
          ],
        },
      ];

      await setupTestWithRoutes(routes, '/dashboard');

      expect(component.childNavMode()).toBe('none');
      expect(component.showSidenavSubmenus()).toBe(false);
      expect(component.showChildNavTabs()).toBe(false);
    });

    it('should use tabs when route has childNavMode: tabs', async () => {
      const routes: Routes = [
        {
          path: '',
          component: Shell,
          children: [
            {
              path: 'admin',
              component: DummyComponent,
              data: { childNavMode: 'tabs' },
            },
          ],
        },
      ];

      await setupTestWithRoutes(routes, '/admin');

      expect(component.childNavMode()).toBe('tabs');
      expect(component.showChildNavTabs()).toBe(true);
      expect(component.showSidenavSubmenus()).toBe(false);
    });

    it('should use sidenav when route has childNavMode: sidenav', async () => {
      const routes: Routes = [
        {
          path: '',
          component: Shell,
          children: [
            {
              path: 'admin',
              component: DummyComponent,
              data: { childNavMode: 'sidenav' },
            },
          ],
        },
      ];

      await setupTestWithRoutes(routes, '/admin');

      expect(component.childNavMode()).toBe('sidenav');
      expect(component.showSidenavSubmenus()).toBe(true);
      expect(component.showChildNavTabs()).toBe(false);
    });

    it('should update childNavMode when navigating between routes', async () => {
      const routes: Routes = [
        {
          path: '',
          component: Shell,
          children: [
            {
              path: 'admin',
              component: DummyComponent,
              data: { childNavMode: 'tabs' },
            },
            {
              path: 'dashboard',
              component: DummyComponent,
              data: { title: 'Dashboard' },
            },
          ],
        },
      ];

      await setupTestWithRoutes(routes, '/admin');
      expect(component.childNavMode()).toBe('tabs');

      const router = TestBed.inject(Router);
      await router.navigateByUrl('/dashboard');
      await fixture.whenStable();
      fixture.detectChanges();

      expect(component.childNavMode()).toBe('none');
    });
  });
});
