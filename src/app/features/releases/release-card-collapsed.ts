import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card-collapsed',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe],
  template: `
    <button class="collapsed-card" (click)="onExpand()">
      <img
        class="thumb"
        [src]="release().image_url || 'assets/placeholder-album.png'"
        [alt]="release().title"
        width="36"
        height="36"
      />
      <div class="info">
        <span class="title">{{ release().title }}</span>
        <span class="sub">{{ release().artist_name }}</span>
        <span class="meta">
          {{ release().release_type | titlecase }} &middot;
          {{ release().release_date | date: 'MMM d, y' }}
        </span>
      </div>
    </button>
  `,
  styles: `
    .collapsed-card {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 8px;
      width: 100%;
      text-align: left;
      border: none;
      background: var(--mat-sys-surface-container);
      cursor: pointer;
      opacity: 0.6;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .thumb {
      width: 36px;
      height: 36px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .info {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sub {
      font-size: 0.75rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .meta {
      font-size: 0.7rem;
      color: var(--mat-sys-outline);
    }
  `,
})
export class ReleaseCardCollapsed {
  release = input.required<Release>();
  expand = output<string>();

  onExpand(): void {
    this.expand.emit(this.release().spotify_album_id);
  }
}
