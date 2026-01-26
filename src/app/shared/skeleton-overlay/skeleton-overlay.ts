import { Directive, HostBinding, input } from '@angular/core';

/**
 * Directive that applies a skeleton loading overlay to any element.
 * When loading is true:
 * - Adds shimmer animation
 * - Disables interaction (pointer-events: none)
 * - Sets aria-busy for screen readers
 */
@Directive({
  selector: '[appSkeletonOverlay]',
  standalone: true,
})
export class SkeletonOverlay {
  isLoading = input(false, { alias: 'appSkeletonOverlay' });

  @HostBinding('class.skeleton-overlay')
  get hasOverlay() {
    return this.isLoading();
  }

  @HostBinding('attr.aria-busy')
  get ariaBusy() {
    return this.isLoading() ? 'true' : null;
  }
}
