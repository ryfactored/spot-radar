import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { DatePipe, TitleCasePipe } from '@angular/common';
import { DomSanitizer } from '@angular/platform-browser';
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
    @if (featured()) {
      <div class="featured-card">
        <div class="featured-art-wrapper">
          <img
            class="featured-art"
            [src]="release().image_url || 'assets/placeholder-album.png'"
            [alt]="release().title"
          />
          <div class="featured-gradient"></div>
          <div class="featured-overlay">
            <span class="featured-chip">Featured Release</span>
            <h3 class="featured-title">{{ release().title }}</h3>
            <div class="featured-artist">
              {{ release().artist_name }}
              <span class="featured-meta">&middot; {{ release().track_count }} tracks</span>
            </div>
            <div class="featured-actions">
              <a class="featured-cta" [href]="spotifyUrl()" target="_blank" rel="noopener">
                Open in Spotify
              </a>
              <button class="glass-btn" (click)="onDismiss()" aria-label="Dismiss">
                <span class="glass-icon">&#x2715;</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    } @else {
      <div class="card">
        <div class="art-wrapper">
          <img
            class="album-art"
            [src]="release().image_url || 'assets/placeholder-album.png'"
            [alt]="release().title"
          />
          <div class="art-hover-overlay">
            <button class="play-btn" (click)="showPlayer.set(!showPlayer())">
              <span class="play-icon">{{ showPlayer() ? '&#x25A0;' : '&#9654;' }}</span>
            </button>
          </div>
          <button class="dismiss-btn btn-dismiss" (click)="onDismiss()" aria-label="Dismiss">
            <span>&#x2715;</span>
          </button>
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
                class="source-chip saved"
                title="See saved albums by this artist"
                (click)="onShowSavedAlbums($event)"
              >
                In library
              </button>
            } @else {
              <span class="source-chip followed">Following</span>
            }
          </div>
          <div class="bottom-row">
            <span class="date">{{ release().release_date | date: 'MMM d, y' }}</span>
            <span class="track-count">{{ release().track_count }} tracks</span>
            <a
              class="spotify-link btn-spotify"
              [href]="spotifyUrl()"
              target="_blank"
              rel="noopener"
            >
              Spotify
            </a>
          </div>
        </div>
        @if (showPlayer()) {
          <div class="player-embed">
            <iframe
              [src]="embedUrl()"
              width="100%"
              height="152"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              style="border-radius: 12px"
            ></iframe>
          </div>
        }
      </div>
    }
  `,
  styles: `
    /* ── Standard card ── */
    .card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 8px;
      border-radius: 12px;
      background: transparent;
      transition: background 0.3s ease;
    }

    .card:hover {
      background: #25252a;
    }

    .art-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: 0.5rem;
    }

    .album-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      transition: transform 700ms ease;
    }

    .card:hover .album-art {
      transform: scale(1.05);
    }

    .art-hover-overlay {
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .card:hover .art-hover-overlay {
      opacity: 1;
    }

    .play-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      border: none;
      background: linear-gradient(135deg, #8455ef, #ba9eff);
      color: #000;
      text-decoration: none;
      font-size: 18px;
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.1);
      }
    }

    .play-icon {
      margin-left: 2px;
    }

    .dismiss-btn {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: none;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #f0edf1;
      font-size: 12px;
      cursor: pointer;
      opacity: 0;
      transition: opacity 0.3s;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        background: rgba(0, 0, 0, 0.7);
      }
    }

    .card:hover .dismiss-btn {
      opacity: 1;
    }

    .content {
      display: flex;
      flex-direction: column;
      gap: 4px;
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
      font-size: 17px;
      font-weight: 700;
      letter-spacing: -0.02em;
      color: #f0edf1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .type-chip {
      flex-shrink: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      padding: 2px 8px;
      border-radius: 20px;
      background: rgba(186, 158, 255, 0.1);
      color: #ba9eff;
    }

    .artist-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .artist {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.8125rem;
      color: #acaaae;
    }

    .source-chip {
      flex-shrink: 0;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      padding: 2px 7px;
      border-radius: 20px;
      border: none;
      background: transparent;
    }

    .source-chip.followed {
      color: #767579;
    }

    .source-chip.saved {
      color: #ff97b5;
      text-decoration: underline;
      text-decoration-style: dotted;
      text-underline-offset: 2px;
      cursor: pointer;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .bottom-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 4px;
    }

    .date {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.7rem;
      font-weight: 600;
      color: #767579;
    }

    .spotify-link {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.6rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #ba9eff;
      text-decoration: none;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.8;
      }
    }

    .track-count {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.65rem;
      color: #767579;
    }

    .player-embed {
      margin-top: 8px;
      border-radius: 12px;
      overflow: hidden;
    }

    /* ── Featured card ── */
    .featured-card {
      width: 100%;
    }

    .featured-art-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      overflow: hidden;
      border-radius: 0.75rem;
    }

    .featured-art {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .featured-gradient {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        to top,
        rgba(14, 14, 17, 0.95) 0%,
        rgba(14, 14, 17, 0.6) 40%,
        transparent 70%
      );
    }

    .featured-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .featured-chip {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 4px 12px;
      border-radius: 1rem;
      background: rgba(186, 158, 255, 0.15);
      color: #ba9eff;
      width: fit-content;
    }

    .featured-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 40px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f0edf1;
      margin: 0;
      line-height: 1.1;
    }

    .featured-artist {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 1rem;
      color: #acaaae;
    }

    .featured-meta {
      font-size: 0.8rem;
      color: #767579;
    }

    .featured-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 8px;
    }

    .featured-cta {
      display: inline-flex;
      align-items: center;
      padding: 10px 24px;
      border-radius: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 0.875rem;
      font-weight: 700;
      text-decoration: none;
      background: linear-gradient(135deg, #8455ef, #ba9eff);
      color: #000;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.88;
      }
    }

    .glass-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      color: #f0edf1;
      cursor: pointer;
      transition:
        background 0.2s,
        transform 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.05);
      }
    }

    .glass-icon {
      font-size: 14px;
    }

    @media (max-width: 600px) {
      .featured-title {
        font-size: 24px;
      }

      .featured-overlay {
        padding: 16px;
      }
    }
  `,
})
export class ReleaseCard {
  private sanitizer = inject(DomSanitizer);

  release = input.required<Release>();
  featured = input(false);
  dismiss = output<string>();
  showSavedAlbums = output<{ artistId: string; triggerElement: HTMLElement }>();

  protected showPlayer = signal(false);

  readonly embedUrl = computed(() => {
    const url = `https://open.spotify.com/embed/album/${this.release().spotify_album_id}?utm_source=generator&theme=0`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  });

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
