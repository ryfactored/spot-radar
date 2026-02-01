import { Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FilesService, type FileRecord } from '../files';
import { ToastService, ConfirmDialogService, LoadingSpinner, EmptyState } from '@shared';

@Component({
  selector: 'app-files-page',
  standalone: true,
  imports: [
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    LoadingSpinner,
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
      <app-loading-spinner message="Loading files..." />
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
                {{ formatFileSize(file.size) }} &middot; {{ file.type }} &middot;
                {{ file.created_at | date: 'medium' }}
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
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }
    .file-card {
      overflow: hidden;
    }
    .file-icon {
      color: #757575;
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
  private toast = inject(ToastService);
  private confirmDialog = inject(ConfirmDialogService);

  files = signal<FileRecord[]>([]);
  loading = signal(false);
  uploading = signal(false);

  async ngOnInit() {
    await this.loadFiles();
  }

  async loadFiles() {
    this.loading.set(true);
    try {
      const result = await this.filesService.list();
      this.files.set(result);
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to load files');
    } finally {
      this.loading.set(false);
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
        this.files.update((existing) => [record, ...existing]);
      }
      this.toast.success('Files uploaded successfully');
    } catch (err) {
      this.toast.error(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      this.uploading.set(false);
      input.value = '';
    }
  }

  async downloadFile(file: FileRecord) {
    try {
      const url = await this.filesService.download(file);
      window.open(url, '_blank');
    } catch {
      this.toast.error('Failed to download file');
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
      try {
        await this.filesService.delete(file);
        this.files.update((existing) => existing.filter((f) => f.id !== file.id));
        this.toast.success('File deleted');
      } catch (err) {
        this.toast.error(err instanceof Error ? err.message : 'Failed to delete file');
      }
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
