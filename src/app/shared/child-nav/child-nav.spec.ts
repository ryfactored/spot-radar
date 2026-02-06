import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ChildNav, ChildNavItem } from './child-nav';

@Component({ template: '' })
class DummyComponent {}

describe('ChildNav', () => {
  let component: ChildNav;
  let fixture: ComponentFixture<ChildNav>;
  let router: Router;

  const childNavItems: ChildNavItem[] = [
    { label: 'Overview', route: '/admin', icon: 'dashboard' },
    { label: 'Users', route: '/admin/users', icon: 'group' },
    { label: 'Feature Flags', route: '/admin/feature-flags', icon: 'toggle_on' },
  ];

  async function setupTest(routeData: Record<string, unknown> = {}) {
    await TestBed.configureTestingModule({
      imports: [ChildNav],
      providers: [
        provideRouter([
          { path: 'admin', component: DummyComponent, data: routeData },
          { path: 'dashboard', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(ChildNav);
    component = fixture.componentInstance;
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should render nothing when no childNav data', async () => {
    await setupTest();
    await router.navigate(['/admin']);
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
    expect(component.items().length).toBe(0);
  });

  it('should render tabs when childNav data is present', async () => {
    await setupTest({ childNav: childNavItems });
    await router.navigate(['/admin']);
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('a[mat-tab-link]');
    expect(tabs.length).toBe(3);
    expect(tabs[0].textContent).toContain('Overview');
    expect(tabs[1].textContent).toContain('Users');
    expect(tabs[2].textContent).toContain('Feature Flags');
  });

  it('should render icons when provided', async () => {
    await setupTest({ childNav: childNavItems });
    await router.navigate(['/admin']);
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons.length).toBe(3);
    expect(icons[0].textContent).toBe('dashboard');
    expect(icons[1].textContent).toBe('group');
    expect(icons[2].textContent).toBe('toggle_on');
  });

  it('should render tabs without icons when not provided', async () => {
    const itemsWithoutIcons: ChildNavItem[] = [
      { label: 'Tab 1', route: '/route1' },
      { label: 'Tab 2', route: '/route2' },
    ];
    await setupTest({ childNav: itemsWithoutIcons });
    await router.navigate(['/admin']);
    fixture.detectChanges();

    const icons = fixture.nativeElement.querySelectorAll('mat-icon');
    expect(icons.length).toBe(0);
  });

  it('should have correct routerLink on tabs', async () => {
    await setupTest({ childNav: childNavItems });
    await router.navigate(['/admin']);
    fixture.detectChanges();

    const tabs = fixture.nativeElement.querySelectorAll('a[mat-tab-link]');
    expect(tabs[0].getAttribute('href')).toBe('/admin');
    expect(tabs[1].getAttribute('href')).toBe('/admin/users');
    expect(tabs[2].getAttribute('href')).toBe('/admin/feature-flags');
  });

  it('should clear items when navigating to route without childNav', async () => {
    await setupTest({ childNav: childNavItems });
    await router.navigate(['/admin']);
    fixture.detectChanges();

    expect(component.items().length).toBe(3);

    await router.navigate(['/dashboard']);
    fixture.detectChanges();

    expect(component.items().length).toBe(0);
  });
});
