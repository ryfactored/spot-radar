import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { httpErrorInterceptor } from './http-error-interceptor';
import { ToastService } from '../shared/toast';

describe('httpErrorInterceptor', () => {
  let httpClient: HttpClient;
  let httpTesting: HttpTestingController;
  let toastMock: { error: ReturnType<typeof vi.fn> };
  let routerMock: { navigate: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    toastMock = { error: vi.fn() };
    routerMock = { navigate: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([httpErrorInterceptor])),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: toastMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    httpClient = TestBed.inject(HttpClient);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should pass through successful requests', () => {
    httpClient.get('/api/test').subscribe((data) => {
      expect(data).toEqual({ success: true });
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ success: true });

    expect(toastMock.error).not.toHaveBeenCalled();
  });

  it('should show "Unable to connect" for network errors (status 0)', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Unable to connect to server');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.error(new ProgressEvent('error'), { status: 0 });

    expect(toastMock.error).toHaveBeenCalledWith('Unable to connect to server');
  });

  it('should show session expired and redirect for 401', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Session expired. Please log in again.');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(toastMock.error).toHaveBeenCalledWith('Session expired. Please log in again.');
    expect(routerMock.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should show permission error for 403', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('You do not have permission to perform this action');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(toastMock.error).toHaveBeenCalledWith('You do not have permission to perform this action');
  });

  it('should show not found for 404', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('The requested resource was not found');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });

    expect(toastMock.error).toHaveBeenCalledWith('The requested resource was not found');
  });

  it('should show validation error message for 422', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Email is invalid');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Email is invalid' }, { status: 422, statusText: 'Unprocessable Entity' });

    expect(toastMock.error).toHaveBeenCalledWith('Email is invalid');
  });

  it('should show default validation message for 422 without message', () => {
    httpClient.get('/api/test').subscribe({
      error: () => {},
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({}, { status: 422, statusText: 'Unprocessable Entity' });

    expect(toastMock.error).toHaveBeenCalledWith('Validation error');
  });

  it('should show server error for 500', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('Server error. Please try again later.');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });

    expect(toastMock.error).toHaveBeenCalledWith('Server error. Please try again later.');
  });

  it('should show generic error for unknown status codes', () => {
    httpClient.get('/api/test').subscribe({
      error: (err) => {
        expect(err.message).toBe('An error occurred');
      },
    });

    const req = httpTesting.expectOne('/api/test');
    req.flush({ message: 'Teapot' }, { status: 418, statusText: "I'm a teapot" });

    expect(toastMock.error).toHaveBeenCalledWith('An error occurred');
  });
});
