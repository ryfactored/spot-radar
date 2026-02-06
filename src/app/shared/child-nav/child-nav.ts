import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  Router,
  NavigationEnd,
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter } from 'rxjs';

export interface ChildNavItem {
  label: string;
  route: string;
  icon?: string;
}

@Component({
  selector: 'app-child-nav',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, RouterLinkActive, MatTabsModule, MatIconModule],
  template: `
    @if (items().length) {
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="child-nav">
        @for (item of items(); track item.route) {
          <a
            mat-tab-link
            [routerLink]="item.route"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive"
            [routerLinkActiveOptions]="{ exact: isParentRoute(item.route) }"
          >
            @if (item.icon) {
              <mat-icon class="tab-icon">{{ item.icon }}</mat-icon>
            }
            {{ item.label }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
    }
  `,
  styles: `
    .child-nav {
      margin-bottom: 16px;
    }

    .tab-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      margin-right: 8px;
    }
  `,
})
export class ChildNav {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  items = signal<ChildNavItem[]>([]);

  constructor() {
    this.updateItems();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.updateItems());
  }

  isParentRoute(route: string): boolean {
    return this.items().some((item) => item.route !== route && item.route.startsWith(route + '/'));
  }

  private updateItems(): void {
    let child = this.route;
    while (child.firstChild) child = child.firstChild;

    let current: ActivatedRoute | null = child;
    while (current) {
      const childNav = current.snapshot.data['childNav'] as ChildNavItem[] | undefined;
      if (childNav) {
        this.items.set(childNav);
        return;
      }
      current = current.parent;
    }
    this.items.set([]);
  }
}
