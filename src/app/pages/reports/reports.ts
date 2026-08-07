import {
  Component,
  OnInit,
  WritableSignal,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import {
  InventoryReportData,
  PurchasesReportData,
  ReportsService,
  SalesReportData,
} from '../../core/services/reports.service';

type ReportTab = 'sales' | 'inventory' | 'purchases';

interface PagedSlice<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rangeLabel: string;
  pageNumbers: number[];
}

@Component({
  selector: 'app-reports',
  imports: [ReactiveFormsModule, CurrencyPipe, DatePipe],
  templateUrl: './reports.html',
})
export class Reports implements OnInit {
  private readonly reportsService = inject(ReportsService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  protected readonly activeTab = signal<ReportTab>('sales');
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  protected readonly salesData = signal<SalesReportData | null>(null);
  protected readonly inventoryData = signal<InventoryReportData | null>(null);
  protected readonly purchasesData = signal<PurchasesReportData | null>(null);

  // Ventas
  protected readonly salesDayQuery = signal('');
  protected readonly salesDayPage = signal(1);
  protected readonly salesDayPageSize = signal(10);
  protected readonly salesTopQuery = signal('');
  protected readonly salesTopPage = signal(1);
  protected readonly salesTopPageSize = signal(10);

  // Inventario
  protected readonly inventoryQuery = signal('');
  protected readonly inventoryPage = signal(1);
  protected readonly inventoryPageSize = signal(10);

  // Compras
  protected readonly purchasesSupplierQuery = signal('');
  protected readonly purchasesSupplierPage = signal(1);
  protected readonly purchasesSupplierPageSize = signal(10);
  protected readonly purchasesRecentQuery = signal('');
  protected readonly purchasesRecentPage = signal(1);
  protected readonly purchasesRecentPageSize = signal(10);

  protected readonly salesByDayPaged = computed(() =>
    this.paginate(
      this.salesData()?.by_day ?? [],
      this.salesDayQuery(),
      this.salesDayPage(),
      this.salesDayPageSize(),
      (day, q) =>
        String(day.sale_date).toLowerCase().includes(q) ||
        String(day.sales_count).includes(q) ||
        String(day.total).includes(q)
    )
  );

  protected readonly salesTopPaged = computed(() =>
    this.paginate(
      this.salesData()?.top_products ?? [],
      this.salesTopQuery(),
      this.salesTopPage(),
      this.salesTopPageSize(),
      (item, q) =>
        item.sku.toLowerCase().includes(q) ||
        item.name.toLowerCase().includes(q) ||
        String(item.quantity_sold).includes(q) ||
        String(item.amount_sold).includes(q)
    )
  );

  protected readonly inventoryPaged = computed(() =>
    this.paginate(
      this.inventoryData()?.items ?? [],
      this.inventoryQuery(),
      this.inventoryPage(),
      this.inventoryPageSize(),
      (item, q) => {
        const status = this.stockLabel(item.stock_status).toLowerCase();
        const type = this.typeLabel(item.product_type).toLowerCase();
        return (
          item.sku.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category_name.toLowerCase().includes(q) ||
          type.includes(q) ||
          status.includes(q) ||
          String(item.stock).includes(q)
        );
      }
    )
  );

  protected readonly purchasesSupplierPaged = computed(() =>
    this.paginate(
      this.purchasesData()?.by_supplier ?? [],
      this.purchasesSupplierQuery(),
      this.purchasesSupplierPage(),
      this.purchasesSupplierPageSize(),
      (row, q) =>
        row.supplier_name.toLowerCase().includes(q) ||
        String(row.purchases_count).includes(q) ||
        String(row.total).includes(q)
    )
  );

  protected readonly purchasesRecentPaged = computed(() =>
    this.paginate(
      this.purchasesData()?.recent ?? [],
      this.purchasesRecentQuery(),
      this.purchasesRecentPage(),
      this.purchasesRecentPageSize(),
      (row, q) =>
        row.purchase_number.toLowerCase().includes(q) ||
        row.supplier_name.toLowerCase().includes(q) ||
        row.user_name.toLowerCase().includes(q) ||
        String(row.total).includes(q) ||
        String(row.purchased_at).toLowerCase().includes(q)
    )
  );

  protected readonly rangeForm = this.fb.nonNullable.group({
    from: [this.daysAgo(30)],
    to: [this.today()],
  });

  ngOnInit(): void {
    if (this.canSales()) {
      this.activeTab.set('sales');
      this.loadSales();
    } else if (this.canInventory()) {
      this.activeTab.set('inventory');
      this.loadInventory();
    } else if (this.canPurchases()) {
      this.activeTab.set('purchases');
      this.loadPurchases();
    }
  }

  canSales(): boolean {
    return this.auth.hasPermission('sales.view', 'sales.create');
  }

  canInventory(): boolean {
    return this.auth.hasPermission('products.view', 'products.manage');
  }

  canPurchases(): boolean {
    return this.auth.hasPermission('purchases.view', 'purchases.create');
  }

  selectTab(tab: ReportTab): void {
    this.activeTab.set(tab);
    this.error.set('');

    if (tab === 'sales') {
      this.loadSales();
    } else if (tab === 'inventory') {
      this.loadInventory();
    } else {
      this.loadPurchases();
    }
  }

  applyRange(): void {
    const tab = this.activeTab();
    if (tab === 'sales') {
      this.loadSales();
    } else if (tab === 'purchases') {
      this.loadPurchases();
    }
  }

  loadSales(): void {
    if (!this.canSales()) return;
    const { from, to } = this.rangeForm.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.reportsService.sales(from, to).subscribe({
      next: (data) => {
        this.salesData.set(data);
        this.salesDayPage.set(1);
        this.salesTopPage.set(1);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el reporte de ventas');
      },
    });
  }

  loadInventory(): void {
    if (!this.canInventory()) return;
    this.loading.set(true);
    this.error.set('');

    this.reportsService.inventory().subscribe({
      next: (data) => {
        this.inventoryData.set(data);
        this.inventoryPage.set(1);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el reporte de inventario');
      },
    });
  }

  loadPurchases(): void {
    if (!this.canPurchases()) return;
    const { from, to } = this.rangeForm.getRawValue();
    this.loading.set(true);
    this.error.set('');

    this.reportsService.purchases(from, to).subscribe({
      next: (data) => {
        this.purchasesData.set(data);
        this.purchasesSupplierPage.set(1);
        this.purchasesRecentPage.set(1);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el reporte de compras');
      },
    });
  }

  onSalesDaySearch(value: string): void {
    this.salesDayQuery.set(value);
    this.salesDayPage.set(1);
  }

  onSalesTopSearch(value: string): void {
    this.salesTopQuery.set(value);
    this.salesTopPage.set(1);
  }

  onInventorySearch(value: string): void {
    this.inventoryQuery.set(value);
    this.inventoryPage.set(1);
  }

  onPurchasesSupplierSearch(value: string): void {
    this.purchasesSupplierQuery.set(value);
    this.purchasesSupplierPage.set(1);
  }

  onPurchasesRecentSearch(value: string): void {
    this.purchasesRecentQuery.set(value);
    this.purchasesRecentPage.set(1);
  }

  goSalesDayPage(page: number): void {
    this.goPage(page, this.salesByDayPaged().totalPages, this.salesDayPage);
  }

  goSalesTopPage(page: number): void {
    this.goPage(page, this.salesTopPaged().totalPages, this.salesTopPage);
  }

  goInventoryPage(page: number): void {
    this.goPage(page, this.inventoryPaged().totalPages, this.inventoryPage);
  }

  goPurchasesSupplierPage(page: number): void {
    this.goPage(page, this.purchasesSupplierPaged().totalPages, this.purchasesSupplierPage);
  }

  goPurchasesRecentPage(page: number): void {
    this.goPage(page, this.purchasesRecentPaged().totalPages, this.purchasesRecentPage);
  }

  onSalesDayPageSize(value: string): void {
    this.salesDayPageSize.set(Number(value) || 10);
    this.salesDayPage.set(1);
  }

  onSalesTopPageSize(value: string): void {
    this.salesTopPageSize.set(Number(value) || 10);
    this.salesTopPage.set(1);
  }

  onInventoryPageSize(value: string): void {
    this.inventoryPageSize.set(Number(value) || 10);
    this.inventoryPage.set(1);
  }

  onPurchasesSupplierPageSize(value: string): void {
    this.purchasesSupplierPageSize.set(Number(value) || 10);
    this.purchasesSupplierPage.set(1);
  }

  onPurchasesRecentPageSize(value: string): void {
    this.purchasesRecentPageSize.set(Number(value) || 10);
    this.purchasesRecentPage.set(1);
  }

  stockBadge(status: string): string {
    switch (status) {
      case 'sin_stock':
        return 'text-bg-danger';
      case 'bajo':
        return 'text-bg-warning';
      case 'ok':
        return 'text-bg-success';
      default:
        return 'text-bg-secondary';
    }
  }

  stockLabel(status: string): string {
    switch (status) {
      case 'sin_stock':
        return 'Sin stock';
      case 'bajo':
        return 'Bajo';
      case 'ok':
        return 'OK';
      default:
        return 'N/A';
    }
  }

  typeLabel(type: string): string {
    switch (type) {
      case 'product':
        return 'Producto';
      case 'spare_part':
        return 'Refacción';
      case 'service':
        return 'Servicio';
      default:
        return type;
    }
  }

  private goPage(
    page: number,
    totalPages: number,
    pageSignal: WritableSignal<number>
  ): void {
    if (page < 1 || page > totalPages || page === pageSignal()) return;
    pageSignal.set(page);
  }

  private paginate<T>(
    items: T[],
    query: string,
    page: number,
    pageSize: number,
    matcher: (item: T, q: string) => boolean
  ): PagedSlice<T> {
    const q = query.trim().toLowerCase();
    const filtered = q ? items.filter((item) => matcher(item, q)) : items;
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const slice = filtered.slice(start, start + pageSize);
    const from = total ? start + 1 : 0;
    const to = Math.min(start + pageSize, total);

    const windowSize = 5;
    let startNum = Math.max(1, safePage - Math.floor(windowSize / 2));
    let endNum = Math.min(totalPages, startNum + windowSize - 1);
    startNum = Math.max(1, endNum - windowSize + 1);
    const pageNumbers = Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i);

    return {
      items: slice,
      total,
      page: safePage,
      pageSize,
      totalPages,
      rangeLabel: total ? `${from}-${to} de ${total}` : '0 resultados',
      pageNumbers,
    };
  }

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
}
