import { Injectable, signal, computed } from '@angular/core';
import { Note } from '../../core/notes';

@Injectable({
  providedIn: 'root'
})
export class NotesStore {
  private notes = signal<Note[]>([]);
  private loading = signal(false);
  private lastFetch = signal<Date | null>(null);
  private totalCount = signal(0);
  private pageSize = signal(10);
  private page = signal(1);

  // Public readonly access
  readonly allNotes = this.notes.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly currentPageSize = this.pageSize.asReadonly();
  readonly currentPage = this.page.asReadonly();

  // Computed values
  readonly noteCount = computed(() => this.notes().length);
  readonly isEmpty = computed(() => this.notes().length === 0);

  // Check if cache is stale (older than 5 minutes)
  readonly isStale = computed(() => {
    const last = this.lastFetch();
    if (!last) return true;
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() - last.getTime() > fiveMinutes;
  });

  setNotes(notes: Note[], total: number, pageSize: number, page: number) {
    this.notes.set(notes);
    this.totalCount.set(total);
    this.pageSize.set(pageSize);
    this.page.set(page);
    this.lastFetch.set(new Date());
  }

  addNote(note: Note) {
    this.notes.update(notes => [note, ...notes]);
    this.totalCount.update(count => count + 1);
  }

  updateNote(updated: Note) {
    this.notes.update(notes =>
      notes.map(n => n.id === updated.id ? updated : n)
    );
  }

  removeNote(id: string) {
    this.notes.update(notes => notes.filter(n => n.id !== id));
    this.totalCount.update(count => count - 1);
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.notes.set([]);
    this.lastFetch.set(null);
  }
}