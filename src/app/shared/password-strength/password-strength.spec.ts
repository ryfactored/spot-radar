import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { PasswordStrength } from './password-strength';
import { environment } from '@env';

@Component({
  standalone: true,
  imports: [PasswordStrength],
  template: `<app-password-strength [password]="password()" />`,
})
class TestHostComponent {
  password = signal('');
}

describe('PasswordStrength', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: TestHostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(fixture.nativeElement.querySelector('app-password-strength')).toBeTruthy();
  });

  it('should hide label for empty password', async () => {
    host.password.set('');
    fixture.detectChanges();
    await fixture.whenStable();
    const label = fixture.nativeElement.querySelector('.strength-label');
    expect(label.classList.contains('hidden')).toBe(true);
  });

  it('should show weak for password under passwordMinLength', async () => {
    host.password.set('a'.repeat(environment.passwordMinLength - 1));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strength-label');
    expect(label.textContent.trim()).toBe('Password strength: Weak');
    expect(label.classList.contains('weak')).toBe(true);
  });

  it('should show fair for password at passwordMinLength', async () => {
    host.password.set('a'.repeat(environment.passwordMinLength));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strength-label');
    expect(label.textContent.trim()).toBe('Password strength: Fair');
  });

  it('should show good for 12-14 char password', async () => {
    host.password.set('twelvecharss');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strength-label');
    expect(label.textContent.trim()).toBe('Password strength: Good');
  });

  it('should show strong for 15+ char password', async () => {
    host.password.set('fifteencharacte');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.strength-label');
    expect(label.textContent.trim()).toBe('Password strength: Strong');
    expect(label.classList.contains('strong')).toBe(true);
  });

  it('should display correct number of active segments', async () => {
    host.password.set('fifteencharacte');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const activeSegments = fixture.nativeElement.querySelectorAll('.segment.active');
    expect(activeSegments.length).toBe(4);
  });
});
