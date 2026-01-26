import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SkeletonOverlay } from './skeleton-overlay';

@Component({
  standalone: true,
  imports: [SkeletonOverlay],
  template: `<div [appSkeletonOverlay]="loading">Content</div>`,
})
class TestComponent {
  loading = false;
}

describe('SkeletonOverlay', () => {
  let fixture: ComponentFixture<TestComponent>;
  let component: TestComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TestComponent);
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
});
