import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PurchasesService } from '../../core/services/purchases.service';
import { Purchase, PurchaseSearchField } from '../../core/models/api.models';

@Component({
  selector: 'app-purchases',
  imports: [CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './purchases.html',
})
export class Purchases implements OnInit, OnDestroy {
  private readonly purchasesService = inject(PurchasesService);
  private readonly auth = inject(AuthService);
  private readonly destroy$ = new Subject<void>();
  private readonly searchInput$ = new Subject<string>();

  protected readonly purchases = signal<Purchase[]>([]);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);
  protected readonly totalPages = signal(1);
  protected readonly searchField = signal<PurchaseSearchField>('all');
  protected readonly searchText = signal('');

  protected readonly searchFields: { value: PurchaseSearchField; label: string }[] = [
    { value: 'all', label: 'Todos los campos' },
    { value: 'purchase_number', label: 'Número' },
    { value: 'supplier', label: 'Proveedor' },
    { value: 'user', label: 'Usuario' },
    { value: 'status', label: 'Estado' },
    { value: 'total', label: 'Total' },
  ];

  protected readonly pageNumbers = computed(() => {
    const current = this.page();
    const total = this.totalPages();
    const windowSize = 5;
    let start = Math.max(1, current - Math.floor(windowSize / 2));
    let end = Math.min(total, start + windowSize - 1);
    start = Math.max(1, end - windowSize + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  protected readonly rangeLabel = computed(() => {
    const total = this.total();
    if (!total) return '0 resultados';
    const from = (this.page() - 1) * this.pageSize() + 1;
    const to = Math.min(this.page() * this.pageSize(), total);
    return `${from}-${to} de ${total}`;
  });

  protected canCreatePurchases(): boolean {
    return this.auth.hasPermission('purchases.create');
  }

  ngOnInit(): void {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((value) => {
        this.searchText.set(value);
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');

    this.purchasesService
      .listPaged({
        q: this.searchText(),
        field: this.searchField(),
        page: this.page(),
        pageSize: this.pageSize(),
      })
      .subscribe({
        next: (res) => {
          this.purchases.set(res.data ?? []);
          this.total.set(res.meta?.total ?? 0);
          this.page.set(res.meta?.page ?? 1);
          this.pageSize.set(res.meta?.pageSize ?? 10);
          this.totalPages.set(res.meta?.totalPages ?? 1);
          this.loading.set(false);
        },
        error: (err: HttpErrorResponse) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'No se pudieron cargar las compras');
        },
      });
  }

  onSearchInput(value: string): void {
    this.searchInput$.next(value);
  }

  onSearchFieldChange(value: string): void {
    this.searchField.set((value as PurchaseSearchField) || 'all');
    this.page.set(1);
    this.load();
  }

  clearSearch(): void {
    this.searchText.set('');
    this.searchField.set('all');
    this.page.set(1);
    this.load();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages() || page === this.page()) return;
    this.page.set(page);
    this.load();
  }

  onPageSizeChange(value: string): void {
    this.pageSize.set(Number(value) || 10);
    this.page.set(1);
    this.load();
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'completed':
        return 'Completada';
      case 'pending':
        return 'Pendiente';
      case 'cancelled':
        return 'Cancelada';
      default:
        return status;
    }
  }
}
