import { Injectable, inject } from '@angular/core';
import { SupabaseService, unwrapWithCount } from '@core';
import { type Profile } from '@features/profile/profile-service';
import { environment } from '@env';

export interface UsersResponse {
  data: Profile[];
  count: number;
}

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  private supabase = inject(SupabaseService);

  async count(): Promise<number> {
    const result = await this.supabase.client
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    if (result.error) throw result.error;
    return result.count ?? 0;
  }

  async list(page = 1, pageSize = environment.pagination.defaultPageSize): Promise<UsersResponse> {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    return unwrapWithCount<Profile[]>(
      await this.supabase.client
        .from('profiles')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to),
    );
  }
}
