import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonOverlay } from './skeleton-overlay';

@Component({
  imports: [SkeletonOverlay],
  template: `<div [appSkeletonOverlay]="loading()">Content</div>`,
})
class TestComponentWithSignal {
  loading = signal(false);
}

@Component({
  imports: [SkeletonOverlay],
  template: `<div [appSkeletonOverlay]="loading">Content</div>`,
})
class TestComponentWithBoolean {
  loading = false;
}

describe('SkeletonOverlay', () => {
  describe('with signal input', () => {
    let fixture: ComponentFixture<TestComponentWithSignal>;
    let component: TestComponentWithSignal;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestComponentWithSignal],
      }).compileComponents();

      fixture = TestBed.createComponent(TestComponentWithSignal);
      component = fixture.componentInstance;
    });

    it('should not apply skeleton-overlay class when loading is false', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.classList.contains('skeleton-overlay')).toBe(false);
    });

    it('should apply skeleton-overlay class when loading is true', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.classList.contains('skeleton-overlay')).toBe(true);
    });

    it('should not have aria-busy when loading is false', () => {
      component.loading.set(false);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-busy')).toBeNull();
    });

    it('should set aria-busy="true" when loading is true', () => {
      component.loading.set(true);
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-busy')).toBe('true');
    });

    it('should toggle class and aria-busy when signal changes', () => {
      const div = fixture.nativeElement.querySelector('div');

      component.loading.set(false);
      fixture.detectChanges();
      expect(div.classList.contains('skeleton-overlay')).toBe(false);
      expect(div.getAttribute('aria-busy')).toBeNull();

      component.loading.set(true);
      fixture.detectChanges();
      expect(div.classList.contains('skeleton-overlay')).toBe(true);
      expect(div.getAttribute('aria-busy')).toBe('true');

      component.loading.set(false);
      fixture.detectChanges();
      expect(div.classList.contains('skeleton-overlay')).toBe(false);
      expect(div.getAttribute('aria-busy')).toBeNull();
    });
  });

  describe('with boolean input', () => {
    let fixture: ComponentFixture<TestComponentWithBoolean>;
    let component: TestComponentWithBoolean;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [TestComponentWithBoolean],
      }).compileComponents();

      fixture = TestBed.createComponent(TestComponentWithBoolean);
      component = fixture.componentInstance;
    });

    it('should not apply skeleton-overlay class when loading is false', () => {
      component.loading = false;
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.classList.contains('skeleton-overlay')).toBe(false);
    });

    it('should apply skeleton-overlay class when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.classList.contains('skeleton-overlay')).toBe(true);
    });

    it('should set aria-busy="true" when loading is true', () => {
      component.loading = true;
      fixture.detectChanges();
      const div = fixture.nativeElement.querySelector('div');
      expect(div.getAttribute('aria-busy')).toBe('true');
    });
  });
});
