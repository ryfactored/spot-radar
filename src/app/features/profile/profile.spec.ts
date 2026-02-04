import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { Profile } from './profile';
import { AuthService, StorageService } from '@core';
import { ProfileService } from './profile-service';
import { ProfileStore } from './profile-store';
import { ConfirmDialogService, ToastService } from '@shared';
import { environment } from '@env';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let authMock: any;
  let storageMock: any;
  let profileMock: any;
  let profileStore: ProfileStore;
  let toastMock: any;
  let confirmMock: any;

  const mockProfileData = {
    id: 'user-123',
    email: 'test@test.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
    bio: '',
    role: 'user' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(async () => {
    authMock = {
      currentUser: signal({ id: 'user-123', email: 'test@test.com' }),
      updatePassword: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
    };

    profileMock = {
      getProfile: vi.fn().mockResolvedValue(mockProfileData),
      updateProfile: vi.fn().mockResolvedValue(mockProfileData),
      deleteProfile: vi.fn().mockResolvedValue(undefined),
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
      info: vi.fn(),
    };

    confirmMock = {
      confirm: vi.fn().mockResolvedValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [Profile, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authMock },
        { provide: ProfileService, useValue: profileMock },
        { provide: StorageService, useValue: storageMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ConfirmDialogService, useValue: confirmMock },
      ],
    }).compileComponents();

    profileStore = TestBed.inject(ProfileStore);
    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load avatar_url from profile into store', () => {
    expect(profileStore.avatarUrl()).toBe('https://example.com/avatar.png');
  });

  it('should show avatar image when avatarUrl is set', () => {
    fixture.detectChanges();
    const avatar = fixture.nativeElement.querySelector('app-avatar');
    expect(avatar).toBeTruthy();
    const img = avatar.querySelector('img');
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
      bucket: environment.storageBuckets.avatars,
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

  it('should update store profile after submit', async () => {
    await component.onSubmit();

    expect(profileStore.currentProfile()).toEqual(mockProfileData);
  });

  it('should clear store on delete', async () => {
    confirmMock.confirm.mockResolvedValue(true);

    await component.onDeleteAccount();

    expect(profileStore.currentProfile()).toBeNull();
  });

  describe('change password', () => {
    it('should not submit when password form is invalid', async () => {
      await component.onChangePassword();
      expect(authMock.updatePassword).not.toHaveBeenCalled();
    });

    it('should call updatePassword and show success toast', async () => {
      component.passwordForm.patchValue({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      component.passwordForm.updateValueAndValidity();

      await component.onChangePassword();

      expect(authMock.updatePassword).toHaveBeenCalledWith('newpassword123');
      expect(toastMock.success).toHaveBeenCalledWith('Password changed successfully');
    });

    it('should reset password form after successful change', async () => {
      component.passwordForm.patchValue({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      component.passwordForm.updateValueAndValidity();

      await component.onChangePassword();

      expect(component.passwordForm.value.password).toBeFalsy();
      expect(component.passwordValue()).toBe('');
    });

    it('should show error toast on failure', async () => {
      authMock.updatePassword.mockRejectedValue(new Error('Same password'));
      component.passwordForm.patchValue({
        password: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
      component.passwordForm.updateValueAndValidity();

      await component.onChangePassword();

      expect(toastMock.error).toHaveBeenCalledWith('Same password');
    });
  });

  describe('delete account', () => {
    it('should not delete when confirm dialog is cancelled', async () => {
      confirmMock.confirm.mockResolvedValue(false);

      await component.onDeleteAccount();

      expect(profileMock.deleteProfile).not.toHaveBeenCalled();
      expect(authMock.signOut).not.toHaveBeenCalled();
    });

    it('should delete profile and sign out when confirmed', async () => {
      confirmMock.confirm.mockResolvedValue(true);

      await component.onDeleteAccount();

      expect(profileMock.deleteProfile).toHaveBeenCalledWith('user-123');
      expect(authMock.signOut).toHaveBeenCalled();
      expect(toastMock.info).toHaveBeenCalledWith('Your account data has been deleted');
    });

    it('should show error toast on delete failure', async () => {
      confirmMock.confirm.mockResolvedValue(true);
      profileMock.deleteProfile.mockRejectedValue(new Error('Delete failed'));

      await component.onDeleteAccount();

      expect(toastMock.error).toHaveBeenCalledWith('Delete failed');
    });
  });
});
