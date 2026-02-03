import { Directive, input } from '@angular/core';

/**
 * Directive that applies a skeleton loading overlay to any element.
 * When loading is true:
 * - Adds shimmer animation
 * - Disables interaction (pointer-events: none)
 * - Sets aria-busy for screen readers
 */
@Directive({
  selector: '[appSkeletonOverlay]',
  host: {
    '[class.skeleton-overlay]': 'isLoading()',
    '[attr.aria-busy]': 'isLoading() ? "true" : null',
  },
})
export class SkeletonOverlay {
  isLoading = input(false, { alias: 'appSkeletonOverlay' });
}
