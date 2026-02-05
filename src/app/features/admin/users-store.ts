import { Injectable, signal, computed } from '@angular/core';
import { type Profile } from '@features/profile/profile-service';
import { environment } from '@env';

@Injectable({
  providedIn: 'root',
})
export class UsersStore {
  private users = signal<Profile[]>([]);
  private loading = signal(false);
  private lastFetch = signal<Date | null>(null);
  private totalCount = signal(0);
  private pageSize = signal(environment.pagination.defaultPageSize);
  private page = signal(1);

  readonly allUsers = this.users.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly total = this.totalCount.asReadonly();
  readonly currentPageSize = this.pageSize.asReadonly();
  readonly currentPage = this.page.asReadonly();

  readonly isEmpty = computed(() => this.users().length === 0);

  readonly isStale = computed(() => {
    const last = this.lastFetch();
    if (!last) return true;
    const ttl = environment.cacheTtlMinutes * 60 * 1000;
    return Date.now() - last.getTime() > ttl;
  });

  setUsers(users: Profile[], total: number, pageSize: number, page: number) {
    this.users.set(users);
    this.totalCount.set(total);
    this.pageSize.set(pageSize);
    this.page.set(page);
    this.lastFetch.set(new Date());
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.users.set([]);
    this.lastFetch.set(null);
  }
}
