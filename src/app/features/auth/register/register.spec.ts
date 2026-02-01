import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { Register } from './register';
import { AuthService } from '@core';
import { environment } from '@env';

describe('Register', () => {
  let component: Register;
  let fixture: ComponentFixture<Register>;

  beforeEach(async () => {
    const authMock = {
      signUp: vi.fn().mockResolvedValue(undefined),
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

  it('should use environment passwordMinLength for password validator', () => {
    const shortPassword = 'a'.repeat(environment.passwordMinLength - 1);
    component.form.controls.password.setValue(shortPassword);
    expect(component.form.controls.password.hasError('minlength')).toBe(true);

    const validPassword = 'a'.repeat(environment.passwordMinLength);
    component.form.controls.password.setValue(validPassword);
    expect(component.form.controls.password.hasError('minlength')).toBe(false);
  });
});
