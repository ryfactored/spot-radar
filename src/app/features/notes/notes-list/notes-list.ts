import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NotesService, Note } from '../../../core/notes';
import { ToastService } from '../../../shared/toast';
import { ConfirmDialogService } from '../../../shared/confirm-dialog';
import { LoadingSpinner } from '../../../shared/loading-spinner/loading-spinner';
import { EmptyState } from '../../../shared/empty-state/empty-state';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    LoadingSpinner,
    EmptyState,
  ],
  template: `
    <div class="header">
      <h1>Notes</h1>
      <button mat-raised-button color="primary" (click)="createNote()">
        <mat-icon>add</mat-icon>
        New Note
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search notes</mat-label>
      <input matInput [(ngModel)]="searchQuery" (keyup.enter)="search()" placeholder="Search by title...">
      <button mat-icon-button matSuffix (click)="search()">
        <mat-icon>search</mat-icon>
      </button>
    </mat-form-field>

    @if (loading()) {
      <app-loading-spinner message="Loading notes..." />
    } @else if (notes().length === 0) {
      <app-empty-state
        icon="note"
        title="No notes yet"
        message="Create your first note to get started">
        <button mat-raised-button color="primary" (click)="createNote()">
          Create Note
        </button>
      </app-empty-state>
    } @else {
      <div class="notes-grid">
        @for (note of notes(); track note.id) {
          <mat-card class="note-card">
            <mat-card-header>
              <mat-card-title>{{ note.title }}</mat-card-title>
              <mat-card-subtitle>{{ note.created_at | date:'medium' }}</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              <p>{{ note.content || 'No content' }}</p>
            </mat-card-content>
            <mat-card-actions align="end">
              <button mat-button (click)="editNote(note.id)">
                <mat-icon>edit</mat-icon>
                Edit
              </button>
              <button mat-button color="warn" (click)="deleteNote(note)">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>

      <mat-paginator
        [length]="totalCount()"
        [pageSize]="pageSize"
        [pageIndex]="currentPage() - 1"
        [pageSizeOptions]="[5, 10, 25]"
        (page)="onPageChange($event)"
        showFirstLastButtons>
      </mat-paginator>
    }
  `,
  styles: `
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .search-field {
      width: 100%;
      max-width: 400px;
      margin-bottom: 24px;
    }
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .note-card {
      cursor: pointer;
    }
    .note-card mat-card-content p {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
    }
  `
})
export class NotesList implements OnInit {
  private notesService = inject(NotesService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  notes = signal<Note[]>([]);
  loading = signal(true);
  totalCount = signal(0);
  currentPage = signal(1);
  pageSize = 10;
  searchQuery = '';

  async ngOnInit() {
    await this.loadNotes();
  }

  async loadNotes() {
    this.loading.set(true);
    try {
      const response = await this.notesService.list(
        this.currentPage(),
        this.pageSize,
        this.searchQuery
      );
      this.notes.set(response.data);
      this.totalCount.set(response.count);
    } catch (err: any) {
      this.toast.error(err.message || 'Failed to load notes');
    } finally {
      this.loading.set(false);
    }
  }

  search() {
    this.currentPage.set(1);
    this.loadNotes();
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    this.loadNotes();
  }

  createNote() {
    this.router.navigate(['/notes/new']);
  }

  editNote(id: string) {
    this.router.navigate(['/notes', id, 'edit']);
  }

  async deleteNote(note: Note) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Note',
      message: `Are you sure you want to delete "${note.title}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      try {
        await this.notesService.delete(note.id);
        this.toast.success('Note deleted');
        this.loadNotes();
      } catch (err: any) {
        this.toast.error(err.message || 'Failed to delete note');
      }
    }
  }
}