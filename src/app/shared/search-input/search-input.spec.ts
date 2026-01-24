import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { SearchInput } from './search-input';

describe('SearchInput', () => {
  let component: SearchInput;
  let fixture: ComponentFixture<SearchInput>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInput, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInput);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit search after debounce', async () => {
    const searchSpy = vi.fn();
    component.search.subscribe(searchSpy);

    component.onInput('test');
    expect(searchSpy).not.toHaveBeenCalled();

    // Wait for debounce (300ms + buffer)
    await new Promise(resolve => setTimeout(resolve, 350));
    expect(searchSpy).toHaveBeenCalledWith('test');
  });

  it('should clear value and emit', () => {
    const clearedSpy = vi.fn();
    component.cleared.subscribe(clearedSpy);

    component.value = 'test';
    component.clear();

    expect(component.value).toBe('');
    expect(clearedSpy).toHaveBeenCalled();
  });

  it('should set initial value from input', () => {
    fixture.componentRef.setInput('initialValue', 'initial');
    component.ngOnInit();
    expect(component.value).toBe('initial');
  });
});
