import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { ForgotPassword } from './forgot-password';
import { AuthService } from '@core';

describe('ForgotPassword', () => {
  let component: ForgotPassword;
  let fixture: ComponentFixture<ForgotPassword>;
  let authMock: { resetPassword: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authMock = {
      resetPassword: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [ForgotPassword, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show form initially, not success message', () => {
    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
    expect(component.error()).toBe('');
  });

  it('should not submit when form is invalid', async () => {
    await component.onSubmit();
    expect(authMock.resetPassword).not.toHaveBeenCalled();
  });

  it('should call resetPassword and show success on valid submit', async () => {
    component.form.controls.email.setValue('test@example.com');

    await component.onSubmit();

    expect(authMock.resetPassword).toHaveBeenCalledWith('test@example.com');
    expect(component.success()).toBe(true);
    expect(component.loading()).toBe(false);
  });

  it('should show error on failure', async () => {
    authMock.resetPassword.mockRejectedValue(new Error('Too many attempts'));
    component.form.controls.email.setValue('test@example.com');

    await component.onSubmit();

    expect(component.error()).toBe('Too many attempts');
    expect(component.success()).toBe(false);
    expect(component.loading()).toBe(false);
  });
});
