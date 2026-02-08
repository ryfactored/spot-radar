import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FilesService, type FileRecord } from '../files';
import { FilesStore } from '../files-store';
import { ToastService, ConfirmDialogService, EmptyState, TimeAgoPipe, FileSizePipe } from '@shared';
import { FileCardSkeleton } from '../file-card-skeleton';
import { extractErrorMessage } from '@core';

@Component({
  selector: 'app-files-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TimeAgoPipe,
    FileSizePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    FileCardSkeleton,
    EmptyState,
  ],
  template: `
    <div class="page-header">
      <h1>Files</h1>
      <button mat-raised-button color="primary" (click)="fileInput.click()">
        <mat-icon>upload_file</mat-icon>
        Upload files
      </button>
      <input #fileInput type="file" multiple hidden (change)="onFilesSelected($event)" />
    </div>

    @if (uploading()) {
      <mat-progress-bar mode="indeterminate"></mat-progress-bar>
    }

    @if (loading()) {
      <div class="files-grid">
        @for (i of [1, 2, 3, 4, 5, 6]; track i) {
          <app-file-card-skeleton />
        }
      </div>
    } @else if (files().length === 0) {
      <app-empty-state
        icon="folder_open"
        title="No files yet"
        message="Upload your first file to get started"
      >
        <button mat-raised-button color="primary" (click)="fileInput.click()">Upload File</button>
      </app-empty-state>
    } @else {
      <div class="files-grid">
        @for (file of files(); track file.id) {
          <mat-card class="file-card">
            <mat-card-header>
              <mat-icon mat-card-avatar class="file-icon">description</mat-icon>
              <mat-card-title class="file-name">{{ file.name }}</mat-card-title>
              <mat-card-subtitle>
                {{ file.size | fileSize }} &middot; {{ file.type }} &middot;
                {{ file.created_at | timeAgo }}
              </mat-card-subtitle>
            </mat-card-header>
            <mat-card-actions align="end">
              <button mat-button (click)="downloadFile(file)" matTooltip="Download">
                <mat-icon>download</mat-icon>
                Download
              </button>
              <button mat-button color="warn" (click)="deleteFile(file)" matTooltip="Delete">
                <mat-icon>delete</mat-icon>
                Delete
              </button>
            </mat-card-actions>
          </mat-card>
        }
      </div>
    }
  `,
  styles: `
    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(350px, 100%), 1fr));
      gap: 16px;
    }
    .file-card {
      overflow: hidden;
    }
    .file-icon {
      color: var(--mat-sys-primary, #3b82f6);
    }
    .file-name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class FilesPage implements OnInit {
  private filesService = inject(FilesService);
  private store = inject(FilesStore);
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  readonly files = this.store.allFiles;
  readonly loading = this.store.isLoading;
  uploading = signal(false);

  async ngOnInit() {
    await this.loadFiles();
  }

  async loadFiles() {
    this.store.setLoading(true);
    try {
      const result = await this.filesService.list();
      this.store.setFiles(result);
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to load files'));
    } finally {
      this.store.setLoading(false);
    }
  }

  async onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const selectedFiles = Array.from(input.files || []);
    if (selectedFiles.length === 0) return;

    this.uploading.set(true);
    try {
      for (const file of selectedFiles) {
        const record = await this.filesService.upload(file);
        this.store.addFile(record);
      }
      this.toast.success('Files uploaded successfully');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to upload file'));
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  async downloadFile(file: FileRecord) {
    try {
      const url = await this.filesService.download(file);
      window.open(url, '_blank');
    } catch (err) {
      this.toast.error(extractErrorMessage(err, 'Failed to download file'));
    }
  }

  async deleteFile(file: FileRecord) {
    const confirmed = await this.confirmDialog.confirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${file.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      this.store.removeFile(file.id);
      try {
        await this.filesService.delete(file);
        this.toast.success('File deleted');
      } catch (err) {
        this.toast.error(extractErrorMessage(err, 'Failed to delete file'));
        this.loadFiles(); // Refetch on error to restore correct state
      }
    }
  }
}
