import { TestBed } from '@angular/core/testing';
import { UsersService } from './users-service';
import { SupabaseService } from '@core';

describe('UsersService', () => {
  let service: UsersService;
  let supabaseMock: any;
  let queryMock: any;

  beforeEach(() => {
    queryMock = {
      select: vi.fn().mockImplementation((_cols: string, opts?: any) => {
        if (opts?.head) {
          return Promise.resolve({ count: 5, error: null, data: null });
        }
        return queryMock;
      }),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockResolvedValue({
        data: [
          {
            id: '1',
            email: 'a@test.com',
            display_name: 'Alice',
            role: 'user',
            created_at: '2024-01-01',
            updated_at: '2024-01-01',
            avatar_url: null,
            bio: null,
          },
        ],
        count: 1,
        error: null,
      }),
    };

    supabaseMock = {
      client: {
        from: vi.fn().mockReturnValue(queryMock),
      },
    };

    TestBed.configureTestingModule({
      providers: [UsersService, { provide: SupabaseService, useValue: supabaseMock }],
    });

    service = TestBed.inject(UsersService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should query profiles table', async () => {
    await service.list();
    expect(supabaseMock.client.from).toHaveBeenCalledWith('profiles');
  });

  it('should request exact count', async () => {
    await service.list();
    expect(queryMock.select).toHaveBeenCalledWith('*', { count: 'exact' });
  });

  it('should order by created_at descending', async () => {
    await service.list();
    expect(queryMock.order).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('should apply correct range for page 1', async () => {
    await service.list(1, 10);
    expect(queryMock.range).toHaveBeenCalledWith(0, 9);
  });

  it('should apply correct range for page 2', async () => {
    await service.list(2, 10);
    expect(queryMock.range).toHaveBeenCalledWith(10, 19);
  });

  it('should return data and count', async () => {
    const result = await service.list();
    expect(result.data).toHaveLength(1);
    expect(result.count).toBe(1);
  });

  describe('count', () => {
    it('should query with head: true', async () => {
      await service.count();
      expect(queryMock.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('should return the count', async () => {
      const result = await service.count();
      expect(result).toBe(5);
    });

    it('should throw on error', async () => {
      queryMock.select.mockImplementation((_cols: string, opts?: any) => {
        if (opts?.head) {
          return Promise.resolve({ count: null, error: { message: 'fail' } });
        }
        return queryMock;
      });
      await expect(service.count()).rejects.toThrow();
    });
  });
});
