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
      padding: 10px 14px;
      border-radius: 12px;
      width: 100%;
      text-align: left;
      border: none;
      background: transparent;
      cursor: pointer;
      opacity: 0.4;
      transition:
        opacity 0.25s ease,
        transform 0.25s ease;

      &:hover {
        opacity: 0.7;
        transform: translateY(-1px);
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
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 600;
      letter-spacing: -0.01em;
      color: #f0edf1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .sub {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.75rem;
      color: #acaaae;
    }

    .meta {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.7rem;
      color: #767579;
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
