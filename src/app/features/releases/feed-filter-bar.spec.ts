import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FeedFilterBar } from './feed-filter-bar';

describe('FeedFilterBar', () => {
  let component: FeedFilterBar;
  let fixture: ComponentFixture<FeedFilterBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedFilterBar, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(FeedFilterBar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('releaseTypeFilter', 'everything');
    fixture.componentRef.setInput('minTrackCount', 0);
    fixture.componentRef.setInput('recencyDays', 90);
    fixture.componentRef.setInput('hideLive', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit releaseTypeChange when toggle group changes', () => {
    const emitted: string[] = [];
    component.releaseTypeChange.subscribe((v: string) => emitted.push(v));

    // Simulate the toggle group change event
    const toggles = fixture.nativeElement.querySelectorAll('mat-button-toggle button');
    // Click the "Albums" toggle (second one)
    (toggles[1] as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(emitted).toEqual(['album']);
  });

  it('should emit markAllSeen when mark all seen button is clicked', () => {
    let emitted = false;
    component.markAllSeen.subscribe(() => (emitted = true));

    const btn = fixture.nativeElement.querySelector(
      'button[mat-stroked-button]',
    ) as HTMLButtonElement;
    btn.click();

    expect(emitted).toBe(true);
  });

  it('should display the feed title', () => {
    const title = fixture.nativeElement.querySelector('.feed-title');
    expect(title.textContent).toContain('New Releases');
  });
});
