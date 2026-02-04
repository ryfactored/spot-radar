import { Injectable, signal, computed } from '@angular/core';
import { environment } from '@env';
import { Note } from './notes';

@Injectable({
  providedIn: 'root',
})
export class NotesStore {
  #notes = signal<Note[]>([]);
  #loading = signal(false);
  #lastFetch = signal<Date | null>(null);
  #totalCount = signal(0);
  #pageSize = signal(environment.pagination.defaultPageSize);
  #page = signal(1);

  // Public readonly access
  readonly allNotes = this.#notes.asReadonly();
  readonly isLoading = this.#loading.asReadonly();
  readonly total = this.#totalCount.asReadonly();
  readonly currentPageSize = this.#pageSize.asReadonly();
  readonly currentPage = this.#page.asReadonly();

  // Computed values
  readonly isEmpty = computed(() => this.#notes().length === 0);

  // Check if cache is stale (based on environment.cacheTtlMinutes)
  readonly isStale = computed(() => {
    const last = this.#lastFetch();
    if (!last) return true;
    const ttl = environment.cacheTtlMinutes * 60 * 1000;
    return Date.now() - last.getTime() > ttl;
  });

  setNotes(notes: Note[], total: number, pageSize: number, page: number) {
    this.#notes.set(notes);
    this.#totalCount.set(total);
    this.#pageSize.set(pageSize);
    this.#page.set(page);
    this.#lastFetch.set(new Date());
  }

  addNote(note: Note) {
    this.#notes.update((notes) => [note, ...notes]);
    this.#totalCount.update((count) => count + 1);
  }

  updateNote(updated: Note) {
    this.#notes.update((notes) => notes.map((n) => (n.id === updated.id ? updated : n)));
  }

  removeNote(id: string) {
    this.#notes.update((notes) => notes.filter((n) => n.id !== id));
    this.#totalCount.update((count) => count - 1);
  }

  setLoading(loading: boolean) {
    this.#loading.set(loading);
  }

  clear() {
    this.#notes.set([]);
    this.#lastFetch.set(null);
  }
}
