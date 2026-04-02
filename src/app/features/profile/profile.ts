import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AuthService, HasUnsavedChanges, StorageService, extractErrorMessage } from '@core';
import {
  Avatar,
  ConfirmDialogService,
  PasswordStrength,
  SkeletonOverlay,
  ToastService,
  matchValidator,
} from '@shared';
import { ProfileService } from './profile-service';
import { ProfileStore } from './profile-store';
import { environment } from '@env';

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    SkeletonOverlay,
    Avatar,
    PasswordStrength,
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
            <app-avatar
              [src]="avatarPreview() || profileStore.avatarUrl()"
              [name]="form.value.display_name"
              [size]="100"
            />
            <div class="avatar-overlay">
              <mat-icon>photo_camera</mat-icon>
            </div>
          </div>
          <input
            #avatarInput
            type="file"
            [accept]="avatarAccept"
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

    @if (isEmailUser()) {
      <mat-card class="password-card">
        <mat-card-header>
          <mat-card-title>Change Password</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="passwordForm" (ngSubmit)="onChangePassword()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>New Password</mat-label>
              <input
                matInput
                formControlName="password"
                [type]="showPassword() ? 'text' : 'password'"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="showPassword.set(!showPassword())"
                [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
              >
                <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (passwordForm.controls.password.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
              @if (passwordForm.controls.password.hasError('minlength')) {
                <mat-error>
                  Password must be at least {{ passwordMinLength }} characters
                </mat-error>
              }
            </mat-form-field>
            <app-password-strength [password]="passwordValue()" />

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Confirm New Password</mat-label>
              <input
                matInput
                formControlName="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
              />
              <button
                mat-icon-button
                matSuffix
                type="button"
                (click)="showConfirmPassword.set(!showConfirmPassword())"
                [attr.aria-label]="showConfirmPassword() ? 'Hide password' : 'Show password'"
              >
                <mat-icon>{{ showConfirmPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (passwordForm.controls.confirmPassword.hasError('required')) {
                <mat-error>Please confirm your password</mat-error>
              }
              @if (passwordForm.controls.confirmPassword.hasError('mismatch')) {
                <mat-error>Passwords do not match</mat-error>
              }
            </mat-form-field>

            <button mat-raised-button color="primary" type="submit" [disabled]="changingPassword()">
              {{ changingPassword() ? 'Changing...' : 'Change Password' }}
            </button>
          </form>
        </mat-card-content>
      </mat-card>
    }

    <mat-card class="danger-card">
      <mat-card-header>
        <mat-card-title>Danger Zone</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p class="danger-description">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          mat-raised-button
          class="delete-button"
          (click)="onDeleteAccount()"
          [disabled]="deleting()"
        >
          {{ deleting() ? 'Deleting...' : 'Delete Account' }}
        </button>
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
      --mdc-elevated-card-container-color: rgba(25, 25, 29, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-radius: 0.75rem;
      border: 1px solid rgba(72, 72, 71, 0.15);
      box-shadow: none;
    }
    .avatar-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      margin-bottom: 24px;
    }
    .avatar-wrapper {
      position: relative;
      width: 106px;
      height: 106px;
      border-radius: 50%;
      cursor: pointer;
      background: linear-gradient(135deg, #ba9eff, #8553f3);
      padding: 3px;
      box-sizing: border-box;
    }
    .avatar-wrapper app-avatar,
    .avatar-wrapper ::ng-deep img,
    .avatar-wrapper ::ng-deep .avatar-fallback {
      border-radius: 50%;
    }
    .avatar-overlay {
      position: absolute;
      top: 3px;
      left: 3px;
      width: calc(100% - 6px);
      height: calc(100% - 6px);
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
      border-radius: 50%;
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
      color: #acaaae;
    }
    .password-card {
      margin-top: 24px;
    }
    .danger-card {
      margin-top: 24px;
      --mdc-elevated-card-container-color: rgba(255, 110, 132, 0.06);
      border: 1px solid rgba(72, 72, 71, 0.15);
    }
    .danger-card mat-card-title {
      color: #ff6e84;
    }
    .danger-description {
      margin-bottom: 16px;
      color: #acaaae;
    }
    .delete-button {
      background-color: rgba(255, 110, 132, 0.1) !important;
      color: #ff6e84 !important;
    }
    button[mat-raised-button][color='primary'] {
      background: linear-gradient(135deg, #ba9eff, #8553f3) !important;
      color: #000 !important;
    }
  `,
})
export class Profile implements OnInit, HasUnsavedChanges {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  profileStore = inject(ProfileStore);
  private storage = inject(StorageService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  readonly loading = this.profileStore.isLoading;
  saving = signal(false);
  changingPassword = signal(false);
  deleting = signal(false);
  avatarPreview = signal<string | null>(null);
  selectedAvatarFile = signal<File | null>(null);
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  passwordValue = signal('');
  passwordMinLength = environment.passwordMinLength;
  avatarAccept = environment.upload.avatarTypes.join(',');
  isEmailUser = computed(() => this.auth.currentUser()?.app_metadata?.['provider'] === 'email');

  form = this.fb.nonNullable.group({
    email: [{ value: '', disabled: true }],
    display_name: ['', [Validators.maxLength(100)]],
    bio: ['', [Validators.maxLength(500)]],
  });

  passwordForm = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required, Validators.minLength(environment.passwordMinLength)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchValidator('password', 'confirmPassword') },
  );

  constructor() {
    this.passwordForm.controls.password.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.passwordValue.set(value));

    inject(DestroyRef).onDestroy(() => this.revokeAvatarPreview());
  }

  hasUnsavedChanges(): boolean {
    return this.form.dirty && !this.saving();
  }

  async ngOnInit() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.profileStore.setLoading(true);
    try {
      const profile = await this.profileService.getProfile(user.id);
      this.profileStore.setProfile(profile);
      if (profile) {
        this.form.patchValue({
          email: profile.email,
          display_name: profile.display_name || '',
          bio: profile.bio || '',
        });
      }
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load profile'));
    } finally {
      this.profileStore.setLoading(false);
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

    this.revokeAvatarPreview();
    this.selectedAvatarFile.set(file);
    this.avatarPreview.set(URL.createObjectURL(file));
  }

  private revokeAvatarPreview() {
    const url = this.avatarPreview();
    if (url) URL.revokeObjectURL(url);
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
        const ext = this.storage.getExtensionFromMime(file.type);
        const path = `${user.id}/avatar.${ext}`;
        const { publicUrl } = await this.storage.upload({
          bucket: environment.storageBuckets.avatars,
          path,
          file,
          upsert: true,
        });
        updates['avatar_url'] = publicUrl;
      }

      const result = await this.profileService.updateProfile(user.id, updates);
      this.profileStore.setProfile(result);

      if (updates['avatar_url']) {
        // Bust browser cache: the storage URL doesn't change on upsert,
        // so the browser would serve the cached old image without this.
        this.profileStore.setAvatarUrl(`${updates['avatar_url']}?t=${Date.now()}`);
        this.revokeAvatarPreview();
        this.avatarPreview.set(null);
        this.selectedAvatarFile.set(null);
      }

      this.form.markAsPristine();
      this.toast.success('Profile updated!');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to save profile'));
    } finally {
      this.saving.set(false);
    }
  }

  async onChangePassword() {
    if (this.passwordForm.invalid) return;

    this.changingPassword.set(true);
    try {
      await this.auth.updatePassword(this.passwordForm.value.password!);
      this.toast.success('Password changed successfully');
      this.passwordForm.reset();
      this.passwordValue.set('');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to change password'));
    } finally {
      this.changingPassword.set(false);
    }
  }

  async onDeleteAccount() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Account',
      message:
        'This will permanently delete your profile, notes, messages, and files. This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (!confirmed) return;

    this.deleting.set(true);
    try {
      await this.profileService.deleteAccount();
      this.profileStore.clear();
      await this.auth.signOut();
      this.toast.info('Your account has been permanently deleted');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to delete account'));
      this.deleting.set(false);
    }
  }
}
