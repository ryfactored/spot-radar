import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Admin } from './admin';
import { UsersService } from './users-service';

describe('Admin', () => {
  let component: Admin;
  let fixture: ComponentFixture<Admin>;

  function createServiceMock(count = 42) {
    return { count: vi.fn().mockResolvedValue(count) };
  }

  async function setupTest(serviceMock = createServiceMock()) {
    await TestBed.configureTestingModule({
      imports: [Admin],
      providers: [provideRouter([]), { provide: UsersService, useValue: serviceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Admin);
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

  it('should display admin heading', async () => {
    await setupTest();
    const heading = fixture.nativeElement.querySelector('h1');
    expect(heading.textContent).toContain('Admin');
  });

  it('should have a link to users list', async () => {
    await setupTest();
    const card = fixture.nativeElement.querySelector('.admin-link-card');
    expect(card).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Users');
  });

  it('should display user count after loading', async () => {
    await setupTest(createServiceMock(42));
    expect(fixture.nativeElement.textContent).toContain('42 registered users');
  });

  it('should use singular form for count of 1', async () => {
    await setupTest(createServiceMock(1));
    expect(fixture.nativeElement.textContent).toContain('1 registered user');
    expect(fixture.nativeElement.textContent).not.toContain('1 registered users');
  });

  it('should show fallback subtitle when count fails', async () => {
    const mock = { count: vi.fn().mockRejectedValue(new Error('fail')) };
    await setupTest(mock);
    expect(fixture.nativeElement.textContent).toContain('View registered users');
  });
});
