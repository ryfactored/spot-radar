import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';

import { Dashboard } from './dashboard';
import { AuthService, FeatureFlags } from '@core';

describe('Dashboard', () => {
  let component: Dashboard;
  let fixture: ComponentFixture<Dashboard>;

  async function setupTest(
    user: { id: string; email: string } | null = {
      id: '123',
      email: 'test@example.com',
    },
    featureOverrides: Record<string, boolean> = {},
  ) {
    const authMock = { currentUser: signal(user) };
    const featureFlagsMock = {
      isEnabled: (feature: string) => featureOverrides[feature] ?? true,
    };

    await TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: FeatureFlags, useValue: featureFlagsMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await setupTest();
    expect(component).toBeTruthy();
  });

  it('should display welcome message with user email', async () => {
    await setupTest({ id: '1', email: 'jane@example.com' });
    expect(fixture.nativeElement.textContent).toContain('Welcome back, jane@example.com');
  });

  it('should display dashboard heading', async () => {
    await setupTest();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent).toContain('Dashboard');
  });

  it('should render all quick link cards', async () => {
    await setupTest();
    const cards = fixture.nativeElement.querySelectorAll('.link-card');
    expect(cards.length).toBe(4);
  });

  it('should have links to all feature pages', async () => {
    await setupTest();
    const links = fixture.nativeElement.querySelectorAll('.link-card');
    const hrefs = Array.from(links).map((el: any) => el.getAttribute('href'));
    expect(hrefs).toContain('/notes');
    expect(hrefs).toContain('/chat');
    expect(hrefs).toContain('/files');
    expect(hrefs).toContain('/profile');
  });

  it('should display card titles', async () => {
    await setupTest();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Notes');
    expect(text).toContain('Chat');
    expect(text).toContain('Files');
    expect(text).toContain('Profile');
  });
});
