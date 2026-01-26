import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { AuthService } from '@core';
import { SkeletonOverlay, ToastService } from '@shared';
import { ProfileService, type Profile as UserProfile } from './profile-service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    SkeletonOverlay,
  ],
  template: `
    <h1>Profile</h1>

    <mat-card [appSkeletonOverlay]="loading()">
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" readonly>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Display Name</mat-label>
            <input matInput formControlName="display_name">
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
    .full-width { width: 100%; }
    mat-form-field { margin-bottom: 16px; }
    mat-card { max-width: 500px; }
  `
})
export class Profile implements OnInit {
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private fb = inject(FormBuilder);
  private toast = inject(ToastService);

  loading = signal(true);
  saving = signal(false);

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
      }
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to load profile');
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    const user = this.auth.currentUser();
    if (!user) return;

    this.saving.set(true);

    try {
      await this.profileService.updateProfile(user.id, {
        display_name: this.form.value.display_name,
        bio: this.form.value.bio,
      });
      this.toast.success('Profile updated!');
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to save profile');
    } finally {
      this.saving.set(false);
    }
  }
}