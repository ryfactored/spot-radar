import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConnectionIndicator } from './connection-indicator';

describe('ConnectionIndicator', () => {
  let component: ConnectionIndicator;
  let fixture: ComponentFixture<ConnectionIndicator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConnectionIndicator],
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectionIndicator);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to disconnected status', () => {
    expect(component.status()).toBe('disconnected');
    expect(component.icon()).toBe('wifi_off');
    expect(component.label()).toBe('Offline');
  });

  describe('status icons', () => {
    it('should show wifi icon when connected', () => {
      fixture.componentRef.setInput('status', 'connected');
      fixture.detectChanges();

      expect(component.icon()).toBe('wifi');
    });

    it('should show wifi icon when connecting', () => {
      fixture.componentRef.setInput('status', 'connecting');
      fixture.detectChanges();

      expect(component.icon()).toBe('wifi');
    });

    it('should show wifi_off icon when reconnecting', () => {
      fixture.componentRef.setInput('status', 'reconnecting');
      fixture.detectChanges();

      expect(component.icon()).toBe('wifi_off');
    });

    it('should show wifi_off icon when disconnected', () => {
      fixture.componentRef.setInput('status', 'disconnected');
      fixture.detectChanges();

      expect(component.icon()).toBe('wifi_off');
    });
  });

  describe('status labels', () => {
    it('should show "Live" when connected', () => {
      fixture.componentRef.setInput('status', 'connected');
      fixture.detectChanges();

      expect(component.label()).toBe('Live');
    });

    it('should show "Connecting..." when connecting', () => {
      fixture.componentRef.setInput('status', 'connecting');
      fixture.detectChanges();

      expect(component.label()).toBe('Connecting...');
    });

    it('should show "Reconnecting..." when reconnecting', () => {
      fixture.componentRef.setInput('status', 'reconnecting');
      fixture.detectChanges();

      expect(component.label()).toBe('Reconnecting...');
    });

    it('should show "Offline" when disconnected', () => {
      fixture.componentRef.setInput('status', 'disconnected');
      fixture.detectChanges();

      expect(component.label()).toBe('Offline');
    });
  });

  describe('tooltip', () => {
    it('should show realtime status in tooltip', () => {
      fixture.componentRef.setInput('status', 'connected');
      fixture.detectChanges();

      expect(component.tooltip()).toBe('Realtime: Live');
    });
  });

  describe('showLabel', () => {
    it('should not show label by default', () => {
      expect(component.showLabel()).toBe(false);

      const label = fixture.nativeElement.querySelector('.label');
      expect(label).toBeNull();
    });

    it('should show label when showLabel is true', () => {
      fixture.componentRef.setInput('showLabel', true);
      fixture.componentRef.setInput('status', 'connected');
      fixture.detectChanges();

      const label = fixture.nativeElement.querySelector('.label');
      expect(label).not.toBeNull();
      expect(label.textContent).toBe('Live');
    });
  });
});
