import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { signal } from '@angular/core';

import { UsersList } from './users-list';
import { UsersService } from '../users-service';
import { UsersStore } from '../users-store';
import { ToastService } from '@shared';
import { type Profile } from '@features/profile/profile-service';

describe('UsersList', () => {
  let component: UsersList;
  let fixture: ComponentFixture<UsersList>;
  let usersServiceMock: any;
  let usersStoreMock: any;
  let toastMock: any;

  const mockUsers: Profile[] = [
    {
      id: '1',
      email: 'a@test.com',
      display_name: 'Alice',
      avatar_url: null,
      bio: null,
      role: 'user',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    },
    {
      id: '2',
      email: 'b@test.com',
      display_name: null,
      avatar_url: null,
      bio: null,
      role: 'admin',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(async () => {
    usersServiceMock = {
      list: vi.fn().mockResolvedValue({ data: mockUsers, count: 2 }),
    };

    usersStoreMock = {
      allUsers: signal(mockUsers),
      isLoading: signal(false),
      total: signal(2),
      currentPageSize: signal(10),
      currentPage: signal(1),
      isEmpty: vi.fn().mockReturnValue(false),
      isStale: vi.fn().mockReturnValue(true),
      setLoading: vi.fn(),
      setUsers: vi.fn(),
    };

    toastMock = {
      success: vi.fn(),
      error: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [UsersList, NoopAnimationsModule],
      providers: [
        { provide: UsersService, useValue: usersServiceMock },
        { provide: UsersStore, useValue: usersStoreMock },
        { provide: ToastService, useValue: toastMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UsersList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init when store is stale', async () => {
    expect(usersServiceMock.list).toHaveBeenCalled();
  });

  it('should not load users when store has fresh data', async () => {
    usersStoreMock.isEmpty.mockReturnValue(false);
    usersStoreMock.isStale.mockReturnValue(false);
    usersServiceMock.list.mockClear();

    const freshFixture = TestBed.createComponent(UsersList);
    await freshFixture.whenStable();

    expect(usersServiceMock.list).not.toHaveBeenCalled();
  });

  it('should display data table', () => {
    fixture.detectChanges();
    const table = fixture.nativeElement.querySelector('app-data-table');
    expect(table).toBeTruthy();
  });

  it('should have 5 columns defined', () => {
    expect(component.columns()).toHaveLength(5);
    expect(component.columns().map((c: any) => c.key)).toEqual([
      'avatar',
      'email',
      'display_name',
      'role',
      'created_at',
    ]);
  });

  it('should render dash for null display_name', () => {
    const displayNameCol = component.columns().find((c: any) => c.key === 'display_name')!;
    expect(displayNameCol.cell!(mockUsers[1])).toBe('—');
  });

  it('should format created_at as localized date', () => {
    const createdAtCol = component.columns().find((c: any) => c.key === 'created_at')!;
    const result = createdAtCol.cell!(mockUsers[0]);
    expect(result).toBeTruthy();
    expect(result).not.toBe('2024-01-01');
  });

  describe('pagination', () => {
    it('should update page on page change', () => {
      component.onPageChange({ pageIndex: 2, pageSize: 10, length: 100 });
      expect(component.currentPage()).toBe(3);
    });

    it('should update pageSize on page change', () => {
      component.onPageChange({ pageIndex: 0, pageSize: 25, length: 100 });
      expect(component.pageSize()).toBe(25);
    });

    it('should call loadUsers on page change', () => {
      component.onPageChange({ pageIndex: 1, pageSize: 10, length: 20 });
      expect(usersStoreMock.setLoading).toHaveBeenCalledWith(true);
    });
  });

  describe('error handling', () => {
    it('should show error toast when loading fails', async () => {
      usersServiceMock.list.mockRejectedValue(new Error('Load failed'));
      await component.loadUsers();
      expect(toastMock.error).toHaveBeenCalledWith('Load failed');
    });

    it('should set loading to false after error', async () => {
      usersServiceMock.list.mockRejectedValue(new Error('Load failed'));
      await component.loadUsers();
      expect(usersStoreMock.setLoading).toHaveBeenCalledWith(false);
    });
  });
});
