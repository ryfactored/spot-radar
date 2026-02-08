import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { VerifyEmail } from './verify-email';
import { AuthService } from '@core';

describe('VerifyEmail', () => {
  let component: VerifyEmail;
  let fixture: ComponentFixture<VerifyEmail>;
  let authMock: {
    currentUser: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    authMock = {
      currentUser: signal(null),
      loading: signal(false),
    };

    await TestBed.configureTestingModule({
      imports: [VerifyEmail, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyEmail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show loading state while auth is loading', () => {
    authMock.loading.set(true);
    expect(component.isLoading()).toBe(true);
    expect(component.isVerified()).toBe(false);
  });

  it('should show verified state when user has session', () => {
    authMock.currentUser.set({ id: '123', email: 'test@example.com' } as any);
    expect(component.isVerified()).toBe(true);
    expect(component.isLoading()).toBe(false);
  });

  it('should show informational state when no token and no session', () => {
    // Default test state: no token in URL, no session, not loading
    expect(component.isLoading()).toBe(false);
    expect(component.isVerified()).toBe(false);
    expect(component.hasError()).toBe(false);
  });

  describe('DOM rendering', () => {
    it('should render spinner in loading state', () => {
      authMock.loading.set(true);
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Verifying your email');
    });

    it('should render check_circle icon and dashboard link in verified state', () => {
      authMock.currentUser.set({ id: '123', email: 'test@example.com' } as any);
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon.success');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toContain('check_circle');

      const link = fixture.nativeElement.querySelector('a[routerLink="/dashboard"]');
      expect(link).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Your email has been verified');
    });

    it('should render mail icon and login link in info state', () => {
      // Default: no token, no user, not loading → info state
      fixture.detectChanges();

      const icon = fixture.nativeElement.querySelector('.status-icon.info');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toContain('mail');

      const link = fixture.nativeElement.querySelector('a[routerLink="/login"]');
      expect(link).toBeTruthy();
      expect(fixture.nativeElement.textContent).toContain('Check your email');
    });
  });

  describe('error state (with token in URL)', () => {
    let originalHash: string;

    beforeEach(() => {
      originalHash = location.hash;
    });

    afterEach(() => {
      location.hash = originalHash;
    });

    it('should render error icon when token present but no user', async () => {
      location.hash = '#access_token=test-token';

      // Re-create component so hadToken is evaluated with the hash
      const errorFixture = TestBed.createComponent(VerifyEmail);
      const errorComponent = errorFixture.componentInstance;
      await errorFixture.whenStable();

      // Not loading, no user, but had token → error state
      expect(errorComponent.hasError()).toBe(true);
      errorFixture.detectChanges();

      const icon = errorFixture.nativeElement.querySelector('.status-icon.error');
      expect(icon).toBeTruthy();
      expect(icon.textContent).toContain('error');
      expect(errorFixture.nativeElement.textContent).toContain('Email Verification Failed');

      const link = errorFixture.nativeElement.querySelector('a[routerLink="/register"]');
      expect(link).toBeTruthy();
    });
  });
});
