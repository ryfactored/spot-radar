import { TestBed } from '@angular/core/testing';
import { UsersStore } from './users-store';
import { type Profile } from '@features/profile/profile-service';

describe('UsersStore', () => {
  let store: UsersStore;

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
      display_name: 'Bob',
      avatar_url: null,
      bio: null,
      role: 'admin',
      created_at: '2024-01-02',
      updated_at: '2024-01-02',
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({});
    store = TestBed.inject(UsersStore);
  });

  it('should have empty initial state', () => {
    expect(store.allUsers()).toEqual([]);
    expect(store.isLoading()).toBe(false);
    expect(store.total()).toBe(0);
    expect(store.isEmpty()).toBe(true);
  });

  it('should set users', () => {
    store.setUsers(mockUsers, 2, 10, 1);
    expect(store.allUsers()).toEqual(mockUsers);
    expect(store.total()).toBe(2);
    expect(store.currentPageSize()).toBe(10);
    expect(store.currentPage()).toBe(1);
    expect(store.isEmpty()).toBe(false);
  });

  it('should set loading', () => {
    store.setLoading(true);
    expect(store.isLoading()).toBe(true);
    store.setLoading(false);
    expect(store.isLoading()).toBe(false);
  });

  it('should clear users', () => {
    store.setUsers(mockUsers, 2, 10, 1);
    store.clear();
    expect(store.allUsers()).toEqual([]);
    expect(store.isStale()).toBe(true);
  });

  it('should report stale when no data fetched', () => {
    expect(store.isStale()).toBe(true);
  });

  it('should report not stale after setUsers', () => {
    store.setUsers(mockUsers, 2, 10, 1);
    expect(store.isStale()).toBe(false);
  });

  it('should track pagination state', () => {
    store.setUsers(mockUsers, 50, 25, 2);
    expect(store.currentPageSize()).toBe(25);
    expect(store.currentPage()).toBe(2);
    expect(store.total()).toBe(50);
  });
});
