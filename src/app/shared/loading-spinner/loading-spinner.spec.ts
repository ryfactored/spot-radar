import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { LoadingSpinner } from './loading-spinner';

describe('LoadingSpinner', () => {
  let component: LoadingSpinner;
  let fixture: ComponentFixture<LoadingSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinner],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have default diameter of 40', () => {
      expect(component.diameter()).toBe(40);
    });

    it('should have default empty message', () => {
      expect(component.message()).toBe('');
    });
  });

  describe('spinner rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should render mat-spinner with default diameter', () => {
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should apply custom diameter to spinner', () => {
      fixture.componentRef.setInput('diameter', 60);
      fixture.detectChanges();
      expect(component.diameter()).toBe(60);
    });
  });

  describe('message rendering', () => {
    it('should not render visible message paragraph when message is empty', () => {
      fixture.detectChanges();
      const paragraph = fixture.nativeElement.querySelector('p[aria-hidden="true"]');
      expect(paragraph).toBeNull();
    });

    it('should render visible message paragraph when message is provided', () => {
      fixture.componentRef.setInput('message', 'Loading data...');
      fixture.detectChanges();
      const paragraph = fixture.nativeElement.querySelector('p[aria-hidden="true"]');
      expect(paragraph.textContent.trim()).toBe('Loading data...');
    });
  });

  describe('accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have role="status" on container', () => {
      const container = fixture.nativeElement.querySelector('.loading-container');
      expect(container.getAttribute('role')).toBe('status');
    });

    it('should have aria-live="polite" on container', () => {
      const container = fixture.nativeElement.querySelector('.loading-container');
      expect(container.getAttribute('aria-live')).toBe('polite');
    });

    it('should hide spinner from screen readers', () => {
      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner.getAttribute('aria-hidden')).toBe('true');
    });

    it('should have visually hidden text for screen readers', () => {
      const hiddenText = fixture.nativeElement.querySelector('.visually-hidden');
      expect(hiddenText).toBeTruthy();
      expect(hiddenText.textContent).toBe('Loading');
    });

    it('should include message in visually hidden text when provided', () => {
      fixture.componentRef.setInput('message', 'Fetching notes');
      fixture.detectChanges();
      const hiddenText = fixture.nativeElement.querySelector('.visually-hidden');
      expect(hiddenText.textContent).toBe('Loading: Fetching notes');
    });
  });
});

describe('LoadingSpinner with wrapper component', () => {
  @Component({
    imports: [LoadingSpinner],
    template: `<app-loading-spinner [diameter]="size()" [message]="msg()" />`,
  })
  class TestHost {
    size = signal(80);
    msg = signal('Please wait...');
  }

  let fixture: ComponentFixture<TestHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('should render with bound inputs', () => {
    const paragraph = fixture.nativeElement.querySelector('p[aria-hidden="true"]');
    expect(paragraph.textContent.trim()).toBe('Please wait...');
  });

  it('should update when inputs change', () => {
    fixture.componentInstance.msg.set('Almost done...');
    fixture.detectChanges();
    const paragraph = fixture.nativeElement.querySelector('p[aria-hidden="true"]');
    expect(paragraph.textContent.trim()).toBe('Almost done...');
  });
});
