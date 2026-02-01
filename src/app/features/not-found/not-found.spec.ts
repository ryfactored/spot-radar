import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { NotFound } from './not-found';
import { AuthService } from '@core';

describe('NotFound', () => {
  let component: NotFound;
  let fixture: ComponentFixture<NotFound>;
  let authMock: {
    currentUser: ReturnType<typeof signal>;
  };

  beforeEach(async () => {
    authMock = {
      currentUser: signal(null),
    };

    await TestBed.configureTestingModule({
      imports: [NotFound, NoopAnimationsModule],
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFound);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show "Go Home" when user is not authenticated', () => {
    expect(component.isAuthenticated()).toBe(false);
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('a[href="/"]')?.textContent).toContain('Go Home');
  });

  it('should show "Go to Dashboard" when user is authenticated', () => {
    authMock.currentUser.set({ id: '123', email: 'test@example.com' } as any);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('a[href="/dashboard"]')?.textContent).toContain('Go to Dashboard');
  });

  it('should display page not found heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('h2')?.textContent).toContain('Page Not Found');
  });
});
