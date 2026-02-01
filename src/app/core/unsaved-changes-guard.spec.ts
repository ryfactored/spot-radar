import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { unsavedChangesGuard, HasUnsavedChanges } from './unsaved-changes-guard';
import { ConfirmDialogService } from '@shared';

describe('unsavedChangesGuard', () => {
  let confirmMock: { confirm: ReturnType<typeof vi.fn> };
  let route: ActivatedRouteSnapshot;
  let state: RouterStateSnapshot;

  beforeEach(() => {
    confirmMock = {
      confirm: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [{ provide: ConfirmDialogService, useValue: confirmMock }],
    });

    route = {} as ActivatedRouteSnapshot;
    state = {} as RouterStateSnapshot;
  });

  it('should allow navigation when no unsaved changes', async () => {
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => false };

    const result = await TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component as any, route, state, state),
    );

    expect(result).toBe(true);
    expect(confirmMock.confirm).not.toHaveBeenCalled();
  });

  it('should show confirm dialog when there are unsaved changes', async () => {
    confirmMock.confirm.mockResolvedValue(true);
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => true };

    const result = await TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component as any, route, state, state),
    );

    expect(confirmMock.confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Unsaved Changes',
        confirmText: 'Leave',
      }),
    );
    expect(result).toBe(true);
  });

  it('should block navigation when user cancels', async () => {
    confirmMock.confirm.mockResolvedValue(false);
    const component: HasUnsavedChanges = { hasUnsavedChanges: () => true };

    const result = await TestBed.runInInjectionContext(() =>
      unsavedChangesGuard(component as any, route, state, state),
    );

    expect(result).toBe(false);
  });
});
