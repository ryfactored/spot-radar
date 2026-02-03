import { Component, input, output, signal, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '@env';

@Component({
  selector: 'app-search-input',
  standalone: true,
  imports: [
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <mat-form-field [appearance]="appearance()" class="search-field">
      <mat-icon matPrefix>search</mat-icon>
      <mat-label>{{ label() }}</mat-label>
      <input
        matInput
        [placeholder]="placeholder()"
        [ngModel]="value()"
        (ngModelChange)="onInput($event)"
        (keydown.escape)="clear()"
      />

      @if (loading()) {
        <mat-spinner matSuffix diameter="20"></mat-spinner>
      } @else if (value()) {
        <button mat-icon-button matSuffix (click)="clear()" aria-label="Clear">
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: `
    .search-field {
      width: 100%;
    }

    mat-icon[matPrefix] {
      margin-right: 8px;
      color: var(--mat-card-subtitle-text-color, #666);
    }
  `,
})
export class SearchInput implements OnInit {
  private destroyRef = inject(DestroyRef);
  private searchSubject = new Subject<string>();

  // Inputs
  placeholder = input('Search...');
  label = input('Search');
  debounceMs = input(environment.searchDebounceMs);
  loading = input(false);
  appearance = input<'fill' | 'outline'>('outline');
  initialValue = input('');

  // Outputs
  searchChange = output<string>();
  cleared = output<void>();

  // Internal state
  value = signal('');

  ngOnInit() {
    this.value.set(this.initialValue());

    this.searchSubject
      .pipe(
        debounceTime(this.debounceMs()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => {
        this.searchChange.emit(value);
      });
  }

  onInput(value: string) {
    this.value.set(value);
    this.searchSubject.next(value);
  }

  clear() {
    this.value.set('');
    this.searchSubject.next('');
    this.cleared.emit();
  }
}
