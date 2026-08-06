import { Component, OnInit, inject, signal } from '@angular/core';
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
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.message || 'No se pudo cargar el reporte de compras');
      },
    });
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

  private today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private daysAgo(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().slice(0, 10);
  }
}
