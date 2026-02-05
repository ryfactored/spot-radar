import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { Component } from '@angular/core';

import { Breadcrumb, BreadcrumbItem } from './breadcrumb';

@Component({ template: '' })
class DummyComponent {}

describe('Breadcrumb', () => {
  let fixture: ComponentFixture<Breadcrumb>;
  let component: Breadcrumb;
  let router: Router;

  async function setup(routes: Routes = []) {
    await TestBed.configureTestingModule({
      imports: [Breadcrumb],
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Breadcrumb);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should create', async () => {
    await setup();
    expect(component).toBeTruthy();
  });

  it('should render nothing when no breadcrumb data is present', async () => {
    await setup([{ path: 'test', component: DummyComponent }]);

    await router.navigate(['/test']);
    await fixture.whenStable();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('should render breadcrumb items with links and separators', async () => {
    const breadcrumb: BreadcrumbItem[] = [{ label: 'Admin', route: '/admin' }, { label: 'Users' }];

    await setup([{ path: 'admin/users', component: DummyComponent, data: { breadcrumb } }]);

    await router.navigate(['/admin/users']);
    await fixture.whenStable();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector('.breadcrumb-link');
    expect(link).not.toBeNull();
    expect(link.textContent).toContain('Admin');

    const current = fixture.nativeElement.querySelector('.breadcrumb-current');
    expect(current).not.toBeNull();
    expect(current.textContent).toContain('Users');
    expect(current.getAttribute('aria-current')).toBe('page');
  });

  it('should have separator count equal to items minus one', async () => {
    const breadcrumb: BreadcrumbItem[] = [{ label: 'Admin', route: '/admin' }, { label: 'Users' }];

    await setup([{ path: 'admin/users', component: DummyComponent, data: { breadcrumb } }]);

    await router.navigate(['/admin/users']);
    await fixture.whenStable();
    fixture.detectChanges();

    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(separators.length).toBe(breadcrumb.length - 1);
  });
});
