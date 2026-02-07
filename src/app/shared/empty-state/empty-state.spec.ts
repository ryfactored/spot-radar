import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';

import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  let component: EmptyState;
  let fixture: ComponentFixture<EmptyState>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyState);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have default icon of inbox', () => {
      expect(component.icon()).toBe('inbox');
    });

    it('should have default title of No items', () => {
      expect(component.title()).toBe('No items');
    });

    it('should have default empty message', () => {
      expect(component.message()).toBe('');
    });
  });

  describe('rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render the icon', () => {
      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('inbox');
    });

    it('should render the title', () => {
      const title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent.trim()).toBe('No items');
    });

    it('should not render message paragraph when message is empty', () => {
      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph).toBeNull();
    });

    it('should render message paragraph when message is provided', () => {
      fixture.componentRef.setInput('message', 'No data available');
      fixture.detectChanges();
      const paragraph = fixture.nativeElement.querySelector('p');
      expect(paragraph.textContent.trim()).toBe('No data available');
    });
  });

  describe('custom inputs', () => {
    it('should render custom icon', () => {
      fixture.componentRef.setInput('icon', 'folder_open');
      fixture.detectChanges();
      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.textContent.trim()).toBe('folder_open');
    });

    it('should render custom title', () => {
      fixture.componentRef.setInput('title', 'No files found');
      fixture.detectChanges();
      const title = fixture.nativeElement.querySelector('h3');
      expect(title.textContent.trim()).toBe('No files found');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have role="status" on container', () => {
      const container = fixture.nativeElement.querySelector('.empty-state');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('should hide icon from screen readers', () => {
      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });
});

describe('EmptyState with content projection', () => {
  @Component({
    imports: [EmptyState],
    template: `
      <app-empty-state icon="search" title="No results" message="Try a different search">
        <button>Clear search</button>
      </app-empty-state>
    `,
  })
  class TestHost {}

  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('should project action buttons into actions slot', () => {
    const button = fixture.nativeElement.querySelector('.actions button');
    expect(button).toBeTruthy();
    expect(button.textContent.trim()).toBe('Clear search');
  });

  it('should render all custom inputs', () => {
    const icon = fixture.nativeElement.querySelector('mat-icon');
    const title = fixture.nativeElement.querySelector('h3');
    const message = fixture.nativeElement.querySelector('p');

    expect(icon.textContent.trim()).toBe('search');
    expect(title.textContent.trim()).toBe('No results');
    expect(message.textContent.trim()).toBe('Try a different search');
  });
});
