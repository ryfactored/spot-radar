import { Injectable, inject } from '@angular/core';
import { SupabaseService, AuthService, StorageService, unwrap } from '@core';
import { environment } from '@env';

export interface FileRecord {
  id: string;
  user_id: string;
  name: string;
  storage_path: string;
  size: number;
  type: string;
  created_at: string;
  updated_at: string;
}

@Injectable({
  providedIn: 'root',
})
export class FilesService {
  private supabase = inject(SupabaseService);
  private auth = inject(AuthService);
  private storage = inject(StorageService);

  async list(): Promise<FileRecord[]> {
    return unwrap<FileRecord[]>(
      await this.supabase.client
        .from('files')
        .select('*')
        .order('created_at', { ascending: false }),
    );
  }

  async upload(file: File): Promise<FileRecord> {
    const error = this.storage.validateAttachment(file);
    if (error) throw new Error(error);

    const user = this.auth.currentUser();
    if (!user) throw new Error('Please sign in to continue');

    const timestamp = Date.now();
    const path = `${user.id}/${timestamp}-${file.name}`;

    await this.storage.upload({
      bucket: environment.storageBuckets.files,
      path,
      file,
    });

    return unwrap<FileRecord>(
      await this.supabase.client
        .from('files')
        .insert({
          user_id: user.id,
          name: file.name,
          storage_path: path,
          size: file.size,
          type: file.type,
        })
        .select()
        .single(),
    );
  }

  async download(record: FileRecord): Promise<string> {
    return this.storage.createSignedUrl(environment.storageBuckets.files, record.storage_path);
  }

  async delete(record: FileRecord): Promise<void> {
    unwrap(await this.supabase.client.from('files').delete().eq('id', record.id));
    await this.storage.remove(environment.storageBuckets.files, [record.storage_path]);
  }
}
