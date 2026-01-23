import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth';
import { SupabaseService } from './supabase';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    const supabaseMock = {
      client: {
        auth: {
          getSession: () => Promise.resolve({ data: { session: null } }),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: SupabaseService, useValue: supabaseMock },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
