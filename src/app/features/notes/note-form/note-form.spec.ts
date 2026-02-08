import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NoteForm } from './note-form';
import { NotesService } from '../notes';
import { NotesStore } from '../notes-store';
import { ToastService } from '@shared';

describe('NoteForm', () => {
  let notesServiceMock: any;
  let notesStoreMock: any;
  let toastMock: any;

  beforeEach(() => {
    notesServiceMock = {
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: '1', title: 'Test', content: '', user_id: 'u1' }),
      update: vi
        .fn()
        .mockResolvedValue({ id: 'note-1', title: 'Updated', content: 'body', user_id: 'u1' }),
    };

    notesStoreMock = {
      addNote: vi.fn(),
      updateNote: vi.fn(),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };
  });

  describe('create mode', () => {
    let component: NoteForm;
    let fixture: ComponentFixture<NoteForm>;
    let router: Router;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [NoteForm, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          { provide: NotesService, useValue: notesServiceMock },
          { provide: NotesStore, useValue: notesStoreMock },
          { provide: ToastService, useValue: toastMock },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(NoteForm);
      component = fixture.componentInstance;
      await fixture.whenStable();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should not be in edit mode', () => {
      expect(component.isEditMode()).toBe(false);
    });

    it('should require title', () => {
      component.form.controls.title.setValue('');
      expect(component.form.controls.title.hasError('required')).toBe(true);
    });

    it('should enforce title maxLength', () => {
      component.form.controls.title.setValue('a'.repeat(256));
      expect(component.form.controls.title.hasError('maxlength')).toBe(true);
    });

    it('should not call service when form is invalid', async () => {
      component.form.controls.title.setValue('');
      await component.onSubmit();
      expect(notesServiceMock.create).not.toHaveBeenCalled();
    });

    it('should create note on valid submit', async () => {
      component.form.patchValue({ title: 'My Note', content: 'Content' });

      await component.onSubmit();

      expect(notesServiceMock.create).toHaveBeenCalledWith({
        title: 'My Note',
        content: 'Content',
      });
      expect(notesStoreMock.addNote).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith('Note created');
      expect(router.navigate).toHaveBeenCalledWith(['/notes']);
    });

    it('should show error toast on submit failure', async () => {
      notesServiceMock.create.mockRejectedValue(new Error('Create failed'));
      component.form.patchValue({ title: 'My Note' });

      await component.onSubmit();

      expect(toastMock.error).toHaveBeenCalledWith('Create failed');
    });

    it('should set saving signal during submit', async () => {
      let resolveFn!: () => void;
      notesServiceMock.create.mockReturnValue(
        new Promise((resolve) => {
          resolveFn = () => resolve({ id: '1', title: 'Test' });
        }),
      );
      component.form.patchValue({ title: 'My Note' });

      const submitPromise = component.onSubmit();
      expect(component.saving()).toBe(true);

      resolveFn();
      await submitPromise;
      expect(component.saving()).toBe(false);
    });

    it('should navigate to /notes on cancel', () => {
      component.cancel();
      expect(router.navigate).toHaveBeenCalledWith(['/notes']);
    });

    it('should report no unsaved changes when pristine', () => {
      expect(component.hasUnsavedChanges()).toBe(false);
    });

    it('should report unsaved changes when dirty', () => {
      component.form.controls.title.setValue('something');
      component.form.controls.title.markAsDirty();
      expect(component.hasUnsavedChanges()).toBe(true);
    });

    it('should report no unsaved changes when saving', () => {
      component.form.controls.title.setValue('something');
      component.form.controls.title.markAsDirty();
      component.saving.set(true);
      expect(component.hasUnsavedChanges()).toBe(false);
    });
  });

  describe('edit mode', () => {
    let component: NoteForm;
    let fixture: ComponentFixture<NoteForm>;
    let router: Router;

    const existingNote = {
      id: 'note-1',
      user_id: 'u1',
      title: 'Existing Title',
      content: 'Existing content',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    beforeEach(async () => {
      notesServiceMock.get.mockResolvedValue(existingNote);

      await TestBed.configureTestingModule({
        imports: [NoteForm, NoopAnimationsModule],
        providers: [
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: { paramMap: convertToParamMap({ id: 'note-1' }) },
            },
          },
          { provide: NotesService, useValue: notesServiceMock },
          { provide: NotesStore, useValue: notesStoreMock },
          { provide: ToastService, useValue: toastMock },
        ],
      }).compileComponents();

      router = TestBed.inject(Router);
      vi.spyOn(router, 'navigate').mockResolvedValue(true);

      fixture = TestBed.createComponent(NoteForm);
      component = fixture.componentInstance;
      await component.ngOnInit();
      await fixture.whenStable();
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode()).toBe(true);
      expect(component.noteId()).toBe('note-1');
    });

    it('should load and patch form with note data', () => {
      expect(notesServiceMock.get).toHaveBeenCalledWith('note-1');
      expect(component.form.value.title).toBe('Existing Title');
      expect(component.form.value.content).toBe('Existing content');
    });

    it('should show error and navigate on load failure', async () => {
      notesServiceMock.get.mockRejectedValue(new Error('Not found'));

      await component.loadNote('bad-id');

      expect(toastMock.error).toHaveBeenCalledWith('Not found');
      expect(router.navigate).toHaveBeenCalledWith(['/notes']);
    });

    it('should update note on submit', async () => {
      component.form.patchValue({ title: 'Updated Title', content: 'Updated content' });

      await component.onSubmit();

      expect(notesServiceMock.update).toHaveBeenCalledWith('note-1', {
        title: 'Updated Title',
        content: 'Updated content',
      });
      expect(notesStoreMock.updateNote).toHaveBeenCalled();
      expect(toastMock.success).toHaveBeenCalledWith('Note updated');
      expect(router.navigate).toHaveBeenCalledWith(['/notes']);
    });
  });
});
