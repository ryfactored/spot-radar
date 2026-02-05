import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { PageEvent } from '@angular/material/paginator';
import { UsersService } from '../users-service';
import { UsersStore } from '../users-store';
import { Avatar, DataTable, type ColumnDef, EmptyState, ToastService } from '@shared';
import { extractErrorMessage } from '@core';
import { type Profile } from '@features/profile/profile-service';
import { environment } from '@env';

@Component({
  selector: 'app-users-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DataTable, EmptyState, Avatar],
  template: `
    <ng-template #avatarTpl let-row>
      <app-avatar [src]="row.avatar_url" [name]="row.display_name || row.email" [size]="28" />
    </ng-template>

    <div class="page-header">
      <h1>Users</h1>
    </div>

    @if (!loading() && users().length === 0) {
      <app-empty-state icon="group" title="No users" message="No registered users found" />
    } @else {
      <app-data-table
        [columns]="columns()"
        [data]="users()"
        [totalItems]="totalCount()"
        [pageSize]="pageSize()"
        [pageIndex]="currentPage() - 1"
        [paginate]="true"
        emptyMessage="No users found"
        (pageChange)="onPageChange($event)"
      />
    }
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class UsersList implements OnInit {
  private usersService = inject(UsersService);
  private store = inject(UsersStore);
  private toast = inject(ToastService);

  users = this.store.allUsers;
  loading = this.store.isLoading;
  totalCount = this.store.total;

  currentPage = signal(1);
  pageSize = signal(environment.pagination.defaultPageSize);

  private avatarTpl = viewChild.required<TemplateRef<unknown>>('avatarTpl');

  columns = computed<ColumnDef<Profile>[]>(() => [
    { key: 'avatar', header: '', cellTemplate: this.avatarTpl(), sortable: false },
    { key: 'email', header: 'Email' },
    { key: 'display_name', header: 'Display Name', cell: (row) => row.display_name || '—' },
    { key: 'role', header: 'Role' },
    {
      key: 'created_at',
      header: 'Joined',
      cell: (row) => new Date(row.created_at).toLocaleDateString(),
    },
  ]);

  async ngOnInit() {
    if (!this.store.isEmpty() && !this.store.isStale()) {
      this.pageSize.set(this.store.currentPageSize());
      this.currentPage.set(this.store.currentPage());
      return;
    }
    await this.loadUsers();
  }

  async loadUsers() {
    this.store.setLoading(true);
    try {
      const response = await this.usersService.list(this.currentPage(), this.pageSize());
      this.store.setUsers(response.data, response.count, this.pageSize(), this.currentPage());
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load users'));
    } finally {
      this.store.setLoading(false);
    }
  }

  onPageChange(event: PageEvent) {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.loadUsers();
  }
}
