import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Router, NavigationStart, NavigationEnd } from '@angular/router';

import { LoadingBar } from './loading-bar';
import { environment } from '@env';

describe('LoadingBar', () => {
  let component: LoadingBar;
  let fixture: ComponentFixture<LoadingBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingBar],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not show loading bar initially', () => {
    expect(component.loading()).toBe(false);
  });

  it('should show loading bar on NavigationStart', () => {
    const router = TestBed.inject(Router);
    (router.events as any).next(new NavigationStart(1, '/dashboard'));
    expect(component.loading()).toBe(true);
  });

  it('should hide loading bar on NavigationEnd after delay', async () => {
    vi.useFakeTimers();
    const router = TestBed.inject(Router);
    (router.events as any).next(new NavigationStart(1, '/dashboard'));
    expect(component.loading()).toBe(true);
    (router.events as any).next(new NavigationEnd(1, '/dashboard', '/dashboard'));
    // Still visible during minimum display time
    expect(component.loading()).toBe(true);
    vi.advanceTimersByTime(environment.loadingBarDelayMs);
    expect(component.loading()).toBe(false);
    vi.useRealTimers();
  });
});
