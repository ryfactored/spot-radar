import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe],
  template: `
    <div class="release-card">
      <div class="art-wrapper">
        <img
          class="album-art"
          [src]="release().image_url || 'assets/placeholder-album.png'"
          [alt]="release().title"
          width="88"
          height="88"
        />
        <span class="track-badge">{{ release().track_count }}</span>
      </div>
      <div class="content">
        <div class="title">{{ release().title }}</div>
        <div class="artist">{{ release().artist_name }}</div>
        <div class="meta">
          {{ release().release_type | titlecase }} &middot;
          {{ release().release_date | date: 'MMM d, y' }}
        </div>
        <div class="actions">
          <a class="btn-spotify" [href]="release().spotify_url" target="_blank" rel="noopener">
            Open in Spotify
          </a>
          <button class="btn-dismiss" (click)="onDismiss()">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    .release-card {
      display: flex;
      flex-direction: row;
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
    }

    .art-wrapper {
      position: relative;
      flex-shrink: 0;
      width: 88px;
      height: 88px;
    }

    .album-art {
      width: 88px;
      height: 88px;
      border-radius: 8px;
      object-fit: cover;
      display: block;
    }

    .track-badge {
      position: absolute;
      bottom: 4px;
      right: 4px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 0.65rem;
      font-weight: 600;
      padding: 1px 5px;
      border-radius: 8px;
      line-height: 1.4;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
    }

    .title {
      font-size: 15px;
      font-weight: 700;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .artist {
      font-size: 0.875rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .meta {
      font-size: 0.75rem;
      color: var(--mat-sys-outline);
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
      flex-wrap: wrap;
    }

    .btn-spotify {
      display: inline-flex;
      align-items: center;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      background: linear-gradient(
        135deg,
        var(--mat-sys-primary),
        var(--mat-sys-tertiary, var(--mat-sys-primary))
      );
      color: var(--mat-sys-on-primary);
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.88;
      }
    }

    .btn-dismiss {
      display: inline-flex;
      align-items: center;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 0.8125rem;
      font-weight: 600;
      border: none;
      background: var(--mat-sys-surface-container);
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--mat-sys-surface-container-highest, var(--mat-sys-surface-container));
      }
    }
  `,
})
export class ReleaseCard {
  release = input.required<Release>();
  dismiss = output<string>();

  onDismiss(): void {
    this.dismiss.emit(this.release().spotify_album_id);
  }
}
