import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ToastService],
    });
    service = TestBed.inject(ToastService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('success', () => {
    it('should set toast with success type', () => {
      service.success('Success message');

      expect(service.toast()).toEqual({
        type: 'success',
        title: 'Success message',
        subtitle: undefined,
      });
      expect(service.visible()).toBe(true);
    });
  });

  describe('error', () => {
    it('should set toast with error type', () => {
      service.error('Error message');

      expect(service.toast()).toEqual({
        type: 'error',
        title: 'Error message',
        subtitle: undefined,
      });
    });
  });

  describe('info', () => {
    it('should set toast with info type', () => {
      service.info('Info message');

      expect(service.toast()).toEqual({
        type: 'info',
        title: 'Info message',
        subtitle: undefined,
      });
    });
  });

  describe('dismiss', () => {
    it('should clear the toast', () => {
      service.success('Test');
      service.dismiss();

      expect(service.toast()).toBeNull();
      expect(service.visible()).toBe(false);
    });

    it('should run action when dismissed with runAction=true', () => {
      const action = vi.fn();
      service.showWithAction('Test', 'Undo', action);
      service.dismiss(true);

      expect(action).toHaveBeenCalled();
    });
  });

  describe('showWithAction', () => {
    it('should set toast with action', () => {
      const action = vi.fn();
      service.showWithAction('Dismissed', 'Undo', action);

      expect(service.toast()?.title).toBe('Dismissed');
      expect(service.toast()?.action).toBe('Undo');
    });
  });
});
