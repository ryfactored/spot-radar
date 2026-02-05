import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  route?: string;
}

@Component({
  selector: 'app-breadcrumb',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, MatIconModule],
  template: `
    @if (items().length) {
      <nav aria-label="Breadcrumb">
        <ol class="breadcrumb-list">
          @for (item of items(); track item.label; let last = $last) {
            <li>
              @if (!last && item.route) {
                <a [routerLink]="item.route" class="breadcrumb-link">{{ item.label }}</a>
              } @else {
                <span class="breadcrumb-current" [attr.aria-current]="last ? 'page' : null">{{
                  item.label
                }}</span>
              }
            </li>
            @if (!last) {
              <li aria-hidden="true" class="breadcrumb-separator">
                <mat-icon>chevron_right</mat-icon>
              </li>
            }
          }
        </ol>
      </nav>
    }
  `,
  styles: `
    .breadcrumb-list {
      display: flex;
      align-items: center;
      list-style: none;
      margin: 0 0 16px;
      padding: 0;
      font-size: 14px;
    }

    .breadcrumb-link {
      color: var(--mat-sys-primary, #3b82f6);
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    .breadcrumb-current {
      color: var(--mat-sys-on-surface-variant, #6b7280);
    }

    .breadcrumb-separator {
      display: flex;
      align-items: center;
      margin: 0 4px;
      color: var(--mat-sys-on-surface-variant, #6b7280);

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }
  `,
})
export class Breadcrumb {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  items = signal<BreadcrumbItem[]>([]);

  constructor() {
    // Read initial route data (NavigationEnd fires before the component exists on refresh)
    let child = this.route;
    while (child.firstChild) child = child.firstChild;
    this.items.set(child.snapshot?.data['breadcrumb'] ?? []);

    // Then subscribe for future navigations
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        let child = this.route;
        while (child.firstChild) child = child.firstChild;
        const breadcrumb = child.snapshot.data['breadcrumb'] as BreadcrumbItem[] | undefined;
        this.items.set(breadcrumb ?? []);
      });
  }
}
