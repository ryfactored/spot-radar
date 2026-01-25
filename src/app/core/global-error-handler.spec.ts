import { TestBed } from '@angular/core/testing';

import { GlobalErrorHandler } from './global-error-handler';
import { ToastService } from '../shared/toast';

describe('GlobalErrorHandler', () => {
  let handler: GlobalErrorHandler;
  let toastMock: { error: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastMock = {
      error: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: ToastService, useValue: toastMock },
      ],
    });
    handler = TestBed.inject(GlobalErrorHandler);
  });

  it('should be created', () => {
    expect(handler).toBeTruthy();
  });

  it('should handle errors and show user-friendly toast', () => {
    const error = new Error('Test error');
    handler.handleError(error);
    // Error mapper converts unknown errors to user-friendly messages
    expect(toastMock.error).toHaveBeenCalledWith('Something went wrong. Please try again.');
  });

  it('should map known error codes to friendly messages', () => {
    const error = { code: 'invalid_credentials', message: 'Invalid login credentials' };
    handler.handleError(error);
    expect(toastMock.error).toHaveBeenCalledWith('Invalid email or password');
  });
});
