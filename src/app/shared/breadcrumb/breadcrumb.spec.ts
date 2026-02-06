import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { Component } from '@angular/core';

import { Breadcrumb } from './breadcrumb';

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

  it('should render nothing when only one level deep', async () => {
    await setup([{ path: 'test', component: DummyComponent, data: { title: 'Test' } }]);

    await router.navigate(['/test']);
    await fixture.whenStable();
    fixture.detectChanges();

    const nav = fixture.nativeElement.querySelector('nav');
    expect(nav).toBeNull();
  });

  it('should auto-generate breadcrumbs from nested route titles', async () => {
    const routes: Routes = [
      {
        path: 'admin',
        data: { title: 'Admin' },
        children: [
          {
            path: 'users',
            data: { title: 'Users' },
            component: DummyComponent,
          },
        ],
      },
    ];

    await setup(routes);

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

  it('should have one separator between two breadcrumb items', async () => {
    const routes: Routes = [
      {
        path: 'admin',
        data: { title: 'Admin' },
        children: [
          {
            path: 'users',
            data: { title: 'Users' },
            component: DummyComponent,
          },
        ],
      },
    ];

    await setup(routes);

    await router.navigate(['/admin/users']);
    await fixture.whenStable();
    fixture.detectChanges();

    const separators = fixture.nativeElement.querySelectorAll('.breadcrumb-separator');
    expect(separators.length).toBe(1);
  });
});
