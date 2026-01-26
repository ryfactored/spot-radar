import { Component, input, output, computed, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';

export interface ColumnDef<T = any> {
  key: string;
  header: string;
  sortable?: boolean;
  cell?: (row: T) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [MatTableModule, MatSortModule, MatPaginatorModule, MatCheckboxModule],
  template: `
    <div class="table-container">
      <table mat-table [dataSource]="dataSource" matSort>
        <!-- Selection Column -->
        @if (selectable()) {
          <ng-container matColumnDef="select">
            <th mat-header-cell *matHeaderCellDef>
              <mat-checkbox
                (change)="$event ? toggleAllRows() : null"
                [checked]="selection.hasValue() && isAllSelected()"
                [indeterminate]="selection.hasValue() && !isAllSelected()"
                aria-label="Select all rows">
              </mat-checkbox>
            </th>
            <td mat-cell *matCellDef="let row; let i = index">
              <mat-checkbox
                (click)="$event.stopPropagation()"
                (change)="$event ? selection.toggle(row) : null"
                [checked]="selection.isSelected(row)"
                [attr.aria-label]="'Select row ' + (i + 1)">
              </mat-checkbox>
            </td>
          </ng-container>
        }

        <!-- Dynamic Columns -->
        @for (column of columns(); track column.key) {
          <ng-container [matColumnDef]="column.key">
            @if (column.sortable !== false) {
              <th mat-header-cell *matHeaderCellDef mat-sort-header>
                {{ column.header }}
              </th>
            } @else {
              <th mat-header-cell *matHeaderCellDef>
                {{ column.header }}
              </th>
            }
            <td mat-cell *matCellDef="let row">
              {{ column.cell ? column.cell(row) : row[column.key] }}
            </td>
          </ng-container>
        }

        <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns()"
            [class.clickable]="true"
            (click)="onRowClick(row)"></tr>

        <!-- No data row -->
        <tr class="mat-row no-data-row" *matNoDataRow>
          <td class="mat-cell" [attr.colspan]="displayedColumns().length">
            {{ emptyMessage() }}
          </td>
        </tr>
      </table>

      @if (paginate()) {
        <mat-paginator
          [length]="totalItems() ?? dataSource.data.length"
          [pageSizeOptions]="pageSizeOptions()"
          [pageSize]="pageSize()"
          [pageIndex]="pageIndex()"
          (page)="onPageChange($event)"
          showFirstLastButtons>
        </mat-paginator>
      }
    </div>
  `,
  styles: `
    .table-container {
      overflow-x: auto;
    }

    table {
      width: 100%;
    }

    .clickable {
      cursor: pointer;
    }

    .clickable:hover {
      background: rgba(0, 0, 0, 0.04);
    }

    :host-context(.dark-mode) .clickable:hover {
      background: rgba(255, 255, 255, 0.04);
    }

    .no-data-row td {
      text-align: center;
      padding: 24px;
      color: #666;
    }

    :host-context(.dark-mode) .no-data-row td {
      color: #aaa;
    }
  `
})
export class DataTable<T = any> implements AfterViewInit, OnChanges {
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  // Inputs
  columns = input.required<ColumnDef<T>[]>();
  data = input.required<T[]>();
  selectable = input(false);
  paginate = input(true);
  pageSize = input(10);
  pageIndex = input(0);
  pageSizeOptions = input([5, 10, 25, 50]);
  emptyMessage = input('No data available');
  totalItems = input<number | undefined>(undefined); // For server-side pagination

  // Outputs
  rowClick = output<T>();
  selectionChange = output<T[]>();
  pageChange = output<PageEvent>();

  // Internal state
  dataSource = new MatTableDataSource<T>([]);
  selection = new SelectionModel<T>(true, []);

  displayedColumns = computed(() => {
    const cols = this.columns().map(c => c.key);
    return this.selectable() ? ['select', ...cols] : cols;
  });

  constructor() {
    // Watch for selection changes
    this.selection.changed.subscribe(() => {
      this.selectionChange.emit(this.selection.selected);
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
    // Only connect paginator for client-side pagination (when totalItems is not set)
    if (this.paginate() && this.totalItems() === undefined) {
      this.dataSource.paginator = this.paginator;
    }
    // Initial data
    this.dataSource.data = this.data();
  }

  // Update data source when data input changes
  ngOnChanges(changes: SimpleChanges) {
    if (changes['data']) {
      this.dataSource.data = this.data();
      // Clear selection when data changes to avoid stale references
      this.selection.clear();
    }
  }

  onRowClick(row: T) {
    this.rowClick.emit(row);
  }

  onPageChange(event: PageEvent) {
    this.pageChange.emit(event);
  }

  isAllSelected(): boolean {
    const numRows = this.dataSource.data.length;
    if (numRows === 0) return false;
    return this.selection.selected.length === numRows;
  }

  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
    } else {
      this.dataSource.data.forEach(row => this.selection.select(row));
    }
  }

  clearSelection() {
    this.selection.clear();
  }
}
