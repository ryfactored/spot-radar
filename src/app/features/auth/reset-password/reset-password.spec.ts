import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { ResetPassword } from './reset-password';
import { AuthService } from '@core';
import { ToastService } from '@shared';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  let authMock: {
    updatePassword: ReturnType<typeof vi.fn>;
    currentUser: ReturnType<typeof signal>;
    loading: ReturnType<typeof signal>;
  };
  let toastMock: { success: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authMock = {
      updatePassword: vi.fn().mockResolvedValue(undefined),
      currentUser: signal({ id: '123', email: 'test@example.com' }),
      loading: signal(false),
    };

    toastMock = {
      success: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ResetPassword, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form when user has active session', () => {
    expect(component.hasSession()).toBe(true);
  });

  it('should show no-session message when user is not authenticated', () => {
    authMock.currentUser.set(null);
    expect(component.hasSession()).toBe(false);
  });

  it('should show form while auth is still loading', () => {
    authMock.currentUser.set(null);
    authMock.loading.set(true);
    expect(component.hasSession()).toBe(true);
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(authMock.updatePassword).not.toHaveBeenCalled();
  });

  it('should call updatePassword and show toast on valid submit', async () => {
    component.form.controls.password.setValue('newPassword123');
    component.form.controls.confirmPassword.setValue('newPassword123');

    await component.onSubmit();

    expect(authMock.updatePassword).toHaveBeenCalledWith('newPassword123');
    expect(toastMock.success).toHaveBeenCalledWith('Password updated successfully');
    expect(component.loading()).toBe(false);
  });

  it('should show error on failure', async () => {
    authMock.updatePassword.mockRejectedValue(new Error('New password must be different'));
    component.form.controls.password.setValue('newPassword123');
    component.form.controls.confirmPassword.setValue('newPassword123');

    await component.onSubmit();

    expect(component.error()).toBe('New password must be different');
    expect(component.loading()).toBe(false);
  });

  it('should validate password match', () => {
    component.form.controls.password.setValue('password1');
    component.form.controls.confirmPassword.setValue('password2');

    expect(component.form.controls.confirmPassword.hasError('mismatch')).toBe(true);
  });
});
