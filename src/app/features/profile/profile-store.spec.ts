import { TestBed } from '@angular/core/testing';
import { ProfileStore } from './profile-store';
import { Profile } from './profile-service';

describe('ProfileStore', () => {
  let store: ProfileStore;

  const mockProfile: Profile = {
    id: 'user-123',
    email: 'test@test.com',
    display_name: 'Test User',
    avatar_url: 'https://example.com/avatar.png',
    bio: 'A bio',
    role: 'user',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(ProfileStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with null profile', () => {
      expect(store.currentProfile()).toBeNull();
    });

    it('should start with loading false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('should start with null avatarUrl', () => {
      expect(store.avatarUrl()).toBeNull();
    });

    it('should start with null displayName', () => {
      expect(store.displayName()).toBeNull();
    });
  });

  describe('setProfile', () => {
    it('should set the profile', () => {
      store.setProfile(mockProfile);

      expect(store.currentProfile()).toEqual(mockProfile);
    });

    it('should derive avatarUrl from profile', () => {
      store.setProfile(mockProfile);

      expect(store.avatarUrl()).toBe('https://example.com/avatar.png');
    });

    it('should derive displayName from profile', () => {
      store.setProfile(mockProfile);

      expect(store.displayName()).toBe('Test User');
    });

    it('should handle null profile', () => {
      store.setProfile(mockProfile);
      store.setProfile(null);

      expect(store.currentProfile()).toBeNull();
      expect(store.avatarUrl()).toBeNull();
      expect(store.displayName()).toBeNull();
    });

    it('should handle profile with null avatar_url', () => {
      store.setProfile({ ...mockProfile, avatar_url: null });

      expect(store.avatarUrl()).toBeNull();
    });

    it('should handle profile with null display_name', () => {
      store.setProfile({ ...mockProfile, display_name: null });

      expect(store.displayName()).toBeNull();
    });
  });

  describe('setAvatarUrl', () => {
    it('should update avatar_url on existing profile', () => {
      store.setProfile(mockProfile);
      store.setAvatarUrl('https://example.com/new-avatar.png?t=123');

      expect(store.avatarUrl()).toBe('https://example.com/new-avatar.png?t=123');
    });

    it('should not modify profile when profile is null', () => {
      store.setAvatarUrl('https://example.com/avatar.png');

      expect(store.currentProfile()).toBeNull();
      expect(store.avatarUrl()).toBeNull();
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear profile', () => {
      store.setProfile(mockProfile);
      store.clear();

      expect(store.currentProfile()).toBeNull();
    });

    it('should reset avatarUrl to null', () => {
      store.setProfile(mockProfile);
      store.clear();

      expect(store.avatarUrl()).toBeNull();
    });

    it('should reset displayName to null', () => {
      store.setProfile(mockProfile);
      store.clear();

      expect(store.displayName()).toBeNull();
    });
  });
});
