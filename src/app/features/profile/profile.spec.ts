import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Profile } from './profile';
import { AuthService, StorageService } from '@core';
import { ProfileService } from './profile-service';
import { ToastService } from '@shared';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let storageMock: any;
  let profileMock: any;
  let toastMock: any;

  beforeEach(async () => {
    const authMock = {
      currentUser: signal({ id: 'user-123', email: 'test@test.com' }),
    };

    profileMock = {
      getProfile: vi.fn().mockResolvedValue({
        id: 'user-123',
        email: 'test@test.com',
        display_name: 'Test User',
        avatar_url: 'https://example.com/avatar.png',
        bio: '',
      }),
      updateProfile: vi.fn().mockResolvedValue({}),
    };

    storageMock = {
      validateAvatar: vi.fn().mockReturnValue(null),
      upload: vi.fn().mockResolvedValue({
        path: 'user-123/avatar.png',
        publicUrl: 'https://example.com/new-avatar.png',
      }),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [Profile, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ProfileService, useValue: profileMock },
        { provide: StorageService, useValue: storageMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load avatar_url from profile', () => {
    expect(component.avatarUrl()).toBe('https://example.com/avatar.png');
  });

  it('should show avatar image when avatarUrl is set', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('.avatar-img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.png');
  });

  it('should validate avatar on selection', () => {
    storageMock.validateAvatar.mockReturnValue('Invalid file type');
    const file = new File(['data'], 'doc.pdf', { type: 'application/pdf' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onAvatarSelected(event);

    expect(toastMock.error).toHaveBeenCalledWith('Invalid file type');
    expect(component.selectedAvatarFile()).toBeNull();
  });

  it('should set preview on valid avatar selection', () => {
    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    const event = { target: { files: [file] } } as unknown as Event;

    component.onAvatarSelected(event);

    expect(component.selectedAvatarFile()).toBe(file);
    expect(component.avatarPreview()).toBeTruthy();
  });

  it('should upload avatar on submit when file is selected', async () => {
    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    component.selectedAvatarFile.set(file);

    await component.onSubmit();

    expect(storageMock.upload).toHaveBeenCalledWith({
      bucket: 'avatars',
      path: 'user-123/avatar.png',
      file,
      upsert: true,
    });
    expect(profileMock.updateProfile).toHaveBeenCalledWith(
      'user-123',
      expect.objectContaining({
        avatar_url: 'https://example.com/new-avatar.png',
      }),
    );
  });
});
