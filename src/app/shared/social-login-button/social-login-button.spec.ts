import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SocialLoginButton } from './social-login-button';

describe('SocialLoginButton', () => {
  let component: SocialLoginButton;
  let fixture: ComponentFixture<SocialLoginButton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialLoginButton],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialLoginButton);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('provider', 'google');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct provider label', () => {
    expect(component.providerLabel).toBe('Google');

    fixture.componentRef.setInput('provider', 'github');
    fixture.detectChanges();
    expect(component.providerLabel).toBe('GitHub');
  });

  it('should emit clicked event', () => {
    const clickSpy = vi.fn();
    component.clicked.subscribe(clickSpy);

    const button = fixture.nativeElement.querySelector('button');
    button.click();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('should have icon for each provider', () => {
    const providers = ['google', 'github', 'spotify', 'discord', 'apple'] as const;
    providers.forEach((provider) => {
      fixture.componentRef.setInput('provider', provider);
      fixture.detectChanges();
      expect(component.providerIcon).toContain('<svg');
    });
  });
});
