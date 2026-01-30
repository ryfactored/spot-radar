import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase';
import { mapToError } from './error-mapper';

const AVATAR_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ATTACHMENT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private supabase = inject(SupabaseService);

  validateAvatar(file: File): string | null {
    if (!AVATAR_TYPES.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }
    if (file.size > AVATAR_MAX_SIZE) {
      return 'Avatar must be less than 5MB';
    }
    return null;
  }

  validateAttachment(file: File): string | null {
    if (file.size > ATTACHMENT_MAX_SIZE) {
      return 'File must be less than 10MB';
    }
    return null;
  }

  async upload(options: {
    bucket: string;
    path: string;
    file: File;
    upsert?: boolean;
  }): Promise<{ path: string; publicUrl: string }> {
    const { bucket, path, file, upsert = false } = options;
    const { error } = await this.supabase.client.storage
      .from(bucket)
      .upload(path, file, { upsert });

    if (error) throw mapToError(error);

    const publicUrl = this.getPublicUrl(bucket, path);
    return { path, publicUrl };
  }

  getPublicUrl(bucket: string, path: string): string {
    const { data } = this.supabase.client.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }

  async createSignedUrl(bucket: string, path: string, expiresIn = 3600): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw mapToError(error);
    return data.signedUrl;
  }

  async remove(bucket: string, paths: string[]): Promise<void> {
    const { error } = await this.supabase.client.storage.from(bucket).remove(paths);
    if (error) throw mapToError(error);
  }
}
