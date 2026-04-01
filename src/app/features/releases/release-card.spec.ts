import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReleaseCard } from './release-card';
import { Release } from './releases-service';

const mockRelease: Release = {
  spotify_album_id: 'album-123',
  spotify_artist_id: 'artist-456',
  artist_name: 'Test Artist',
  title: 'Test Album',
  release_type: 'album',
  release_date: '2026-03-30',
  image_url: 'https://example.com/art.jpg',
  track_count: 10,
  artist_source: 'followed',
};

describe('ReleaseCard', () => {
  let component: ReleaseCard;
  let fixture: ComponentFixture<ReleaseCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCard, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleaseCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('release', mockRelease);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit spotify_album_id when dismiss is clicked', () => {
    const emitted: string[] = [];
    component.dismiss.subscribe((id: string) => emitted.push(id));

    const dismissBtn = fixture.nativeElement.querySelector('.btn-dismiss') as HTMLButtonElement;
    dismissBtn.click();

    expect(emitted).toEqual(['album-123']);
  });

  it('should display the release title', () => {
    const title = fixture.nativeElement.querySelector('.title');
    expect(title.textContent).toContain('Test Album');
  });

  it('should render the Spotify link with the correct href', () => {
    const link = fixture.nativeElement.querySelector('.btn-spotify') as HTMLAnchorElement;
    expect(link.href).toBe('https://open.spotify.com/album/album-123');
  });
});
