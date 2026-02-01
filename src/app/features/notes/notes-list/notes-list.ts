import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { NotesService, type Note } from '../notes';
import { NotesStore } from '../notes-store';
import { NoteCardSkeleton } from '../note-card-skeleton';
import { ToastService, ConfirmDialogService, EmptyState, TimeAgoPipe } from '@shared';
import { environment } from '@env';

@Component({
  selector: 'app-notes-list',
  standalone: true,
  imports: [
    TimeAgoPipe,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    NoteCardSkeleton,
    EmptyState,
  ],
  template: `
    <div class="page-header">
      <h1>Notes</h1>
      <button mat-raised-button color="primary" (click)="createNote()">
        <mat-icon>add</mat-icon>
        New Note
      </button>
    </div>

    <mat-form-field appearance="outline" class="search-field">
      <mat-label>Search notes</mat-label>
      <input
        matInput
        [(ngModel)]="searchQuery"
        (keyup.enter)="search()"
        placeholder="Search by title..."
      />
      <button mat-icon-button matSuffix (click)="search()">
        <mat-icon>search</mat-icon>
      </button>
    </mat-form-field>

    @if (loading()) {
      <div class="notes-grid">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <app-note-card-skeleton />
        }
      </div>
    } @else if (notes().length === 0) {
      <app-empty-state
        icon="note"
        title="No notes yet"
        message="Create your first note to get started"
      >
        <button mat-raised-button color="primary" (click)="createNote()">Create Note</button>
      </app-empty-state>
    } @else {
      <div class="notes-grid">
        @for (note of notes(); track note.id) {
          <mat-card class="note-card">
            <mat-card-header>
              <mat-card-title>{{ note.title }}</mat-card-title>
              <mat-card-subtitle>{{ note.created_at | timeAgo }}</mat-card-subtitle>
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
        [pageSizeOptions]="pageSizeOptions"
        (page)="onPageChange($event)"
        showFirstLastButtons
      >
      </mat-paginator>
    }
  `,
  styles: `
    .search-field {
      width: 100%;
      max-width: 400px;
      margin-bottom: 24px;
    }
    .notes-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
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
  `,
})
export class NotesList implements OnInit {
  private notesService = inject(NotesService);
  private store = inject(NotesStore);
  private router = inject(Router);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  // Delegate to store
  notes = this.store.allNotes;
  loading = this.store.isLoading;
  totalCount = this.store.total;

  currentPage = signal(1);
  pageSize = environment.pagination.defaultPageSize;
  pageSizeOptions = environment.pagination.pageSizeOptions;
  searchQuery = '';

  async ngOnInit() {
    // Skip fetch if store has fresh data and no search
    if (!this.store.isEmpty() && !this.store.isStale() && !this.searchQuery) {
      this.pageSize = this.store.currentPageSize();
      this.currentPage.set(this.store.currentPage());
      return;
    }
    await this.loadNotes();
  }

  async loadNotes() {
    this.store.setLoading(true);
    try {
      const response = await this.notesService.list(
        this.currentPage(),
        this.pageSize,
        this.searchQuery,
      );
      this.store.setNotes(response.data, response.count, this.pageSize, this.currentPage());
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to load notes');
    } finally {
      this.store.setLoading(false);
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
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await this.notesService.delete(note.id);
        this.store.removeNote(note.id);
        this.toast.success('Note deleted');
      } catch (err) {
        this.toast.error(err instanceof Error ? err.message : 'Failed to delete note');
        this.loadNotes(); // Refetch on error
      }
    }
  }
}
