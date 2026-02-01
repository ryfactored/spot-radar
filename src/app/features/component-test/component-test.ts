import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import {
  ConfirmDialogService,
  ToastService,
  LoadingSpinner,
  EmptyState,
  DataTable,
  SearchInput,
  ColumnDef,
  PageEvent,
} from '@shared';
import { AuthService } from '@core';
import { environment } from '@env';
import { NotesService, Note } from '../notes/notes';

@Component({
  selector: 'app-component-test',
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    LoadingSpinner,
    EmptyState,
    DataTable,
    SearchInput,
  ],
  template: `
    <h1>Shared Components</h1>
    <p class="subtitle">Test page for shared UI components</p>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Toast Notifications</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Display temporary notifications for user feedback.</p>
        <div class="button-row">
          <button mat-raised-button color="primary" (click)="showSuccess()">Success</button>
          <button mat-raised-button color="warn" (click)="showError()">Error</button>
          <button mat-raised-button color="accent" (click)="showInfo()">Info</button>
          <button mat-raised-button color="warn" (click)="testError()">Throw Error</button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Confirm Dialog</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Modal dialog for confirming destructive actions.</p>
        <div class="button-row">
          <button mat-raised-button color="warn" (click)="showConfirm()">Delete Something</button>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Loading Spinner</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Displays a loading indicator with optional message.</p>
        <div class="demo-box">
          <app-loading-spinner message="Loading data..." />
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Empty State</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Displays a friendly message when lists are empty.</p>
        <div class="demo-box">
          <app-empty-state
            icon="folder_open"
            title="No projects yet"
            message="Create your first project to get started"
          >
          </app-empty-state>
        </div>
      </mat-card-content>
    </mat-card>

    <mat-card class="section section-wide">
      <mat-card-header>
        <mat-card-title>Search Input</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Debounced search input with clear button. Type to see the debounced value.</p>
        <app-search-input
          placeholder="Search notes..."
          label="Search"
          [debounceMs]="searchDebounceMs"
          [loading]="searchLoading()"
          (searchChange)="onSearch($event)"
          (cleared)="onSearchCleared()"
        />
        <p class="search-result">
          <small>Debounced output:</small>
          @if (searchValue()) {
            <strong>{{ searchValue() }}</strong>
          } @else {
            <em>Type to see debounce in action...</em>
          }
        </p>
      </mat-card-content>
    </mat-card>

    <mat-card class="section section-wide">
      <mat-card-header>
        <mat-card-title>Data Table</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <p>Table with sorting, pagination, and row selection. Showing your notes.</p>
        <app-data-table
          [columns]="tableColumns"
          [data]="notes()"
          [selectable]="true"
          [paginate]="true"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          [totalItems]="totalNotes()"
          emptyMessage="No notes found. Create some notes first!"
          (rowClick)="onRowClick($event)"
          (selectionChange)="onSelectionChange($event)"
          (pageChange)="onPageChange($event)"
        />
        @if (notesLoading()) {
          <div class="loading-overlay">
            <app-loading-spinner message="Loading..." />
          </div>
        }
        @if (selectedNotes().length > 0) {
          <p class="selection-info">
            Selected {{ selectedNotes().length }} note(s):
            {{ selectedNoteTitles() }}
          </p>
        }
      </mat-card-content>
    </mat-card>
  `,
  styles: `
    .subtitle {
      color: var(--mat-card-subtitle-text-color, #666);
      margin-bottom: 24px;
    }
    .section {
      margin-bottom: 24px;
      max-width: 600px;
    }
    .section-wide {
      max-width: 900px;
    }
    .button-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .demo-box {
      background: var(--app-inset-bg, #f5f5f5);
      border-radius: 8px;
      margin-top: 16px;
    }
    .search-result {
      margin-top: 16px;
      padding: 12px;
      background: var(--app-inset-bg, #f5f5f5);
      border-radius: 4px;
    }
    .selection-info {
      margin-top: 16px;
      padding: 12px;
      background: var(--app-inset-bg, #e3f2fd);
      border-radius: 4px;
      color: var(--mat-card-subtitle-text-color, #1565c0);
    }
    .loading-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: color-mix(
        in srgb,
        var(--mat-card-elevated-container-color, white) 85%,
        transparent
      );
      display: flex;
      align-items: center;
      justify-content: center;
    }
    mat-card-content {
      position: relative;
    }
  `,
})
/**
 * Component showcase page for testing shared UI components.
 * Note: This page requires authentication as it loads user notes for the DataTable demo.
 * It should only be accessible under authenticated routes (Shell layout).
 */
export class ComponentTest implements OnInit {
  private confirmDialog = inject(ConfirmDialogService);
  private toast = inject(ToastService);
  private notesService = inject(NotesService);
  private router = inject(Router);
  private auth = inject(AuthService);

  searchDebounceMs = environment.searchDebounceMs;

  // Search state
  searchValue = signal('');
  searchLoading = signal(false);

  // Pagination state
  pageIndex = signal(0);
  pageSize = signal(5);
  totalNotes = signal(0);

  // Notes data
  notes = signal<Note[]>([]);
  notesLoading = signal(false);
  selectedNotes = signal<Note[]>([]);

  // Table columns for notes
  tableColumns: ColumnDef<Note>[] = [
    { key: 'title', header: 'Title' },
    {
      key: 'content',
      header: 'Content',
      cell: (note) =>
        note.content?.substring(0, 50) + (note.content && note.content.length > 50 ? '...' : '') ||
        '—',
    },
    {
      key: 'created_at',
      header: 'Created',
      cell: (note) => new Date(note.created_at).toLocaleDateString(),
    },
  ];

  selectedNoteTitles = computed(() =>
    this.selectedNotes()
      .map((n) => n.title)
      .join(', '),
  );

  ngOnInit() {
    // Only load notes if user is authenticated
    if (this.auth.currentUser()) {
      this.loadNotes();
    }
  }

  async loadNotes() {
    // Guard against unauthenticated access
    if (!this.auth.currentUser()) {
      return;
    }

    this.notesLoading.set(true);
    try {
      const page = this.pageIndex() + 1; // API is 1-indexed
      const response = await this.notesService.list(page, this.pageSize(), this.searchValue());
      this.notes.set(response.data);
      this.totalNotes.set(response.count);
    } catch (_error) {
      this.toast.error('Failed to load notes. Please ensure you are logged in.');
    } finally {
      this.notesLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadNotes();
  }

  showSuccess() {
    this.toast.success('Operation completed successfully!');
  }

  showError() {
    this.toast.error('Something went wrong. Please try again.');
  }

  showInfo() {
    this.toast.info('This is an informational message.');
  }

  async showConfirm() {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete Item',
      message: 'Are you sure you want to delete this item? This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      this.toast.success('Item deleted!');
    } else {
      this.toast.info('Cancelled');
    }
  }

  testError() {
    throw new Error('Test error!');
  }

  onSearch(value: string) {
    this.searchValue.set(value);
    this.pageIndex.set(0); // Reset to first page on search
    this.loadNotes();
  }

  onSearchCleared() {
    this.searchValue.set('');
    this.pageIndex.set(0);
    this.loadNotes();
  }

  onRowClick(note: Note) {
    this.router.navigate(['/notes', note.id, 'edit']);
  }

  onSelectionChange(notes: Note[]) {
    this.selectedNotes.set(notes);
  }
}
