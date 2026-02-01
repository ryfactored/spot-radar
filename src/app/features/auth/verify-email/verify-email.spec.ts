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
});
