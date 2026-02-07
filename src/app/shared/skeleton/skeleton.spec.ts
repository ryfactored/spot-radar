import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';

import { Skeleton } from './skeleton';

describe('Skeleton', () => {
  let component: Skeleton;
  let fixture: ComponentFixture<Skeleton>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Skeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(Skeleton);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('default values', () => {
    it('should have default width of 100%', () => {
      expect(component.width()).toBe('100%');
    });

    it('should have default height of 1rem', () => {
      expect(component.height()).toBe('1rem');
    });

    it('should have default variant of text', () => {
      expect(component.variant()).toBe('text');
    });

    it('should have default radius of 4px', () => {
      expect(component.radius()).toBe('4px');
    });
  });

  describe('styles', () => {
    it('should apply width and height to skeleton div', () => {
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.width).toBe('100%');
      expect(div.style.height).toBe('1rem');
    });

    it('should apply custom width and height', () => {
      fixture.componentRef.setInput('width', '200px');
      fixture.componentRef.setInput('height', '50px');
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.width).toBe('200px');
      expect(div.style.height).toBe('50px');
    });

    it('should apply border-radius from radius input for text variant', () => {
      fixture.componentRef.setInput('radius', '8px');
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.borderRadius).toBe('8px');
    });
  });

  describe('variants', () => {
    it('should apply 50% border-radius for circle variant', () => {
      fixture.componentRef.setInput('variant', 'circle');
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.borderRadius).toBe('50%');
    });

    it('should apply custom radius for rect variant', () => {
      fixture.componentRef.setInput('variant', 'rect');
      fixture.componentRef.setInput('radius', '12px');
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.borderRadius).toBe('12px');
    });

    it('should ignore custom radius when circle variant', () => {
      fixture.componentRef.setInput('variant', 'circle');
      fixture.componentRef.setInput('radius', '12px');
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('.skeleton');
      expect(div.style.borderRadius).toBe('50%');
    });
  });
});

describe('Skeleton with wrapper component', () => {
  @Component({
    imports: [Skeleton],
    template: `<app-skeleton [width]="width()" [height]="height()" [variant]="variant()" />`,
  })
  class TestHost {
    width = signal('150px');
    height = signal('20px');
    variant = signal<'text' | 'rect' | 'circle'>('rect');
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
    const div = fixture.nativeElement.querySelector('.skeleton');
    expect(div.style.width).toBe('150px');
    expect(div.style.height).toBe('20px');
  });

  it('should update when inputs change', () => {
    fixture.componentInstance.width.set('300px');
    fixture.detectChanges();
    const div = fixture.nativeElement.querySelector('.skeleton');
    expect(div.style.width).toBe('300px');
  });
});
