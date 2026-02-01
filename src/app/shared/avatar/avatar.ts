import { Component, computed, effect, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [MatIconModule],
  host: {
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.border-radius.%]': '50',
    '[style.font-size.px]': 'fontSize()',
  },
  template: `
    @if (showImage()) {
      <img [src]="src()" alt="Avatar" (error)="imgError.set(true)" />
    } @else if (initials()) {
      <span class="initials">{{ initials() }}</span>
    } @else {
      <mat-icon>person</mat-icon>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: var(--avatar-bg, var(--mat-sys-surface-variant, #e0e0e0));
      color: var(--avatar-color, var(--mat-sys-on-surface-variant, #666));
    }
    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .initials {
      font-weight: 500;
      line-height: 1;
    }
  `,
})
export class Avatar {
  src = input<string | null>(null);
  name = input<string | null | undefined>('');
  size = input<number>(32);

  imgError = signal(false);

  fontSize = computed(() => Math.round(this.size() * 0.4));

  initials = computed(() => {
    const n = this.name();
    if (!n) return '';
    return n
      .split(' ')
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  showImage = computed(() => !!this.src() && !this.imgError());

  constructor() {
    effect(() => {
      this.src();
      this.imgError.set(false);
    });
  }
}
