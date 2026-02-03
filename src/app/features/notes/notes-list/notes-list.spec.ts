import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { NotesList } from './notes-list';
import { NotesService, Note } from '../notes';
import { NotesStore } from '../notes-store';
import { ToastService, ConfirmDialogService } from '@shared';

describe('NotesList', () => {
  let component: NotesList;
  let fixture: ComponentFixture<NotesList>;
  let router: Router;
  let notesServiceMock: any;
  let notesStoreMock: any;
  let toastMock: any;
  let confirmDialogMock: any;

  const mockNotes: Note[] = [
    {
      id: '1',
      user_id: 'u1',
      title: 'Note 1',
      content: 'Content 1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: '2',
      user_id: 'u1',
      title: 'Note 2',
      content: 'Content 2',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(async () => {
    notesServiceMock = {
      list: vi.fn().mockResolvedValue({ data: mockNotes, count: 2 }),
      delete: vi.fn().mockResolvedValue(undefined),
    };

    notesStoreMock = {
      allNotes: signal(mockNotes),
      isLoading: signal(false),
      total: signal(2),
      currentPageSize: signal(10),
      currentPage: signal(1),
      isEmpty: vi.fn().mockReturnValue(false),
      isStale: vi.fn().mockReturnValue(true),
      setLoading: vi.fn(),
      setNotes: vi.fn(),
      removeNote: vi.fn(),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    confirmDialogMock = {
      confirm: vi.fn().mockResolvedValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [NotesList, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: NotesService, useValue: notesServiceMock },
        { provide: NotesStore, useValue: notesStoreMock },
        { provide: ToastService, useValue: toastMock },
        { provide: ConfirmDialogService, useValue: confirmDialogMock },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(NotesList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  describe('initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should load notes on init when store is stale', async () => {
      expect(notesServiceMock.list).toHaveBeenCalled();
    });

    it('should not load notes when store has fresh data', async () => {
      notesStoreMock.isEmpty.mockReturnValue(false);
      notesStoreMock.isStale.mockReturnValue(false);
      notesServiceMock.list.mockClear();

      const freshFixture = TestBed.createComponent(NotesList);
      await freshFixture.whenStable();

      expect(notesServiceMock.list).not.toHaveBeenCalled();
    });
  });

  describe('display', () => {
    it('should display notes when available', () => {
      fixture.detectChanges();
      const cards = fixture.nativeElement.querySelectorAll('mat-card.note-card');
      expect(cards.length).toBe(2);
    });

    it('should show note titles', () => {
      fixture.detectChanges();
      const titles = fixture.nativeElement.querySelectorAll('mat-card-title');
      expect(titles[0].textContent).toContain('Note 1');
      expect(titles[1].textContent).toContain('Note 2');
    });

    it('should show empty state when no notes', async () => {
      notesStoreMock.allNotes = signal([]);
      notesStoreMock.isEmpty.mockReturnValue(true);

      const emptyFixture = TestBed.createComponent(NotesList);
      await emptyFixture.whenStable();
      emptyFixture.detectChanges();

      const emptyState = emptyFixture.nativeElement.querySelector('app-empty-state');
      expect(emptyState).toBeTruthy();
    });

    it('should show skeleton loaders when loading', async () => {
      notesStoreMock.isLoading = signal(true);

      const loadingFixture = TestBed.createComponent(NotesList);
      await loadingFixture.whenStable();
      loadingFixture.detectChanges();

      const skeletons = loadingFixture.nativeElement.querySelectorAll('app-note-card-skeleton');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('navigation', () => {
    it('should navigate to new note form when createNote is called', () => {
      component.createNote();
      expect(router.navigate).toHaveBeenCalledWith(['/notes/new']);
    });

    it('should navigate to edit form when editNote is called', () => {
      component.editNote('note-123');
      expect(router.navigate).toHaveBeenCalledWith(['/notes', 'note-123', 'edit']);
    });
  });

  describe('search', () => {
    it('should reset to page 1 when searching', () => {
      component.currentPage.set(3);
      component.searchQuery = 'test';
      component.search();

      expect(component.currentPage()).toBe(1);
    });

    it('should call loadNotes when searching', () => {
      component.searchQuery = 'test';
      component.search();

      expect(notesStoreMock.setLoading).toHaveBeenCalledWith(true);
    });
  });

  describe('pagination', () => {
    it('should update page on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 10, length: 100 });
      expect(component.currentPage()).toBe(3); // pageIndex is 0-based
    });

    it('should update pageSize on page change', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 25, length: 100 });
      expect(component.pageSize()).toBe(25);
    });
  });

  describe('delete', () => {
    it('should show confirm dialog before deleting', async () => {
      await component.deleteNote(mockNotes[0]);
      expect(confirmDialogMock.confirm).toHaveBeenCalledWith({
        title: 'Delete Note',
        message: expect.stringContaining('Note 1'),
        confirmText: 'Delete',
        cancelText: 'Cancel',
      });
    });

    it('should not delete when user cancels', async () => {
      confirmDialogMock.confirm.mockResolvedValue(false);
      await component.deleteNote(mockNotes[0]);

      expect(notesServiceMock.delete).not.toHaveBeenCalled();
    });

    it('should delete and show success when confirmed', async () => {
      confirmDialogMock.confirm.mockResolvedValue(true);
      await component.deleteNote(mockNotes[0]);

      expect(notesServiceMock.delete).toHaveBeenCalledWith('1');
      expect(notesStoreMock.removeNote).toHaveBeenCalledWith('1');
      expect(toastMock.success).toHaveBeenCalledWith('Note deleted');
    });

    it('should show error toast when delete fails', async () => {
      confirmDialogMock.confirm.mockResolvedValue(true);
      notesServiceMock.delete.mockRejectedValue(new Error('Delete failed'));

      await component.deleteNote(mockNotes[0]);

      expect(toastMock.error).toHaveBeenCalledWith('Delete failed');
    });
  });

  describe('error handling', () => {
    it('should show error toast when loading fails', async () => {
      notesServiceMock.list.mockRejectedValue(new Error('Load failed'));

      await component.loadNotes();

      expect(toastMock.error).toHaveBeenCalledWith('Load failed');
    });

    it('should set loading to false after error', async () => {
      notesServiceMock.list.mockRejectedValue(new Error('Load failed'));

      await component.loadNotes();

      expect(notesStoreMock.setLoading).toHaveBeenCalledWith(false);
    });
  });
});
