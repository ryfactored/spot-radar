import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { Release } from './releases-service';

@Component({
  selector: 'app-release-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, TitleCasePipe],
  host: {
    '[class.is-album]': 'release().release_type === "album"',
    '[class.is-featured]': 'featured()',
  },
  template: `
    <div class="release-card">
      <div class="art-wrapper">
        <img
          class="album-art"
          [src]="release().image_url || 'assets/placeholder-album.png'"
          [alt]="release().title"
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
            <button
              class="source-chip saved clickable"
              title="See saved albums by this artist"
              (click)="onShowSavedAlbums($event)"
            >
              In library
            </button>
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
    .release-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      background: rgba(26, 26, 26, 0.6);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid transparent;
      transition:
        border-color 0.25s ease,
        transform 0.25s ease,
        box-shadow 0.25s ease;
    }

    .release-card:hover {
      border-color: rgba(72, 72, 71, 0.1);
      box-shadow: 0 48px 48px rgba(186, 158, 255, 0.05);
    }

    .art-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 1rem;
    }

    .album-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
    }

    .release-card:hover .album-art {
      transform: scale(1.05);
    }

    .track-badge {
      position: absolute;
      bottom: 8px;
      right: 8px;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #fff;
      font-family: 'Manrope', sans-serif;
      font-size: 0.65rem;
      font-weight: 700;
      padding: 2px 7px;
      border-radius: 8px;
      line-height: 1.4;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;
      padding: 0 4px 4px;
    }

    .title-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      min-width: 0;
    }

    .title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.9375rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #ffffff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-chip {
      flex-shrink: 0;
      font-family: 'Manrope', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 20px;
      background: rgba(186, 158, 255, 0.12);
      color: #ba9eff;
    }

    .artist-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .artist {
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      color: #adaaaa;
    }

    .source-chip {
      flex-shrink: 0;
      font-family: 'Manrope', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 20px;
    }

    .source-chip.followed {
      background: transparent;
      border: 1px solid rgba(72, 72, 71, 0.15);
      color: #767575;
    }

    .source-chip.saved {
      background: rgba(255, 151, 181, 0.12);
      color: #ff97b5;
      border: none;
    }

    .source-chip.clickable {
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .meta {
      font-family: 'Manrope', sans-serif;
      font-size: 0.65rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #767575;
      margin-top: 2px;
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
      padding: 8px 18px;
      border-radius: 12px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      font-weight: 700;
      text-decoration: none;
      background: linear-gradient(135deg, #8455ef, #ba9eff);
      color: #000000;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.88;
      }
    }

    .btn-dismiss {
      display: inline-flex;
      align-items: center;
      padding: 8px 18px;
      border-radius: 12px;
      font-family: 'Manrope', sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      border: none;
      background: transparent;
      color: #adaaaa;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(38, 38, 38, 0.6);
      }
    }

    /* ── Featured variant ── */
    :host.is-featured .release-card {
      padding: 16px;
    }

    :host.is-featured .title {
      font-size: 1.25rem;
      font-weight: 800;
    }

    :host.is-featured .artist {
      font-size: 0.9375rem;
    }

    :host.is-featured .meta {
      font-size: 0.7rem;
    }
  `,
})
export class ReleaseCard {
  release = input.required<Release>();
  featured = input(false);
  dismiss = output<string>();
  showSavedAlbums = output<{ artistId: string; triggerElement: HTMLElement }>();

  readonly spotifyUrl = computed(
    () => `https://open.spotify.com/album/${this.release().spotify_album_id}`,
  );

  onDismiss(): void {
    this.dismiss.emit(this.release().spotify_album_id);
  }

  onShowSavedAlbums(event: MouseEvent): void {
    this.showSavedAlbums.emit({
      artistId: this.release().spotify_artist_id,
      triggerElement: event.target as HTMLElement,
    });
  }
}
