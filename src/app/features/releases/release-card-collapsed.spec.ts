import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReleaseCardCollapsed } from './release-card-collapsed';
import { Release } from './releases-service';

const mockRelease: Release = {
  spotify_album_id: 'album-789',
  spotify_artist_id: 'artist-456',
  artist_name: 'Test Artist',
  title: 'Test EP',
  release_type: 'ep',
  release_date: '2026-03-15',
  image_url: 'https://example.com/art.jpg',
  track_count: 5,
  artist_source: 'followed',
};

describe('ReleaseCardCollapsed', () => {
  let component: ReleaseCardCollapsed;
  let fixture: ComponentFixture<ReleaseCardCollapsed>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReleaseCardCollapsed, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(ReleaseCardCollapsed);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('release', mockRelease);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit spotify_album_id when clicked', () => {
    const emitted: string[] = [];
    component.expand.subscribe((id: string) => emitted.push(id));

    const btn = fixture.nativeElement.querySelector('.collapsed-card') as HTMLButtonElement;
    btn.click();

    expect(emitted).toEqual(['album-789']);
  });

  it('should display the release title', () => {
    const title = fixture.nativeElement.querySelector('.title');
    expect(title.textContent).toContain('Test EP');
  });
});
