import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Login } from './login';
import { AuthService } from '@core';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authMock: {
    signIn: ReturnType<typeof vi.fn>;
    signInWithProvider: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authMock = {
      signIn: vi.fn().mockResolvedValue(undefined),
      signInWithProvider: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Login, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
    expect(component.showPassword()).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(authMock.signIn).not.toHaveBeenCalled();
  });

  it('should call signIn and navigate on valid submit', async () => {
    const router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');

    await component.onSubmit();

    expect(authMock.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading()).toBe(false);
  });

  it('should show error on signIn failure', async () => {
    authMock.signIn.mockRejectedValue(new Error('Invalid credentials'));
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');

    await component.onSubmit();

    expect(component.error()).toBe('Invalid credentials');
    expect(component.loading()).toBe(false);
  });

  it('should clear error before submit', async () => {
    component.error.set('Previous error');
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');

    const submitPromise = component.onSubmit();
    expect(component.error()).toBe('');
    await submitPromise;
  });

  it('should set loading during submit', async () => {
    let resolveSignIn: () => void;
    authMock.signIn.mockReturnValue(new Promise<void>((r) => (resolveSignIn = r)));

    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');

    const submitPromise = component.onSubmit();
    expect(component.loading()).toBe(true);

    resolveSignIn!();
    await submitPromise;
    expect(component.loading()).toBe(false);
  });

  it('should call signInWithProvider for social login', async () => {
    await component.loginWithProvider('google');

    expect(authMock.signInWithProvider).toHaveBeenCalledWith('google');
  });

  it('should show error on social login failure', async () => {
    authMock.signInWithProvider.mockRejectedValue(new Error('OAuth error'));

    await component.loginWithProvider('github');

    expect(component.error()).toBe('OAuth error');
    expect(component.loadingProvider()).toBeNull();
  });

  it('should set loadingProvider during social login', async () => {
    let resolveProvider: () => void;
    authMock.signInWithProvider.mockReturnValue(new Promise<void>((r) => (resolveProvider = r)));

    const loginPromise = component.loginWithProvider('google');
    expect(component.loadingProvider()).toBe('google');

    resolveProvider!();
    await loginPromise;
  });

  it('should validate email is required', () => {
    component.form.controls.email.setValue('');
    expect(component.form.controls.email.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    component.form.controls.email.setValue('not-an-email');
    expect(component.form.controls.email.hasError('email')).toBe(true);
  });

  it('should validate password is required', () => {
    component.form.controls.password.setValue('');
    expect(component.form.controls.password.hasError('required')).toBe(true);
  });
});
