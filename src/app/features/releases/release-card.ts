import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe],
  host: { '[class.is-album]': 'release().release_type === "album"' },
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
        <div class="title-row">
          <span class="title">{{ release().title }}</span>
          @if (release().release_type !== 'album') {
            <span class="type-chip">{{ release().release_type | titlecase }}</span>
          }
        </div>
        <div class="artist-row">
          <span class="artist">{{ release().artist_name }}</span>
          @if (release().artist_source === 'saved') {
            <span class="source-chip saved" title="In your library">In library</span>
          } @else {
            <span class="source-chip followed" title="Artist you follow">Following</span>
          }
        </div>
        <div class="meta">{{ release().release_date | date: 'MMM d, y' }}</div>
        <div class="actions">
          <a class="btn-spotify" [href]="spotifyUrl()" target="_blank" rel="noopener">
            Open in Spotify
          </a>
          <button class="btn-dismiss" (click)="onDismiss()">Dismiss</button>
        </div>
      </div>
    </div>
  `,
  styles: `
    /* ── Non-album (default) ── */
    .release-card {
      display: flex;
      flex-direction: row;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--mat-sys-surface-container);
    }

    .art-wrapper {
      position: relative;
      flex-shrink: 0;
      width: 56px;
      height: 56px;
    }

    .album-art {
      width: 56px;
      height: 56px;
      border-radius: 6px;
      object-fit: cover;
      display: block;
    }

    .track-badge {
      position: absolute;
      bottom: 3px;
      right: 3px;
      background: rgba(0, 0, 0, 0.7);
      color: #fff;
      font-size: 0.6rem;
      font-weight: 600;
      padding: 1px 4px;
      border-radius: 6px;
      line-height: 1.4;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 3px;
      flex: 1;
      min-width: 0;
    }

    .title-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
    }

    .title {
      font-size: 14px;
      font-weight: 600;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-chip {
      flex-shrink: 0;
      font-size: 0.65rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 20px;
      background: var(--mat-sys-secondary-container);
      color: var(--mat-sys-on-secondary-container);
    }

    .artist-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .artist {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface-variant);
    }

    .source-chip {
      flex-shrink: 0;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 1px 6px;
      border-radius: 20px;
    }

    .source-chip.followed {
      background: transparent;
      border: 1px solid var(--mat-sys-outline-variant);
      color: var(--mat-sys-outline);
    }

    .source-chip.saved {
      background: var(--mat-sys-tertiary-container);
      color: var(--mat-sys-on-tertiary-container);
      border: none;
    }

    .meta {
      font-size: 0.7rem;
      color: var(--mat-sys-outline);
    }

    .actions {
      display: flex;
      gap: 8px;
      margin-top: 6px;
      flex-wrap: wrap;
    }

    /* ── Album overrides ── */
    :host.is-album .release-card {
      gap: 16px;
      padding: 16px;
      border-radius: 12px;
      background: var(--mat-sys-surface-container-high);
      border-left: 3px solid var(--mat-sys-primary);
    }

    :host.is-album .art-wrapper {
      width: 88px;
      height: 88px;
    }

    :host.is-album .album-art {
      width: 88px;
      height: 88px;
      border-radius: 8px;
    }

    :host.is-album .track-badge {
      bottom: 4px;
      right: 4px;
      font-size: 0.65rem;
      padding: 1px 5px;
      border-radius: 8px;
    }

    :host.is-album .title {
      font-size: 15px;
      font-weight: 700;
    }

    :host.is-album .meta {
      font-size: 0.75rem;
    }

    /* ── Buttons (shared) ── */
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
      background: var(--mat-sys-surface-container-highest);
      color: var(--mat-sys-on-surface-variant);
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: var(--mat-sys-surface-variant);
      }
    }
  `,
})
export class ReleaseCard {
  release = input.required<Release>();
  dismiss = output<string>();

  readonly spotifyUrl = computed(
    () => `https://open.spotify.com/album/${this.release().spotify_album_id}`,
  );

  onDismiss(): void {
    this.dismiss.emit(this.release().spotify_album_id);
  }
}
