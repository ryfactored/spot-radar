import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { AuthService, FeatureFlags } from '@core';
import { ProfileStore } from '@features/profile/profile-store';
import { ReleasesStore } from '@features/releases/releases-store';
import { ReleasesService, Release } from '@features/releases/releases-service';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe],
  template: `
    <!-- Hero Banner -->
    @if (latestRelease()) {
      <div class="hero">
        <div class="hero-content">
          <div class="hero-chips">
            <span class="hero-chip accent">New Releases</span>
            @if (releaseCount() > 0) {
              <span class="hero-chip muted">{{ releaseCount() }} in your feed</span>
            }
          </div>
          <h1 class="hero-title">{{ latestRelease()!.title }}</h1>
          <p class="hero-meta">
            {{ latestRelease()!.artist_name }}
            &middot;
            {{ latestRelease()!.release_type }}
            &middot;
            {{ latestRelease()!.release_date | date: 'y' }}
          </p>
          <div class="hero-actions">
            <a
              class="btn-primary"
              [href]="'https://open.spotify.com/album/' + latestRelease()!.spotify_album_id"
              target="_blank"
              rel="noopener"
            >
              <span class="material-icons btn-icon">play_circle</span>
              Listen Now
            </a>
            <a class="btn-ghost" routerLink="/releases">View Feed</a>
          </div>
        </div>
        <div class="hero-art">
          @if (latestRelease()!.image_url) {
            <img [src]="latestRelease()!.image_url" [alt]="latestRelease()!.title" />
          }
        </div>
      </div>
    } @else {
      <div class="hero hero-empty">
        <div class="hero-content">
          <h1 class="hero-title">Welcome, {{ greeting() }}</h1>
          <p class="hero-meta">Your new releases feed is waiting</p>
          <div class="hero-actions">
            <a class="btn-primary" routerLink="/releases">
              <span class="material-icons btn-icon">album</span>
              Go to Feed
            </a>
          </div>
        </div>
      </div>
    }

    <!-- Stats Row -->
    <div class="stats-row">
      <!-- Followed Artists -->
      <div class="stat-card">
        <div class="stat-header">
          <h2 class="stat-title">Followed Artists</h2>
          <a class="stat-action" routerLink="/releases">Manage</a>
        </div>
        <div class="stat-body">
          <div class="stat-number">
            <span class="stat-value">{{ artistCount() }}</span>
            <span class="stat-label">Artists Tracked</span>
          </div>
        </div>
      </div>

      <!-- Library Sync -->
      <div class="stat-card">
        <div class="stat-header">
          <h2 class="stat-title">Library Sync</h2>
          <a class="stat-action" routerLink="/releases">Explore Library</a>
        </div>
        <div class="stat-body">
          <div class="stat-number">
            <span class="stat-value">{{ releaseCount() }}</span>
            <span class="stat-label">Releases Found</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: 48px;
    }

    /* ── Hero ── */
    .hero {
      display: flex;
      align-items: center;
      gap: 40px;
      padding: 40px;
      border-radius: 16px;
      background: #19191d;
      overflow: hidden;
      position: relative;
    }

    .hero-empty {
      padding: 48px 40px;
    }

    .hero-content {
      flex: 1;
      min-width: 0;
      z-index: 1;
    }

    .hero-chips {
      display: flex;
      gap: 8px;
      margin-bottom: 16px;
    }

    .hero-chip {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 4px 10px;
      border-radius: 4px;
    }

    .hero-chip.accent {
      background: #ba9eff;
      color: #000;
    }

    .hero-chip.muted {
      background: rgba(255, 255, 255, 0.06);
      color: #acaaae;
    }

    .hero-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 3rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #f0edf1;
      margin: 0 0 8px;
      line-height: 1.1;
    }

    .hero-meta {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      color: #acaaae;
      margin: 0 0 24px;
    }

    .hero-actions {
      display: flex;
      gap: 12px;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 0.75rem;
      background: linear-gradient(135deg, #ba9eff, #8553f3);
      color: #000;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 700;
      text-decoration: none;
      transition: opacity 0.2s;

      &:hover {
        opacity: 0.88;
      }
    }

    .btn-icon {
      font-size: 18px;
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      padding: 12px 24px;
      border-radius: 0.75rem;
      background: transparent;
      border: 1px solid rgba(72, 72, 71, 0.3);
      color: #f0edf1;
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;

      &:hover {
        border-color: rgba(186, 158, 255, 0.3);
        color: #ba9eff;
      }
    }

    .hero-art {
      flex-shrink: 0;
      width: 200px;
      height: 200px;
      border-radius: 12px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    /* ── Stats Row ── */
    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
    }

    .stat-card {
      padding: 24px;
      border-radius: 12px;
      background: #19191d;
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .stat-title {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 18px;
      font-weight: 700;
      color: #f0edf1;
      margin: 0;
      letter-spacing: -0.01em;
    }

    .stat-action {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #767579;
      text-decoration: none;
      transition: color 0.2s;

      &:hover {
        color: #ba9eff;
      }
    }

    .stat-body {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .stat-number {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 36px;
      font-weight: 800;
      color: #ba9eff;
      letter-spacing: -0.02em;
      line-height: 1;
    }

    .stat-label {
      font-family: 'Plus Jakarta Sans', sans-serif;
      font-size: 12px;
      font-weight: 600;
      color: #767579;
    }

    /* ── Responsive ── */
    @media (max-width: 768px) {
      .hero {
        flex-direction: column;
        padding: 24px;
      }

      .hero-title {
        font-size: 2rem;
      }

      .hero-art {
        width: 100%;
        height: 200px;
      }

      .stats-row {
        grid-template-columns: 1fr;
      }
    }
  `,
})
export class Dashboard implements OnInit {
  private auth = inject(AuthService);
  private featureFlags = inject(FeatureFlags);
  private profileStore = inject(ProfileStore);
  private releasesStore = inject(ReleasesStore);
  private releasesService = inject(ReleasesService);

  readonly greeting = computed(
    () => this.profileStore.displayName() || this.auth.currentUser()?.email,
  );

  readonly latestRelease = computed((): Release | null => {
    const releases = this.releasesStore.allReleases();
    return releases.length > 0 ? releases[0] : null;
  });

  readonly artistCount = computed(() => this.releasesStore.followedArtistIds().length);
  readonly releaseCount = computed(() => this.releasesStore.totalCount());

  async ngOnInit(): Promise<void> {
    const userId = this.auth.currentUser()?.id;
    if (!userId) return;

    // Load artist count if not already loaded
    if (this.releasesStore.followedArtistIds().length === 0) {
      try {
        const ids = await this.releasesService.getUserArtistIds(userId);
        this.releasesStore.setArtistIds(ids);
      } catch {
        // Silent — dashboard is non-critical
      }
    }

    // Load latest release if not already loaded
    if (this.releasesStore.allReleases().length === 0) {
      try {
        const prefs = await this.releasesService.getPreferences(userId);
        const { data, count } = await this.releasesService.getFeed(userId, prefs, 1, 1);
        if (data.length > 0) {
          this.releasesStore.setReleases(data, count);
        }
      } catch {
        // Silent
      }
    }
  }
}
