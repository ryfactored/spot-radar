import { ChangeDetectionStrategy, Component, input, signal, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { SpotifyApiService, SpotifyAlbum } from '@core';
import { LoadingSpinner } from '@shared';

@Component({
  selector: 'app-saved-albums-popover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, LoadingSpinner],
  template: `
    @if (loading()) {
      <app-loading-spinner [diameter]="24" />
    } @else if (albums().length === 0) {
      <p class="empty">No saved albums found — run a full sync to update</p>
    } @else {
      <div class="header">Saved albums by this artist</div>
      @for (album of albums(); track album.id) {
        <div class="album-row">
          <img
            class="album-art"
            [src]="album.images[album.images.length - 1]?.url || 'assets/placeholder-album.png'"
            [alt]="album.name"
            width="32"
            height="32"
          />
          <div class="album-info">
            <span class="album-name">{{ album.name }}</span>
            <span class="album-year">{{ album.release_date | date: 'y' }}</span>
          </div>
          <a
            class="spotify-link"
            [href]="'https://open.spotify.com/album/' + album.id"
            target="_blank"
            rel="noopener"
            title="Open in Spotify"
          >
            ↗
          </a>
        </div>
      }
    }
  `,
  styles: `
    .header {
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--mat-sys-outline);
      margin-bottom: 8px;
    }

    .album-row {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px 0;
    }

    .album-art {
      width: 32px;
      height: 32px;
      border-radius: 4px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .album-info {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .album-name {
      font-size: 0.8125rem;
      color: var(--mat-sys-on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .album-year {
      font-size: 0.7rem;
      color: var(--mat-sys-outline);
    }

    .spotify-link {
      flex-shrink: 0;
      color: var(--mat-sys-primary);
      text-decoration: none;
      font-size: 0.875rem;
      padding: 4px;
    }

    .empty {
      font-size: 0.8125rem;
      color: var(--mat-sys-outline);
      margin: 0;
    }

    app-loading-spinner {
      display: flex;
      justify-content: center;
      padding: 8px 0;
    }
  `,
})
export class SavedAlbumsPopover implements OnInit {
  artistId = input.required<string>();

  protected loading = signal(true);
  protected albums = signal<SpotifyAlbum[]>([]);

  private spotifyApi = inject(SpotifyApiService);

  async ngOnInit(): Promise<void> {
    try {
      const result = await this.spotifyApi.getSavedAlbumsByArtist(this.artistId());
      this.albums.set(result);
    } catch {
      this.albums.set([]);
    } finally {
      this.loading.set(false);
    }
  }
}
