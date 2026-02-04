import { Injectable, signal, computed } from '@angular/core';
import { Profile } from './profile-service';

@Injectable({
  providedIn: 'root',
})
export class ProfileStore {
  private profile = signal<Profile | null>(null);
  private loading = signal(false);

  readonly currentProfile = this.profile.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly avatarUrl = computed(() => this.profile()?.avatar_url ?? null);
  readonly displayName = computed(() => this.profile()?.display_name ?? null);

  setProfile(profile: Profile | null) {
    this.profile.set(profile);
  }

  setAvatarUrl(url: string) {
    this.profile.update((p) => (p ? { ...p, avatar_url: url } : p));
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.profile.set(null);
  }
}
