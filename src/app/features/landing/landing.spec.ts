import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Landing } from './landing';

describe('Landing', () => {
  let component: Landing;
  let fixture: ComponentFixture<Landing>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Landing],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Landing);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display hero section', () => {
    const hero = fixture.nativeElement.querySelector('.hero');
    expect(hero).toBeTruthy();
    expect(hero.textContent).toContain('Build Modern Web Apps Faster');
  });

  it('should display feature cards', () => {
    const cards = fixture.nativeElement.querySelectorAll('.feature-card');
    expect(cards.length).toBe(6);
  });

  it('should have call to action buttons', () => {
    const buttons = fixture.nativeElement.querySelectorAll('.hero-actions a');
    expect(buttons.length).toBe(2);
  });
});
