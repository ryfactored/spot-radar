import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

describe('Avatar', () => {
  let component: Avatar;
  let fixture: ComponentFixture<Avatar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Avatar],
    }).compileComponents();

    fixture = TestBed.createComponent(Avatar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create with defaults', () => {
    expect(component).toBeTruthy();
  });

  it('should render image when src is provided', () => {
    fixture.componentRef.setInput('src', 'https://example.com/avatar.png');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();
    expect(img.src).toContain('avatar.png');
  });

  it('should render initials when src is null and name is set', () => {
    fixture.componentRef.setInput('name', 'John Doe');
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.initials');
    expect(initials).toBeTruthy();
    expect(initials.textContent.trim()).toBe('JD');
  });

  it('should compute initials correctly for single name', () => {
    fixture.componentRef.setInput('name', 'alice');
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.initials');
    expect(initials.textContent.trim()).toBe('A');
  });

  it('should compute initials correctly for multi-part name', () => {
    fixture.componentRef.setInput('name', 'John Doe');
    fixture.detectChanges();

    expect(component.initials()).toBe('JD');
  });

  it('should render person icon when no src and no name', () => {
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon).toBeTruthy();
    expect(icon.textContent.trim()).toBe('person');
  });

  it('should fall back to initials on image error', () => {
    fixture.componentRef.setInput('src', 'https://example.com/bad.png');
    fixture.componentRef.setInput('name', 'Test User');
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('img');
    expect(img).toBeTruthy();

    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    const initials = fixture.nativeElement.querySelector('.initials');
    expect(initials).toBeTruthy();
    expect(initials.textContent.trim()).toBe('TU');
  });

  it('should apply correct size to host element', () => {
    fixture.componentRef.setInput('size', 64);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.style.width).toBe('64px');
    expect(host.style.height).toBe('64px');
  });
});
