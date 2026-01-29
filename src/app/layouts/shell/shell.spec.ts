import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Shell } from './shell';
import { PreferencesService, AuthService, SupabaseService } from '@core';

describe('Shell', () => {
  let component: Shell;
  let fixture: ComponentFixture<Shell>;
  let supabaseMock: ReturnType<typeof createSupabaseMock>;

  function createSupabaseMock(role = 'user') {
    return {
      client: {
        from: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: { role }, error: null }),
            }),
          }),
        }),
      },
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
    theme: signal('light'),
    darkMode: signal(false),
    colorTheme: signal('default'),
    sidenavOpened: signal(true),
    toggleTheme: vi.fn(),
    toggleDarkMode: vi.fn(),
    toggleSidenav: vi.fn(),
    setColorTheme: vi.fn(),
  };

  async function setupTest(
    options: { role?: string; user?: { id: string; email: string } | null } = {},
  ) {
    const { role = 'user', user = { id: '123', email: 'test@test.com' } } = options;

    supabaseMock = createSupabaseMock(role);
    const authMock = createAuthMock(user);

    await TestBed.configureTestingModule({
      imports: [Shell, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: PreferencesService, useValue: preferencesMock },
        { provide: AuthService, useValue: authMock },
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    }).compileComponents();

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

    it('should not show admin link for regular users', async () => {
      await setupTest({ role: 'user' });

      const adminLink = fixture.nativeElement.querySelector('a[routerLink="/admin"]');
      expect(adminLink).toBeNull();
    });

    it('should show admin link for admin users', async () => {
      await setupTest({ role: 'admin' });

      const adminLink = fixture.nativeElement.querySelector('a[routerLink="/admin"]');
      expect(adminLink).not.toBeNull();
    });

    it('should not fetch role when user is not logged in', async () => {
      await setupTest({ user: null });

      expect(supabaseMock.client.from).not.toHaveBeenCalled();
      expect(component.userRole()).toBeNull();
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
