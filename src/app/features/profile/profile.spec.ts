import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Profile } from './profile';
import { AuthService } from '../../core/auth';
import { ProfileService } from '../../core/profile';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  beforeEach(async () => {
    const authMock = {
      currentUser: signal({ id: 'user-123', email: 'test@test.com' }),
    };

    const profileMock = {
      getProfile: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        display_name: 'Test User',
        bio: '',
      }),
    };

    await TestBed.configureTestingModule({
      imports: [Profile, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ProfileService, useValue: profileMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
