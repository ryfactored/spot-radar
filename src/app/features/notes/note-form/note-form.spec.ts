import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { NoteForm } from './note-form';
import { NotesService } from '../notes';
import { NotesStore } from '../notes-store';
import { ToastService } from '@shared';

describe('NoteForm', () => {
  let component: NoteForm;
  let fixture: ComponentFixture<NoteForm>;

  beforeEach(async () => {
    const notesServiceMock = {
      get: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: '1', title: 'Test', content: '' }),
      update: vi.fn().mockResolvedValue({ id: '1', title: 'Test', content: '' }),
    };

    const notesStoreMock = {
      addNote: vi.fn(),
      updateNote: vi.fn(),
    };

    const toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [NoteForm, NoopAnimationsModule],
      providers: [
        provideRouter([]),
        { provide: NotesService, useValue: notesServiceMock },
        { provide: NotesStore, useValue: notesStoreMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NoteForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
