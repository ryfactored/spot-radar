import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Shell } from './shell';
import { PreferencesService, AuthService } from '@core';
import { ProfileService } from '@features/profile/profile-service';
import { ProfileStore } from '@features/profile/profile-store';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let profileMock: ReturnType<typeof createProfileMock>;
  let profileStore: ProfileStore;

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

    it('should show admin toggle for admin users', async () => {
      await setupTest({ role: 'admin' });

      const adminToggle = fixture.nativeElement.querySelector('.admin-toggle');
      expect(adminToggle).not.toBeNull();
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

  describe('admin submenu', () => {
    it('should start collapsed', async () => {
      await setupTest({ role: 'admin' });

      const submenu = fixture.nativeElement.querySelector('#admin-submenu');
      expect(submenu).toBeNull();
    });

    it('should expand on toggle click', async () => {
      await setupTest({ role: 'admin' });

      const toggle = fixture.nativeElement.querySelector('.admin-toggle') as HTMLElement;
      toggle.click();
      fixture.detectChanges();

      const submenu = fixture.nativeElement.querySelector('#admin-submenu');
      expect(submenu).not.toBeNull();
    });

    it('should collapse on second click', async () => {
      await setupTest({ role: 'admin' });

      const toggle = fixture.nativeElement.querySelector('.admin-toggle') as HTMLElement;
      toggle.click();
      fixture.detectChanges();

      toggle.click();
      fixture.detectChanges();

      const submenu = fixture.nativeElement.querySelector('#admin-submenu');
      expect(submenu).toBeNull();
    });

    it('should show Overview, Users, and Feature Flags links when expanded', async () => {
      await setupTest({ role: 'admin' });

      const toggle = fixture.nativeElement.querySelector('.admin-toggle') as HTMLElement;
      toggle.click();
      fixture.detectChanges();

      const links = fixture.nativeElement.querySelectorAll('#admin-submenu a');
      expect(links.length).toBe(3);
      expect(links[0].textContent).toContain('Overview');
      expect(links[1].textContent).toContain('Users');
      expect(links[2].textContent).toContain('Feature Flags');
    });

    it('should have correct routerLink values on child links', async () => {
      await setupTest({ role: 'admin' });

      const toggle = fixture.nativeElement.querySelector('.admin-toggle') as HTMLElement;
      toggle.click();
      fixture.detectChanges();

      const overviewLink = fixture.nativeElement.querySelector('#admin-submenu a[href="/admin"]');
      const usersLink = fixture.nativeElement.querySelector(
        '#admin-submenu a[href="/admin/users"]',
      );
      expect(overviewLink).not.toBeNull();
      expect(usersLink).not.toBeNull();
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
});
