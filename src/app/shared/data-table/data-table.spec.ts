import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { DataTable, ColumnDef } from './data-table';

interface TestRow {
  id: number;
  name: string;
}

describe('DataTable', () => {
  let component: DataTable<TestRow>;
  let fixture: ComponentFixture<DataTable<TestRow>>;

  const testColumns: ColumnDef<TestRow>[] = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
  ];

  const testData: TestRow[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DataTable, NoopAnimationsModule],
    }).compileComponents();

    fixture = TestBed.createComponent(DataTable<TestRow>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('columns', testColumns);
    fixture.componentRef.setInput('data', testData);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display correct columns', () => {
    expect(component.displayedColumns()).toEqual(['id', 'name']);
  });

  it('should include select column when selectable', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();
    expect(component.displayedColumns()).toEqual(['select', 'id', 'name']);
  });

  it('should emit row click', () => {
    const clickSpy = vi.fn();
    component.rowClick.subscribe(clickSpy);

    component.onRowClick(testData[0]);
    expect(clickSpy).toHaveBeenCalledWith(testData[0]);
  });

  it('should toggle all rows selection', () => {
    fixture.componentRef.setInput('selectable', true);
    fixture.detectChanges();

    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(2);

    component.toggleAllRows();
    expect(component.selection.selected.length).toBe(0);
  });

  it('should update data source when data input changes', () => {
    const newData = [{ id: 3, name: 'Item 3' }];
    fixture.componentRef.setInput('data', newData);
    fixture.detectChanges();
    expect(component.dataSource.data).toEqual(newData);
  });
});
