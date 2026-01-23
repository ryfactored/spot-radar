import { Component, input } from '@angular/core';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  imports: [NgStyle],
  template: `
    <div
      class="skeleton"
      [ngStyle]="{
        width: width(),
        height: height(),
        borderRadius: variant() === 'circle' ? '50%' : radius()
      }">
    </div>
  `,
  styles: `
    .skeleton {
      background: linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    :host-context(.dark-theme) .skeleton {
      background: linear-gradient(90deg, #333 25%, #444 50%, #333 75%);
      background-size: 200% 100%;
    }
  `
})
export class Skeleton {
  width = input('100%');
  height = input('1rem');
  variant = input<'text' | 'rect' | 'circle'>('text');
  radius = input('4px');
}