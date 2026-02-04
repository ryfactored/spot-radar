import { Injectable, signal, computed } from '@angular/core';
import { FileRecord } from './files';

@Injectable({
  providedIn: 'root',
})
export class FilesStore {
  private files = signal<FileRecord[]>([]);
  private loading = signal(false);

  readonly allFiles = this.files.asReadonly();
  readonly isLoading = this.loading.asReadonly();
  readonly isEmpty = computed(() => this.files().length === 0);

  setFiles(files: FileRecord[]) {
    this.files.set(files);
  }

  addFile(file: FileRecord) {
    this.files.update((f) => [file, ...f]);
  }

  removeFile(id: string) {
    this.files.update((f) => f.filter((x) => x.id !== id));
  }

  setLoading(loading: boolean) {
    this.loading.set(loading);
  }

  clear() {
    this.files.set([]);
  }
}
