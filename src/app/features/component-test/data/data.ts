import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  computed,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { PageEvent } from '@angular/material/paginator';
import { ToastService, LoadingSpinner, DataTable, SearchInput, ColumnDef } from '@shared';
import { AuthService, extractErrorMessage } from '@core';
import { environment } from '@env';
import { NotesService, Note } from '../../notes/notes';

@Component({
  selector: 'app-data',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatCardModule, LoadingSpinner, DataTable, SearchInput],
  template: `
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
    .section {
      margin-bottom: 24px;
      max-width: 600px;
    }
    .section-wide {
      max-width: 900px;
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
export class Data implements OnInit {
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
    if (this.auth.currentUser()) {
      this.loadNotes();
    }
  }

  async loadNotes() {
    this.notesLoading.set(true);
    try {
      const page = this.pageIndex() + 1;
      const response = await this.notesService.list(page, this.pageSize(), this.searchValue());
      this.notes.set(response.data);
      this.totalNotes.set(response.count);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load notes'));
    } finally {
      this.notesLoading.set(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.loadNotes();
  }

  onSearch(value: string) {
    this.searchValue.set(value);
    this.pageIndex.set(0);
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
