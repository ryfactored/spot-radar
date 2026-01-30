import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, StorageService } from '@core';
import { SkeletonOverlay, ToastService } from '@shared';
import { ProfileService } from './profile-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    SkeletonOverlay,
  ],
  template: `
    <div class="page-header">
      <h1>Profile</h1>
    </div>

    <mat-card [appSkeletonOverlay]="loading()">
      <mat-card-content>
        <div class="avatar-section">
          <div
            class="avatar-wrapper"
            role="button"
            tabindex="0"
            (click)="avatarInput.click()"
            (keydown.enter)="avatarInput.click()"
          >
            @if (avatarPreview() || avatarUrl()) {
              <img [src]="avatarPreview() || avatarUrl()" alt="Avatar" class="avatar-img" />
            } @else {
              <div class="avatar-placeholder">
                <mat-icon>person</mat-icon>
              </div>
            }
            <div class="avatar-overlay">
              <mat-icon>photo_camera</mat-icon>
            </div>
          </div>
          <input
            #avatarInput
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            hidden
            (change)="onAvatarSelected($event)"
          />
          <span class="avatar-hint">Click to change avatar</span>
        </div>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" readonly />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Display Name</mat-label>
            <input matInput formControlName="display_name" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Bio</mat-label>
            <textarea matInput formControlName="bio" rows="3"></textarea>
          </mat-form-field>

          <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </button>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .full-width {
      width: 100%;
    }
    mat-form-field {
      margin-bottom: 16px;
    }
    mat-card {
      max-width: 500px;
    }
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    .avatar-wrapper {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      cursor: pointer;
      overflow: hidden;
    }
    .avatar-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: var(--mat-sys-surface-variant, #e0e0e0);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .avatar-placeholder mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: var(--mat-sys-on-surface-variant, #9e9e9e);
    }
    .avatar-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }
    .avatar-overlay mat-icon {
      color: white;
    }
    .avatar-wrapper:hover .avatar-overlay {
      opacity: 1;
    }
    .avatar-hint {
      margin-top: 8px;
      font-size: 12px;
      color: var(--mat-sys-on-surface-variant, #757575);
    }
  `,
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private storage = inject(StorageService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);
  avatarUrl = signal<string | null>(null);
  avatarPreview = signal<string | null>(null);
  selectedAvatarFile = signal<File | null>(null);

  form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    display_name: [''],
    bio: [''],
  });

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    try {
      const profile = await this.profileService.getProfile(user.id);
      if (profile) {
        this.form.patchValue({
          email: profile.email,
          display_name: profile.display_name || '',
          bio: profile.bio || '',
        });
        if (profile.avatar_url) {
          this.avatarUrl.set(profile.avatar_url);
        }
      }
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      this.loading.set(false);
    }
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = this.storage.validateAvatar(file);
    if (error) {
      this.toast.error(error);
      return;
    }

    this.selectedAvatarFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  async onSubmit() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving.set(true);

    try {
      const updates: Record<string, unknown> = {
        display_name: this.form.value.display_name,
        bio: this.form.value.bio,
      };

      const file = this.selectedAvatarFile();
      if (file) {
        const ext = file.name.split('.').pop() || 'png';
        const path = `${user.id}/avatar.${ext}`;
        const { publicUrl } = await this.storage.upload({
          bucket: 'avatars',
          path,
          file,
          upsert: true,
        });
        updates['avatar_url'] = publicUrl;
      }

      await this.profileService.updateProfile(user.id, updates);

      if (updates['avatar_url']) {
        this.avatarUrl.set(updates['avatar_url'] as string);
        this.avatarPreview.set(null);
        this.selectedAvatarFile.set(null);
      }

      this.toast.success('Profile updated!');
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      this.saving.set(false);
    }
  }
}
