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
    this.updateBreadcrumbs();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.updateBreadcrumbs());
  }

  private updateBreadcrumbs(): void {
    const items: BreadcrumbItem[] = [];
    let current: ActivatedRoute | null = this.route.root;
    let path = '';

    // Walk down the route tree collecting titles
    while (current) {
      const segment = current.snapshot?.url.map((s) => s.path).join('/');
      if (segment) path += '/' + segment;

      const title = current.snapshot?.data?.['title'] as string | undefined;
      // Skip duplicate consecutive labels (e.g., "Admin -> Admin")
      if (title && title !== items[items.length - 1]?.label) {
        items.push({ label: title, route: path || '/' });
      }

      current = current.firstChild;
    }

    // Last item (current page) doesn't need a route
    if (items.length > 0) {
      items[items.length - 1].route = undefined;
    }

    // Only show breadcrumbs if there's more than one level
    this.items.set(items.length > 1 ? items : []);
  }
}
