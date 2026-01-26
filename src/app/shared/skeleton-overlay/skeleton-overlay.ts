import { Directive, HostBinding, input } from '@angular/core';

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
}
