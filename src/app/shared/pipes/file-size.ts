import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats a file size in bytes to a human-readable string.
 * Examples: 512 B, 1.5 KB, 2.3 MB, 1.0 GB
 */
@Pipe({ name: 'fileSize' })
export class FileSizePipe implements PipeTransform {
  transform(bytes: number | null | undefined): string {
    if (bytes == null || bytes < 0) return '';

    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  }
}
