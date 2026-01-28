import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { NotesService } from '../notes';
import { NotesStore } from '../notes-store';
import { ToastService, LoadingSpinner } from '@shared';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    LoadingSpinner,
  ],
  template: `
    <h1>{{ isEditMode() ? 'Edit Note' : 'New Note' }}</h1>

    @if (loading()) {
      <app-loading-spinner message="Loading..." />
    } @else {
      <mat-card class="form-card">
        <mat-card-content>
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Title</mat-label>
              <input matInput formControlName="title" placeholder="Enter note title" />
              @if (form.controls.title.hasError('required')) {
                <mat-error>Title is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Content</mat-label>
              <textarea
                matInput
                formControlName="content"
                rows="6"
                placeholder="Enter note content"
              ></textarea>
            </mat-form-field>

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="saving()">
                {{ saving() ? 'Saving...' : isEditMode() ? 'Update' : 'Create' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: `
    .form-card {
      max-width: 600px;
    }
    .full-width {
      width: 100%;
    }
    mat-form-field {
      margin-bottom: 16px;
    }
    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `,
})
export class NoteForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notesService = inject(NotesService);
  private store = inject(NotesStore);
  private toast = inject(ToastService);

  loading = signal(false);
  saving = signal(false);
  isEditMode = signal(false);
  noteId: string | null = null;

  form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    content: [''],
  });

  async ngOnInit() {
    this.noteId = this.route.snapshot.paramMap.get('id');

    if (this.noteId) {
      this.isEditMode.set(true);
      await this.loadNote(this.noteId);
    }
  }

  async loadNote(id: string) {
    this.loading.set(true);
    try {
      const note = await this.notesService.get(id);
      if (note) {
        this.form.patchValue({
          title: note.title,
          content: note.content || '',
        });
      }
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to load note');
      this.router.navigate(['/notes']);
    } finally {
      this.loading.set(false);
    }
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.saving.set(true);
    try {
      if (this.isEditMode() && this.noteId) {
        const updated = await this.notesService.update(this.noteId, this.form.getRawValue());
        this.store.updateNote(updated);
        this.toast.success('Note updated');
      } else {
        const created = await this.notesService.create(this.form.getRawValue());
        this.store.addNote(created);
        this.toast.success('Note created');
      }
      this.router.navigate(['/notes']);
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      this.saving.set(false);
    }
  }

  cancel() {
    this.router.navigate(['/notes']);
  }
}
