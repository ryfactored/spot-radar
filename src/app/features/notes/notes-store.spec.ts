import { TestBed } from '@angular/core/testing';
import { NotesStore } from './notes-store';
import { Note } from './notes';

describe('NotesStore', () => {
  let store: NotesStore;

  const mockNote: Note = {
    id: '1',
    title: 'Test Note',
    content: 'Test content',
    user_id: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockNote2: Note = {
    id: '2',
    title: 'Second Note',
    content: 'More content',
    user_id: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(NotesStore);
  });

  it('should be created', () => {
    expect(store).toBeTruthy();
  });

  describe('initial state', () => {
    it('should start with empty notes', () => {
      expect(store.allNotes()).toEqual([]);
    });

    it('should start with loading false', () => {
      expect(store.isLoading()).toBe(false);
    });

    it('should start with total 0', () => {
      expect(store.total()).toBe(0);
    });

    it('should start with isEmpty true', () => {
      expect(store.isEmpty()).toBe(true);
    });

    it('should start with isStale true', () => {
      expect(store.isStale()).toBe(true);
    });
  });

  describe('setNotes', () => {
    it('should set notes array', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);

      expect(store.allNotes()).toEqual([mockNote, mockNote2]);
    });

    it('should set total count', () => {
      store.setNotes([mockNote], 50, 10, 1);

      expect(store.total()).toBe(50);
    });

    it('should set page size', () => {
      store.setNotes([mockNote], 50, 25, 1);

      expect(store.currentPageSize()).toBe(25);
    });

    it('should set current page', () => {
      store.setNotes([mockNote], 50, 10, 3);

      expect(store.currentPage()).toBe(3);
    });

    it('should update lastFetch making isStale false', () => {
      expect(store.isStale()).toBe(true);

      store.setNotes([mockNote], 1, 10, 1);

      expect(store.isStale()).toBe(false);
    });

    it('should update isEmpty to false when notes added', () => {
      expect(store.isEmpty()).toBe(true);

      store.setNotes([mockNote], 1, 10, 1);

      expect(store.isEmpty()).toBe(false);
    });
  });

  describe('addNote', () => {
    it('should prepend note to array', () => {
      store.setNotes([mockNote2], 1, 10, 1);
      store.addNote(mockNote);

      expect(store.allNotes()[0]).toEqual(mockNote);
      expect(store.allNotes()[1]).toEqual(mockNote2);
    });

    it('should increment total count', () => {
      store.setNotes([], 5, 10, 1);
      store.addNote(mockNote);

      expect(store.total()).toBe(6);
    });
  });

  describe('updateNote', () => {
    it('should update existing note by id', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);

      const updated: Note = { ...mockNote, title: 'Updated Title' };
      store.updateNote(updated);

      expect(store.allNotes()[0].title).toBe('Updated Title');
      expect(store.allNotes()[1]).toEqual(mockNote2);
    });

    it('should not affect other notes', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);

      const updated: Note = { ...mockNote, title: 'Updated' };
      store.updateNote(updated);

      expect(store.allNotes()[1]).toEqual(mockNote2);
    });
  });

  describe('removeNote', () => {
    it('should remove note by id', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);
      store.removeNote(mockNote.id);

      expect(store.allNotes()).toEqual([mockNote2]);
    });

    it('should decrement total count', () => {
      store.setNotes([mockNote, mockNote2], 10, 10, 1);
      store.removeNote(mockNote.id);

      expect(store.total()).toBe(9);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      store.setLoading(true);
      expect(store.isLoading()).toBe(true);
    });

    it('should set loading to false', () => {
      store.setLoading(true);
      store.setLoading(false);
      expect(store.isLoading()).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all notes', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);
      store.clear();

      expect(store.allNotes()).toEqual([]);
    });

    it('should reset isStale to true', () => {
      store.setNotes([mockNote], 1, 10, 1);
      expect(store.isStale()).toBe(false);

      store.clear();
      expect(store.isStale()).toBe(true);
    });
  });

  describe('computed values', () => {
    it('noteCount should return number of notes', () => {
      store.setNotes([mockNote, mockNote2], 2, 10, 1);
      expect(store.noteCount()).toBe(2);
    });

    it('isEmpty should return false when notes exist', () => {
      store.setNotes([mockNote], 1, 10, 1);
      expect(store.isEmpty()).toBe(false);
    });

    it('isEmpty should return true after clear', () => {
      store.setNotes([mockNote], 1, 10, 1);
      store.clear();
      expect(store.isEmpty()).toBe(true);
    });
  });
});
