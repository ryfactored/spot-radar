import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Register } from './register';
import { AuthService } from '@core';
import { environment } from '@env';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;
  let authMock: {
    signUp: ReturnType<typeof vi.fn>;
    signInWithProvider: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authMock = {
      signUp: vi.fn().mockResolvedValue(undefined),
      signInWithProvider: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [Register, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Register);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have initial state', () => {
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
    expect(component.success()).toBe('');
    expect(component.showPassword()).toBe(false);
    expect(component.showConfirmPassword()).toBe(false);
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(authMock.signUp).not.toHaveBeenCalled();
  });

  it('should call signUp and show success on valid submit', async () => {
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    await component.onSubmit();

    expect(authMock.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
    expect(component.success()).toBe('Account created! Check your email to confirm.');
    expect(component.loading()).toBe(false);
  });

  it('should show error on signUp failure', async () => {
    authMock.signUp.mockRejectedValue(new Error('Email already registered'));
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    await component.onSubmit();

    expect(component.error()).toBe('Email already registered');
    expect(component.success()).toBe('');
    expect(component.loading()).toBe(false);
  });

  it('should clear error before submit', async () => {
    component.error.set('Previous error');
    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    const submitPromise = component.onSubmit();
    expect(component.error()).toBe('');
    await submitPromise;
  });

  it('should set loading during submit', async () => {
    let resolveSignUp: () => void;
    authMock.signUp.mockReturnValue(new Promise<void>((r) => (resolveSignUp = r)));

    component.form.controls.email.setValue('test@example.com');
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');

    const submitPromise = component.onSubmit();
    expect(component.loading()).toBe(true);

    resolveSignUp!();
    await submitPromise;
    expect(component.loading()).toBe(false);
  });

  it('should use environment passwordMinLength for password validator', () => {
    const shortPassword = 'a'.repeat(environment.passwordMinLength - 1);
    component.form.controls.password.setValue(shortPassword);
    expect(component.form.controls.password.hasError('minlength')).toBe(true);

    const validPassword = 'a'.repeat(environment.passwordMinLength);
    component.form.controls.password.setValue(validPassword);
    expect(component.form.controls.password.hasError('minlength')).toBe(false);
  });

  it('should validate password match', () => {
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('different456');
    expect(component.form.controls.confirmPassword.hasError('mismatch')).toBe(true);
  });

  it('should pass when passwords match', () => {
    component.form.controls.password.setValue('password123');
    component.form.controls.confirmPassword.setValue('password123');
    expect(component.form.controls.confirmPassword.hasError('mismatch')).toBe(false);
  });

  it('should validate email is required', () => {
    component.form.controls.email.setValue('');
    expect(component.form.controls.email.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    component.form.controls.email.setValue('not-an-email');
    expect(component.form.controls.email.hasError('email')).toBe(true);
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

  it('should update passwordValue signal when password changes', () => {
    component.form.controls.password.setValue('test123');
    expect(component.passwordValue()).toBe('test123');
  });
});
